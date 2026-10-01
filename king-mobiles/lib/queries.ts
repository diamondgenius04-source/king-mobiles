import { cache } from "react";
import { supabaseServer } from "./supabase/server";

export const getSettings = cache(async () => {
  const sb = await supabaseServer();
  const { data } = await sb.from("site_settings").select("*").eq("id", 1).single();
  return data;
});

const PRODUCT_FIELDS = "id,name,slug,price_ngn,short_description,availability,featured,product_images(storage_path,alt_text,sort_order)";

export async function getFeaturedProducts(limit = 8) {
  const sb = await supabaseServer();
  const { data } = await sb.from("products").select(PRODUCT_FIELDS).eq("published", true)
    .order("featured", { ascending: false }).order("created_at", { ascending: false }).limit(limit);
  return data ?? [];
}

export async function getProductBySlug(slug: string) {
  const sb = await supabaseServer();
  const { data } = await sb.from("products").select("*,categories(name,slug),product_images(*)")
    .eq("slug", slug).eq("published", true).maybeSingle();
  return data;
}
