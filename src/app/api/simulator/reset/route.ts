import { NextResponse } from "next/server";
import { resetLedgerStore } from "@/lib/ledger";

export async function POST() {
  await resetLedgerStore();
  return NextResponse.json({ ok: true });
}
