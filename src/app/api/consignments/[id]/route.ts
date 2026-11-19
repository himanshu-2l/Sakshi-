import { NextResponse } from "next/server";
import { getConsignmentBundle, getDeviceKeysForSimulator } from "@/lib/ledger";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const bundle = await getConsignmentBundle(id);
  if (!bundle) {
    return NextResponse.json({ error: "Consignment not found" }, { status: 404 });
  }
  const simKeys = await getDeviceKeysForSimulator(bundle.device.id);
  return NextResponse.json({
    bundle,
    simulatorPrivateKeyJwk: simKeys?.privateKeyJwk ?? null,
  });
}
