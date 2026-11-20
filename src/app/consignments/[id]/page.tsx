import { notFound } from "next/navigation";
import { getConsignmentBundle } from "@/lib/ledger";
import { ConsignmentInspectorClient } from "@/components/ConsignmentInspectorClient";

export const dynamic = "force-dynamic";

export default async function ConsignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bundle = await getConsignmentBundle(id);
  if (!bundle) {
    notFound();
  }

  return <ConsignmentInspectorClient initialBundle={bundle} />;
}
