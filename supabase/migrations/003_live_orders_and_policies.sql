-- UK Accessories — live orders + missing RLS policies (run AFTER 001 + 002)
-- Why: 001 enables RLS but leaves gaps that block live use:
--  * customers cannot insert their own orders/order_items/payments
--  * admins cannot list profiles, user_roles, addresses or coupon_usage
--  * customers cannot read active coupons or submit reviews
--  * no server-side order creation, so stock could be oversold by
--    concurrent browser checkouts
-- Fix: (1) the missing policies below, (2) a SECURITY DEFINER
-- create_order() function that validates prices/stock from the DB,
-- computes the total server-side, inserts order + items + payment,
-- decrements stock atomically, and records coupon use. A failed call
-- rolls the whole transaction back, so no partial order is created.
-- The function uses auth.uid() from the JWT — never a client-supplied
-- user id — and never trusts a client-supplied total or discount.
-- No keys, no secrets, no invented prices. Guest orders are created
-- with user_id NULL; their address is not stored as a profiles row.

-- Idempotent policy helper: create only if not already present.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'customer insert own order') then
    create policy "customer insert own order" on public.orders
      for insert with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'order_items' and policyname = 'customer insert own order items') then
    create policy "customer insert own order items" on public.order_items
      for insert with check (exists (
        select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'payments' and policyname = 'customer insert own payment') then
    create policy "customer insert own payment" on public.payments
      for insert with check (exists (
        select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'coupon_usage' and policyname = 'admin manage coupon usage') then
    create policy "admin manage coupon usage" on public.coupon_usage
      for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'coupon_usage' and policyname = 'customer insert own coupon usage') then
    create policy "customer insert own coupon usage" on public.coupon_usage
      for insert with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'coupons' and policyname = 'active coupons read') then
    create policy "active coupons read" on public.coupons
      for select using (active = true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'reviews' and policyname = 'customer insert own review') then
    create policy "customer insert own review" on public.reviews
      for insert with check (user_id = auth.uid() and status = 'pending');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'reviews' and policyname = 'customer read own reviews') then
    create policy "customer read own reviews" on public.reviews
      for select using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'admin read profiles') then
    create policy "admin read profiles" on public.profiles
      for select using (public.is_admin(auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_roles' and policyname = 'admin read user roles') then
    create policy "admin read user roles" on public.user_roles
      for select using (public.is_admin(auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'addresses' and policyname = 'admin read addresses') then
    create policy "admin read addresses" on public.addresses
      for select using (public.is_admin(auth.uid()));
  end if;
end $$;

create or replace function public.create_order(
  p_customer_name text,
  p_city text,
  p_payment_method text,
  p_txn_id text,
  p_items jsonb,
  p_shipping int default 0,
  p_coupon text default null,
  p_notes text default null
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order_id text;
  v_item jsonb;
  v_product record;
  v_qty int;
  v_items_total int := 0;
  v_discount int := 0;
  v_shipping int := coalesce(p_shipping, 0);
  v_coupon record;
  v_ship_price int;
  v_ship_free int;
  v_attempt int := 0;
begin
  if p_customer_name is null or btrim(p_customer_name) = '' then
    raise exception 'customer name required';
  end if;
  if p_city is null or btrim(p_city) = '' then
    raise exception 'city required';
  end if;
  if p_payment_method not in ('Cash on Delivery', 'JazzCash (manual)', 'Easypaisa (manual)') then
    raise exception 'invalid payment method';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'cart is empty';
  end if;

  -- Shipping from the first active method (seeded: COD Pakistan, 250 / free over 5000).
  select price, free_over into v_ship_price, v_ship_free
    from public.shipping_methods where active = true order by price asc limit 1;
  -- Coupon, validated server-side (never trust a client discount).
  if p_coupon is not null and btrim(p_coupon) <> '' then
    select * into v_coupon from public.coupons
      where upper(code) = upper(btrim(p_coupon)) and active = true
        and (expires_at is null or expires_at > now())
        and (usage_limit is null or used_count < usage_limit);
    if not found then
      raise exception 'invalid or expired coupon';
    end if;
  end if;

  -- Validate items and compute the total from DB prices (not client prices).
  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_product from public.products
      where id = (v_item ->> 'product_id') and published = true;
    if not found then
      raise exception 'product not found: %', (v_item ->> 'product_id');
    end if;
    v_qty := (v_item ->> 'qty')::int;
    if v_qty is null or v_qty <= 0 then
      raise exception 'invalid quantity';
    end if;
    if v_product.stock < v_qty then
      raise exception 'out of stock: %', v_product.name;
    end if;
    v_items_total := v_items_total + (v_product.price * v_qty);
  end loop;

  if v_coupon is not null then
    if v_coupon.discount_type = 'percent' then
      v_discount := (v_items_total * v_coupon.discount_value) / 100;
    else
      v_discount := least(v_coupon.discount_value, v_items_total);
    end if;
  end if;
  if v_ship_price is not null then
    v_shipping := case
      when v_ship_free is not null and (v_items_total - v_discount) >= v_ship_free then 0
      else v_ship_price end;
  end if;

  loop
    v_order_id := 'UK-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.orders where id = v_order_id);
    v_attempt := v_attempt + 1;
    if v_attempt > 20 then
      raise exception 'could not generate order id';
    end if;
  end loop;

  insert into public.orders (id, user_id, customer_name, city, total, status, payment_method, payment_status, internal_notes)
    values (v_order_id, v_user_id, p_customer_name, p_city,
      v_items_total - v_discount + v_shipping, 'Pending', p_payment_method,
      case when p_payment_method = 'Cash on Delivery' then 'Pay on delivery' else 'Pending verification' end,
      nullif(p_notes, ''));

  -- Decrement stock atomically; a failure here rolls back the whole order.
  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_product from public.products where id = (v_item ->> 'product_id');
    v_qty := (v_item ->> 'qty')::int;
    update public.products set stock = stock - v_qty
      where id = v_product.id and stock >= v_qty;
    if not found then
      raise exception 'out of stock: %', v_product.name;
    end if;
    insert into public.order_items (order_id, product_id, qty, unit_price, colour)
      values (v_order_id, v_product.id, v_qty, v_product.price, nullif(v_item ->> 'colour', ''));
  end loop;

  if p_payment_method <> 'Cash on Delivery' then
    insert into public.payments (order_id, method, transaction_id, status)
      values (v_order_id, p_payment_method, nullif(p_txn_id, ''), 'Pending verification');
  end if;
  if v_coupon is not null then
    insert into public.coupon_usage (code, order_id, user_id)
      values (v_coupon.code, v_order_id, v_user_id);
    update public.coupons set used_count = used_count + 1 where code = v_coupon.code;
  end if;
  return v_order_id;
end $$;

grant execute on function public.create_order(text, text, text, text, jsonb, int, text, text) to anon, authenticated;
