import { NextResponse } from "next/server";
import { simulateDatabaseTamper } from "@/lib/ledger";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { consignmentId?: string; seq?: number };
    const consignmentId = body.consignmentId ?? "LOT-IND-2026-001";
    const result = await simulateDatabaseTamper(consignmentId, body.seq);
    if (!result.ok) {
      return NextResponse.json(result, { status: 404 });
    }
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid request" },
      { status: 400 }
    );
  }
}
