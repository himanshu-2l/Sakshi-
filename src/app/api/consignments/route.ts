import { NextResponse } from "next/server";
import { listConsignmentBundles } from "@/lib/ledger";

export async function GET() {
  const bundles = await listConsignmentBundles();
  return NextResponse.json({
    consignments: bundles.map((b) => ({
      consignment: b.consignment,
      device: b.device,
      latestFrame: b.frames[b.frames.length - 1] ?? null,
      frameCount: b.frames.length,
      offlineFrameCount: b.verification.offlineCount,
      anchorCount: b.anchors.length,
      verification: b.verification,
    })),
  });
}
