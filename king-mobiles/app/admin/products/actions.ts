"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin, supabaseAdmin } from "@/lib/supabase/server";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function createProduct(fd: FormData) {
  await requireAdmin(); // authorization is checked on the server, every time
  const db = supabaseAdmin();
  const name = String(fd.get("name") ?? "").trim();
  if (name.length < 2) return { ok: false, error: "Product name is required." };

  const files = (fd.getAll("images") as File[]).filter((f) => f.size > 0);
  for (const f of files) {
    if (!TYPES[f.type]) return { ok: false, error: `${f.name}: only JPG, PNG or WebP allowed.` };
    if (f.size > MAX_BYTES) return { ok: false, error: `${f.name} is over 5MB.` };
  }

  let specs = {};
  try { specs = JSON.parse(String(fd.get("specs") || "{}")); } catch { return { ok: false, error: "Specifications must be valid JSON." }; }

  const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;
  const { data: product, error } = await db.from("products").insert({
    name, slug, specs,
    category_id: fd.get("category_id") || null,
    price_ngn: fd.get("price") ? Number(fd.get("price")) : null,
    short_description: String(fd.get("short_description") ?? ""),
    description: String(fd.get("description") ?? ""),
    availability: String(fd.get("availability") ?? "in_stock"),
    featured: fd.get("featured") === "on",
    published: fd.get("published") === "on",
  }).select("id").single();
  if (error || !product) return { ok: false, error: "Could not save the product." };

  for (const [i, f] of files.entries()) {
    const path = `${product.id}/${slug}-${i + 1}.${TYPES[f.type]}`;
    const up = await db.storage.from("products").upload(path, f, { contentType: f.type, upsert: false });
    if (up.error) return { ok: false, error: `Product saved, but ${f.name} failed to upload. Edit the product to retry.` };
    await db.from("product_images").insert({ product_id: product.id, storage_path: path, alt_text: `${name} photo ${i + 1}`, sort_order: i });
  }
  revalidatePath("/"); revalidatePath("/products");
  return { ok: true };
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const db = supabaseAdmin();
  const { data: imgs } = await db.from("product_images").select("storage_path").eq("product_id", id);
  if (imgs?.length) await db.storage.from("products").remove(imgs.map((i) => i.storage_path));
  await db.from("products").delete().eq("id", id); // images rows cascade
  revalidatePath("/"); revalidatePath("/products");
  return { ok: true };
}
