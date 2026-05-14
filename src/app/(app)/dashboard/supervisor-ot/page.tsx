import { permanentRedirect } from "next/navigation";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function LegacyDashboardSupervisorRedirect({ searchParams }: Props) {
  const sp = await searchParams;
  const upload = typeof sp.upload === "string" ? sp.upload : undefined;
  const q = upload ? `?upload=${encodeURIComponent(upload)}` : "";
  permanentRedirect(`/analytics/supervisor-ot${q}`);
}
