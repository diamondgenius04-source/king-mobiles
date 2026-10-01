"use client";
import { useState } from "react";

type State = { status: "idle" | "loading" | "success" | "error"; msg?: string; errors?: Record<string, string[]> };

export function BookingForm({ defaultProduct = "" }: { defaultProduct?: string }) {
  const [st, setSt] = useState<State>({ status: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSt({ status: "loading" });
    const form = e.currentTarget;
    try {
      const res = await fetch("/api/bookings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const j = await res.json();
      if (res.ok && j.ok) { form.reset(); setSt({ status: "success", msg: j.message }); }
      else setSt({ status: "error", msg: j.error ?? "Please check the highlighted fields.", errors: j.fieldErrors });
    } catch {
      setSt({ status: "error", msg: "Network problem. Please check your connection and try again." });
    }
  }

  const field = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200";
  const err = (k: string) => st.errors?.[k]?.[0] && <p role="alert" className="mt-1 text-sm text-red-600">{st.errors[k][0]}</p>;

  if (st.status === "success")
    return <div role="status" className="mt-6 rounded-xl bg-emerald-50 p-6 text-emerald-800">{st.msg}</div>;

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <label className="block text-sm font-medium">Full name *<input name="fullName" required autoComplete="name" className={field} />{err("fullName")}</label>
      <label className="block text-sm font-medium">Phone number *<input name="phone" type="tel" required autoComplete="tel" className={field} />{err("phone")}</label>
      <label className="block text-sm font-medium">Email address<input name="email" type="email" autoComplete="email" className={field} />{err("email")}</label>
      <label className="block text-sm font-medium">Product / Service *<input name="productOrService" required defaultValue={defaultProduct} className={field} />{err("productOrService")}</label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-medium">Preferred date<input name="preferredDate" type="date" className={field} /></label>
        <label className="block text-sm font-medium">Preferred time<input name="preferredTime" type="time" className={field} /></label>
      </div>
      <label className="block text-sm font-medium">Additional message<textarea name="message" rows={4} className={field} />{err("message")}</label>
      {st.status === "error" && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{st.msg}</p>}
      <button disabled={st.status === "loading"} className="w-full rounded-full bg-slate-900 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
        {st.status === "loading" ? "Sending..." : "Send request"}
      </button>
    </form>
  );
}
