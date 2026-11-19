import { NextResponse } from "next/server";
import { buildEpcisDocument, buildFsma204Csv } from "@/lib/epcis";
import { getConsignmentBundle } from "@/lib/ledger";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "epcis";

  const bundle = await getConsignmentBundle(id);
  if (!bundle) {
    return NextResponse.json({ error: "Consignment not found" }, { status: 404 });
  }

  if (format === "fsma") {
    const csv = buildFsma204Csv(bundle);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${id}-fsma204.csv"`,
      },
    });
  }

  const doc = buildEpcisDocument(bundle);
  return new NextResponse(JSON.stringify(doc, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/ld+json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${id}-epcis2.jsonld"`,
    },
  });
}
