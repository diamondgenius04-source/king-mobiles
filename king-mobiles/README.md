# King Mobiles - backend core

## Setup
1. `npx create-next-app@latest king-mobiles --ts --tailwind --app`, then copy these files in.
2. `npm i zod resend @supabase/supabase-js @supabase/ssr`
3. Supabase: run `supabase/schema.sql`; create public bucket `products` and `gallery`
   (restrict uploads to admins via storage policies using `is_admin()`).
4. Create your admin in Supabase Auth, then `insert into admin_users values ('<that user id>')`.
5. Copy `.env.example` to `.env.local` and fill in. In Resend, verify your sending domain.

## Included
schema + RLS, WhatsApp number conversion/links, `/api/bookings` (validation, sanitising,
honeypot, rate limit, DB insert, branded admin + customer emails via Resend).

## Still to build
Pages (home, products, product detail, contact), admin dashboard (auth, products,
gallery, categories, bookings, settings), image upload + optimisation, SEO (metadata,
sitemap, robots, JSON-LD), favicon/manifest, loading/error/empty states.
