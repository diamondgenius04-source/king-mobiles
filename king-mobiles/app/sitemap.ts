import type { MetadataRoute } from "next";
import { supabaseServer } from "@/lib/supabase/server";
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sb = await supabaseServer();
  const { data } = await sb.from("products").select("slug,updated_at").eq("published", true);
  return [
    ...["", "/products", "/contact"].map((p) => ({ url: site + p, changeFrequency: "weekly" as const })),
    ...(data ?? []).map((p) => ({ url: `${site}/products/${p.slug}`, lastModified: p.updated_at })),
  ];
}
