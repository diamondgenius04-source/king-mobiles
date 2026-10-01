import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const clean = (s: string) => s.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

const schema = z.object({
  fullName: z.string().transform(clean).pipe(z.string().min(2, "Please enter your full name").max(100)),
  phone: z.string().transform(clean).pipe(z.string().regex(/^\+?[0-9\s-]{7,16}$/, "Enter a valid phone number")),
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid email").max(150)]).optional(),
  productOrService: z.string().transform(clean).pipe(z.string().min(2, "Tell us what you need").max(150)),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  preferredTime: z.string().max(30).optional(),
  message: z.string().transform(clean).pipe(z.string().max(1500)).optional(),
  website: z.string().max(0).optional(), // honeypot
});

// Per-IP limiter. In-memory resets per serverless instance; use Upstash Ratelimit before launch.
const hits = new Map<string, number[]>();
function limited(ip: string, max = 5, windowMs = 10 * 60_000) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > max;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (limited(ip)) return NextResponse.json({ ok: false, error: "Too many requests. Please try again shortly." }, { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, fieldErrors: parsed.error.flatten().fieldErrors }, { status: 422 });
  const d = parsed.data;
  if (d.website) return NextResponse.json({ ok: true });

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { error } = await db.from("bookings").insert({
    full_name: d.fullName, phone: d.phone, email: d.email || null,
    product_or_service: d.productOrService, preferred_date: d.preferredDate || null,
    preferred_time: d.preferredTime || null, message: d.message || null,
  });
  if (error) {
    console.error("booking insert failed", error.message);
    return NextResponse.json({ ok: false, error: "We couldn't save your request. Please try WhatsApp instead." }, { status: 500 });
  }

  // Saved. An email failure must not fail the customer's submission.
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.RESEND_FROM!;
    const row = (k: string, v?: string | null) =>
      `<tr><td style="padding:8px 12px;color:#6b7280">${k}</td><td style="padding:8px 12px;font-weight:600">${esc(v || "-")}</td></tr>`;
    const shell = (title: string, inner: string) => `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
        <div style="background:#0f172a;color:#fbbf24;padding:18px 24px;font-size:20px;font-weight:700">King Mobiles</div>
        <div style="padding:24px"><h2 style="margin:0 0 12px;font-size:18px">${title}</h2>${inner}</div>
      </div>`;

    await resend.emails.send({
      from, to: process.env.CONTACT_EMAIL!, replyTo: d.email || undefined,
      subject: `New inquiry: ${d.productOrService} - ${d.fullName}`,
      html: shell("New booking / inquiry", `<table style="width:100%;border-collapse:collapse">
        ${row("Name", d.fullName)}${row("Phone", d.phone)}${row("Email", d.email)}
        ${row("Product/Service", d.productOrService)}${row("Preferred date", d.preferredDate)}
        ${row("Preferred time", d.preferredTime)}${row("Message", d.message)}
        ${row("Submitted", new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" }))}</table>`),
    });

    if (d.email) {
      await resend.emails.send({
        from, to: d.email, subject: "We received your request - King Mobiles",
        html: shell(`Thank you, ${esc(d.fullName)}!`, `<p>Your request about <b>${esc(d.productOrService)}</b> has been received. King Mobiles will contact you shortly.</p>`),
      });
    }
  } catch (e) {
    console.error("resend failed", e);
  }

  return NextResponse.json({ ok: true, message: "Thank you! Your request has been received. King Mobiles will contact you shortly." });
}
