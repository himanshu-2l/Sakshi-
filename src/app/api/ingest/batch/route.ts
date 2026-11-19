import { NextResponse } from "next/server";
import { ingestSignedBatch } from "@/lib/ledger";
import type { SignedTelemetryFrame } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      consignmentId?: string;
      frames?: SignedTelemetryFrame[];
    };
    if (!body.consignmentId || !Array.isArray(body.frames) || body.frames.length === 0) {
      return NextResponse.json(
        { error: "consignmentId and non-empty frames[] are required" },
        { status: 400 }
      );
    }

    const result = await ingestSignedBatch(body.consignmentId, body.frames);
    if (!result.ok) {
      return NextResponse.json(result, { status: 422 });
    }
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid request" },
      { status: 400 }
    );
  }
}
