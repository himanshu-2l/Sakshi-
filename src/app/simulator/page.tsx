import { getConsignmentBundle, getDeviceKeysForSimulator } from "@/lib/ledger";
import { SimulatorLabClient } from "@/components/SimulatorLabClient";

export const dynamic = "force-dynamic";

export default async function SimulatorPage() {
  const bundle = await getConsignmentBundle("LOT-IND-2026-001");
  if (!bundle) {
    return null;
  }
  const keys = await getDeviceKeysForSimulator(bundle.device.id);

  return (
    <SimulatorLabClient
      initialBundle={bundle}
      devicePrivateKeyJwk={keys?.privateKeyJwk ?? null}
    />
  );
}
