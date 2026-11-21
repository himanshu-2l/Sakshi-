import { notFound } from "next/navigation";
import { getConsignmentBundle } from "@/lib/ledger";
import { QrPassportClient } from "@/components/QrPassportClient";

export const dynamic = "force-dynamic";

export default async function VerifyPassportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bundle = await getConsignmentBundle(id);
  if (!bundle) {
    notFound();
  }

  return <QrPassportClient bundle={bundle} />;
}
