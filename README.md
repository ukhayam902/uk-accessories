# UK Accessories — Full-Stack E-Commerce (React + Supabase + Vercel)

Premium, minimalist store for UK Accessories.
Slogan: **Upgrade Your Tech. Elevate Your Style.**
WhatsApp: **+92 3170851250** • Currency: **PKR** • Primary market: Pakistan.

## Status — read this first

- **Demo mode is the default.** The app runs fully in the browser (cart, checkout,
  wishlist, admin preview) without Supabase, and every demo price / product is
  labelled as a demo sample.
- **Supabase live connection: NOT configured yet.** The existing project found in
  the user's dashboard is:
  - Organization: UK Mobile Zone (Free plan)
  - Project: "ukhayam902's Project"
  - Public URL: https://cnkdeotxnaxlavvrmzyr.supabase.co
  - Region: eu-west-1, reference: cnkdeotxnaxlavvrmzyr
  - **Still missing: the anon public key.** It was not invented and is not in
    this repo. Without it, live mode cannot start.
- **No secrets are committed.** Only `.env.example` is shipped. Never commit
  `.env`, an anon key beyond the public frontend key, or a service-role key.

## Run locally

```bash
npm install
npm run dev        # demo mode if no env vars are set
npm run build
```

## Enable live Supabase mode (owner steps)

1. In Supabase Dashboard, open **ukhayam902's Project**
   (https://cnkdeotxnaxlavvrmzyr.supabase.co) — do not create a new project.
2. Open **SQL Editor** and run, in order:
   - `supabase/migrations/001_init.sql`
   - `supabase/seed.sql`
3. In **Storage**, create buckets: `product-images`, `category-images`,
   `banners` (public read) and `payment-screenshots` (private; admin-only read,
   owner upload — do not make it public).
4. In **Project Settings → API**, copy the **anon public key** (NOT the
   service-role key).
5. Set environment variables (locally in `.env`, in Vercel in Project Settings):
   - `VITE_SUPABASE_URL=https://cnkdeotxnaxlavvrmzyr.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=<anon public key from step 4>`
6. Redeploy. The demo banner disappears only when both variables are present.
7. Replace demo SVG illustrations with real shop photos in Storage, and
   approve / correct every demo price before presenting products as real stock.

## First admin setup — secure, no public admin registration

There is **no admin sign-up route** in the app, by design. Admins cannot
assign the role to themselves.

1. Create the admin user in **Supabase Dashboard → Authentication → Users**
   (or let them register via the customer Register page, then continue).
2. Find that user's UUID, then run in SQL Editor (as a project owner / existing
   admin — this is a database operation, not an app feature):
   ```sql
   insert into public.profiles (id, email, full_name)
   values ('<USER-UUID>', '<admin-email>', '<Full Name>')
   on conflict (id) do update set email = excluded.email;

   insert into public.user_roles (user_id, role)
   values ('<USER-UUID>', 'admin')
   on conflict (user_id) do update set role = 'admin';
   ```
3. That user can now sign in and open `/admin`. All admin writes are enforced
   by Supabase Row Level Security (`is_admin(auth.uid())`), not by frontend
   checks alone.
4. To remove an admin, delete / update their row in `user_roles` in SQL.

## Payments — manual only

- Cash on Delivery, and manual JazzCash / Easypaisa.
- **No JazzCash/Easypaisa account numbers are published in this repo or site.**
  The shop shares details on WhatsApp after an order, or the customer enters a
  transaction ID. Admin approves / rejects in `/admin → Payments`.
- No automatic payment integration is claimed.

## What is NOT yet live

- Live Supabase Auth, orders, inventory transactions and Storage uploads
  (needs the anon key above + migrations applied). Demo checkout/orders are
  browser-local only.
- Real product photos (current images are original representative SVG
  illustrations, labelled as such).
- Real courier rates / international delivery (not advertised as available).
- Social media links (placeholders only — owner has none yet).
- Edge Functions for server-side order creation: the schema is ready, but a
  production order flow should move order + inventory updates into a Supabase
  Edge Function / Postgres function with row locking before going live with
  real payments. Do not rely on client-side stock decrements for real orders.

## Deploy (Vercel)

- SPA rewrites are in `vercel.json` (`/(.*)` → `/index.html`).
- Build command: `npm run build` • Output directory: `dist`.
- Set only `VITE_SUPABASE_URL` and (when available) `VITE_SUPABASE_ANON_KEY`.
  Never set a service-role key as a `VITE_` variable.

## Project structure

```
src/components/  header, footer, WhatsApp button, layout
src/pages/       customer pages + admin dashboard
src/store/       cart, wishlist, orders, demo auth (localStorage)
src/data/        12 categories + 15 demo products (labelled demo)
src/lib/         Supabase client (null in demo mode)
supabase/        migrations/001_init.sql, seed.sql
public/images/   logo + 15 original representative SVG illustrations
public/          robots.txt, sitemap.xml
```
