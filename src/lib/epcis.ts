import type { ConsignmentBundle, StoredTelemetryFrame } from "./types";

function summarizeTelemetry(frames: StoredTelemetryFrame[]) {
  if (frames.length === 0) {
    return {
      minTemp: 0,
      maxTemp: 0,
      meanTemp: 0,
      meanHumidity: 0,
      peakEthylene: 0,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
    };
  }
  const temps = frames.map((f) => f.tempC);
  const hums = frames.map((f) => f.humidityRh);
  const eths = frames.map((f) => f.ethylenePpm);
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

  return {
    minTemp: Number(Math.min(...temps).toFixed(2)),
    maxTemp: Number(Math.max(...temps).toFixed(2)),
    meanTemp: Number((sum(temps) / temps.length).toFixed(2)),
    meanHumidity: Number((sum(hums) / hums.length).toFixed(2)),
    peakEthylene: Number(Math.max(...eths).toFixed(2)),
    startTime: frames[0].timestampIso,
    endTime: frames[frames.length - 1].timestampIso,
  };
}

export function buildEpcisDocument(bundle: ConsignmentBundle) {
  const { consignment, device, frames, custodyEvents, anchors } = bundle;
  const stats = summarizeTelemetry(frames);
  const latestAnchor = anchors[anchors.length - 1];

  const events = custodyEvents.map((ev, index) => {
    const isLast = index === custodyEvents.length - 1;
    const baseEvent: Record<string, unknown> = {
      type: "ObjectEvent",
      eventID: `urn:uuid:${ev.id}`,
      eventTime: ev.timestampIso,
      eventTimeZoneOffset: "+05:30",
      epcList: [consignment.epcUrn],
      action: "OBSERVE",
      bizStep: ev.bizStep,
      disposition: ev.disposition,
      readPoint: { id: ev.readPointGln },
      bizLocation: { id: ev.readPointGln },
      ilmd: {
        lotNumber: consignment.tlc,
        commodity: consignment.commodity,
        variety: consignment.variety,
        quantityKg: consignment.quantityKg,
      },
    };

    if (isLast && frames.length > 0) {
      baseEvent.sensorElementList = [
        {
          sensorMetadata: {
            time: stats.endTime,
            deviceID: `urn:epc:id:giai:8904001.${device.id.toLowerCase()}`,
            startTime: stats.startTime,
            endTime: stats.endTime,
            bizRules: "https://ref.gs1.org/cbv/bdr:StandardCooling",
          },
          sensorReport: [
            {
              type: "Temperature",
              minValue: stats.minTemp,
              maxValue: stats.maxTemp,
              meanValue: stats.meanTemp,
              uom: "CEL",
            },
            {
              type: "Humidity",
              value: stats.meanHumidity,
              uom: "P1",
            },
            {
              type: "https://sakshi.trace.gov.in/cbv/sensor/EthyleneConcentration",
              value: stats.peakEthylene,
              uom: "PPM",
            },
          ],
        },
      ];
    }

    return baseEvent;
  });

  return {
    "@context": [
      "https://ref.gs1.org/standards/epcis/2.0.0/epcis-context.jsonld",
    ],
    type: "EPCISDocument",
    schemaVersion: "2.0",
    creationDate: new Date().toISOString(),
    sakshiLedgerProof: latestAnchor
      ? {
          networkMode: latestAnchor.networkMode,
          txId: latestAnchor.txId,
          merkleRoot: latestAnchor.merkleRoot,
          verifiedFrames: frames.length,
        }
      : null,
    epcisBody: {
      eventList: events,
    },
  };
}

function csvEscape(value: string | number | boolean): string {
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildFsma204Csv(bundle: ConsignmentBundle): string {
  const { consignment, device, frames, custodyEvents, verification } = bundle;
  const stats = summarizeTelemetry(frames);

  const headers = [
    "Traceability_Lot_Code_TLC",
    "Consignment_ID",
    "Commodity",
    "Variety",
    "Quantity_Kg",
    "Critical_Tracking_Event_CTE",
    "Event_Timestamp_ISO",
    "Location_Description",
    "Read_Point_GLN",
    "Actor_Custodian",
    "IoT_Device_ID",
    "Temp_Min_C",
    "Temp_Max_C",
    "Mean_Temp_C",
    "Peak_Ethylene_PPM",
    "Crypto_Chain_Verified",
  ];

  const rows = custodyEvents.map((ev) =>
    [
      consignment.tlc,
      consignment.id,
      consignment.commodity,
      consignment.variety,
      consignment.quantityKg,
      ev.bizStep.toUpperCase(),
      ev.timestampIso,
      ev.locationName,
      ev.readPointGln,
      ev.actor,
      device.id,
      stats.minTemp,
      stats.maxTemp,
      stats.meanTemp,
      stats.peakEthylene,
      verification.valid ? "VERIFIED_ECDSA_P256" : "INTEGRITY_ALERT",
    ]
      .map(csvEscape)
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}
