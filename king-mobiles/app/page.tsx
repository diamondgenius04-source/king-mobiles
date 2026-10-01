import Image from "next/image";
import { getFeaturedProducts, getSettings } from "@/lib/queries";
import { publicImageUrl } from "@/lib/supabase/server";
import { waLink, productMessage, generalMessage } from "@/lib/whatsapp";
import { BookingForm } from "@/components/BookingForm";

export const revalidate = 60;

export default async function Home() {
  const [s, products] = await Promise.all([getSettings(), getFeaturedProducts()]);
  const num = s?.whatsapp_number;
  return (
    <>
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight sm:text-6xl">
            Premium Phones. Trusted Service. <span className="text-amber-400">King Mobiles.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-300">
            Quality mobile phones and accessories, with easy ordering and friendly support on WhatsApp.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/products" className="rounded-full bg-amber-400 px-6 py-3 font-semibold text-slate-900 hover:bg-amber-300">Shop Products</a>
            <a href={waLink(generalMessage(), num)} className="rounded-full border border-white/30 px-6 py-3 font-semibold hover:bg-white/10">Chat on WhatsApp</a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-16">
        <h2 className="text-2xl font-bold">Featured products</h2>
        {products.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
            New products are coming soon. Chat with us on WhatsApp to ask what's available.
          </p>
        ) : (
          <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => {
              const img = [...(p.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0];
              return (
                <li key={p.id} className="overflow-hidden rounded-2xl border border-slate-200 transition hover:shadow-lg">
                  <a href={`/products/${p.slug}`} className="block">
                    <div className="relative aspect-square bg-slate-100">
                      {img && <Image src={publicImageUrl("products", img.storage_path)} alt={img.alt_text || p.name} fill
                        sizes="(max-width:640px) 50vw, 25vw" className="object-cover" loading="lazy" />}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold">{p.name}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2">{p.short_description}</p>
                      <p className="mt-1 font-bold">{p.price_ngn ? `₦${Number(p.price_ngn).toLocaleString("en-NG")}` : "Ask for price"}</p>
                      <p className={`text-xs ${p.availability === "in_stock" ? "text-emerald-600" : "text-slate-500"}`}>
                        {p.availability === "in_stock" ? "In stock" : p.availability === "pre_order" ? "Pre-order" : "Out of stock"}
                      </p>
                    </div>
                  </a>
                  <div className="p-3 pt-0">
                    <a href={waLink(productMessage(p.name), num)} className="block rounded-full bg-emerald-600 py-2 text-center text-sm font-medium text-white hover:bg-emerald-700">Order on WhatsApp</a>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section id="book" className="mx-auto mt-20 max-w-2xl px-4">
        <h2 className="text-2xl font-bold">Book / Make an Inquiry</h2>
        <p className="mt-2 text-slate-600">Tell us what you need and we'll get back to you shortly.</p>
        <BookingForm />
      </section>
    </>
  );
}
