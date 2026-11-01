-- UK Accessories — Supabase schema v1
-- Project (public URL only): https://cnkdeotxnaxlavvrmzyr.supabase.co
-- Apply in Supabase Dashboard > SQL Editor, or with the Supabase CLI.
-- NEVER put the service_role key in frontend code.

create extension if not exists pgcrypto;

-- Profiles + roles (admin is NEVER self-assignable via the app)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null, full_name text, phone text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.user_roles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null check (role in ('admin','customer')),
  created_at timestamptz not null default now()
);
create or replace function public.is_admin(uid uuid) returns boolean language sql stable as $$
  select exists (select 1 from public.user_roles where user_id = uid and role = 'admin');
$$;

create table if not exists public.categories (
  id text primary key, name text not null, slug text not null unique,
  description text, image_url text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.products (
  id text primary key, sku text not null unique, slug text not null unique,
  name text not null, category_id text not null references public.categories(id),
  price integer not null check (price >= 0), compare_at integer check (compare_at is null or compare_at >= 0),
  stock integer not null default 0 check (stock >= 0),
  description text, image_url text, colours text[] not null default '{}',
  featured boolean not null default false, bestseller boolean not null default false,
  trending boolean not null default false, is_new boolean not null default false,
  is_demo boolean not null default true, published boolean not null default true,
  seo_title text, seo_description text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete cascade,
  url text not null, alt text, sort_order int not null default 0
);
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete cascade,
  name text not null, value text not null, price_delta int not null default 0, stock int not null default 0
);
create table if not exists public.inventory (
  product_id text primary key references public.products(id) on delete cascade,
  quantity int not null default 0 check (quantity >= 0), low_stock_threshold int not null default 20,
  updated_at timestamptz not null default now()
);
create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id text not null references public.products(id), qty int not null check (qty > 0), colour text,
  unique (cart_id, product_id, colour)
);
create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade
);
create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references public.wishlists(id) on delete cascade,
  product_id text not null references public.products(id), unique (wishlist_id, product_id)
);
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  full_name text not null, phone text not null, email text not null, country text not null default 'Pakistan',
  city text not null, address text not null, postal_code text, is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.orders (
  id text primary key, user_id uuid references public.profiles(id),
  customer_name text not null, city text not null, total int not null check (total >= 0),
  status text not null default 'Pending' check (status in ('Pending','Confirmed','Processing','Shipped','Delivered','Cancelled','Refunded')),
  payment_method text not null check (payment_method in ('Cash on Delivery','JazzCash (manual)','Easypaisa (manual)')),
  payment_status text not null default 'Pending verification',
  tracking_number text, internal_notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  product_id text not null references public.products(id), qty int not null check (qty > 0),
  unit_price int not null check (unit_price >= 0), colour text
);
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  method text not null, transaction_id text, screenshot_url text,
  status text not null default 'Pending verification' check (status in ('Pending verification','Verified','Rejected')),
  created_at timestamptz not null default now()
);
create table if not exists public.coupons (
  code text primary key, discount_type text not null check (discount_type in ('percent','fixed')),
  discount_value int not null check (discount_value >= 0), min_order int not null default 0,
  expires_at timestamptz, usage_limit int, used_count int not null default 0, active boolean not null default true
);
create table if not exists public.coupon_usage (
  id uuid primary key default gen_random_uuid(), code text not null references public.coupons(code),
  order_id text not null references public.orders(id), user_id uuid references public.profiles(id)
);
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete cascade,
  user_id uuid references public.profiles(id), rating int not null check (rating between 1 and 5),
  body text, status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
create table if not exists public.shipping_methods (
  id text primary key, name text not null, price int not null default 0,
  free_over int, zone text not null default 'Pakistan', estimate_days text, active boolean not null default true
);
create table if not exists public.store_settings (
  id int primary key default 1, store_name text not null default 'UK Accessories',
  slogan text not null default 'Upgrade Your Tech. Elevate Your Style.',
  whatsapp text not null default '+92 3170851250', currency text not null default 'PKR',
  announcement text, instagram_url text, facebook_url text, tiktok_url text, youtube_url text,
  check (id = 1)
);
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(), title text not null, subtitle text,
  image_url text, link_url text, active boolean not null default true, sort_order int not null default 0
);
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade,
  title text not null, body text, read boolean not null default false, created_at timestamptz not null default now()
);

create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_reviews_product on public.reviews(product_id);

-- updated_at helper
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_products_updated') then
    create trigger trg_products_updated before update on public.products for each row execute function public.touch_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_orders_updated') then
    create trigger trg_orders_updated before update on public.orders for each row execute function public.touch_updated_at();
  end if;
end $$;

-- RLS: enabled on every table. Customers see only their own rows; admins manage.
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.inventory enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlists enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.coupons enable row level security;
alter table public.coupon_usage enable row level security;
alter table public.reviews enable row level security;
alter table public.shipping_methods enable row level security;
alter table public.store_settings enable row level security;
alter table public.banners enable row level security;
alter table public.notifications enable row level security;

-- Public read for catalogue + settings; admin write; customer-own for private tables.
create policy "catalogue read" on public.categories for select using (true);
create policy "catalogue read" on public.products for select using (published = true);
create policy "catalogue read" on public.product_images for select using (true);
create policy "catalogue read" on public.shipping_methods for select using (active = true);
create policy "catalogue read" on public.store_settings for select using (true);
create policy "catalogue read" on public.banners for select using (active = true);
create policy "admin manage categories" on public.categories for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage products" on public.products for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage images" on public.product_images for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage variants" on public.product_variants for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage inventory" on public.inventory for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage orders" on public.orders for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage order items" on public.order_items for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage payments" on public.payments for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage coupons" on public.coupons for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage reviews" on public.reviews for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage shipping" on public.shipping_methods for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage settings" on public.store_settings for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage banners" on public.banners for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "own profile" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "own addresses" on public.addresses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own orders" on public.orders for select using (user_id = auth.uid());
create policy "own notifications" on public.notifications for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "approved reviews read" on public.reviews for select using (status = 'approved');

-- Storage buckets (create in Dashboard > Storage if not present):
-- product-images, category-images, banners, payment-screenshots (private for screenshots)
-- Policies for payment-screenshots must be admin-only + owner-upload; do not make it public.
