-- ─────────────────────────────────────────────────────────────────────────────
-- "Novi web" prijedlozi — migracija
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Products: novi stupci ─────────────────────────────────────────────────
alter table products
  add column if not exists tags               text[]  not null default '{}',  -- npr. {bestseller, new, gainer}
  add column if not exists internal_title     text,                           -- interni naziv (ERP / Vico)
  add column if not exists sales_count        integer not null default 0,     -- auto-bestselleri
  add column if not exists usage_instructions text,                           -- Način upotrebe
  add column if not exists composition        text,                           -- Sastav
  add column if not exists nutrition_info     text;                           -- Nutritivne vrijednosti

create index if not exists products_tags_idx  on products using gin (tags);
create index if not exists products_sales_idx on products (sales_count desc);

-- ── 2. Orders: statusi + javno kreiranje narudžbe ────────────────────────────
-- Statusi praćenja: nova (zaprimljena) → u_obradi → poslano → isporučena
update orders set status = 'u_obradi' where status in ('potvrđena', 'u_pripremi');

alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check
  check (status in ('nova', 'u_obradi', 'poslano', 'isporučena', 'otkazana'));

-- Gost može kreirati narudžbu (checkout bez logina); čitanje ostaje admin-only
drop policy if exists "orders_public_insert" on orders;
create policy "orders_public_insert" on orders for insert with check (true);

-- ── 3. Auto-bestselleri: brojanje prodaja po proizvodu ───────────────────────
create or replace function bump_sales_count()
returns trigger language plpgsql security definer set search_path = public as $$
declare item jsonb;
begin
  for item in select * from jsonb_array_elements(new.items) loop
    update products
       set sales_count = sales_count + coalesce((item->>'qty')::int, 1)
     where id::text = item->>'id';
  end loop;
  return new;
end; $$;

drop trigger if exists orders_bump_sales on orders;
create trigger orders_bump_sales
  after insert on orders
  for each row execute function bump_sales_count();

-- ── 4. Recenzije — samo verificirani kupci, 15+ dana od kupovine ─────────────
create table if not exists product_reviews (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references products (id) on delete cascade,
  order_id       uuid not null references orders (id) on delete cascade,
  customer_name  text not null,
  customer_email text not null,
  rating         integer not null check (rating between 1 and 5),
  comment        text,
  is_approved    boolean not null default true,
  created_at     timestamptz not null default now(),
  unique (product_id, order_id)   -- jedna recenzija po proizvodu po narudžbi
);

create index if not exists reviews_product_idx on product_reviews (product_id, is_approved);

alter table product_reviews enable row level security;

drop policy if exists "reviews_public_read" on product_reviews;
create policy "reviews_public_read" on product_reviews for select using (is_approved = true);
drop policy if exists "reviews_admin_all" on product_reviews;
create policy "reviews_admin_all"   on product_reviews for all    using (is_admin());
-- Insert ide isključivo kroz submit_review RPC (security definer) — nema public insert policy.

-- Agregat na products.rating / review_count
create or replace function refresh_product_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  pid := coalesce(new.product_id, old.product_id);
  update products p set
    rating       = coalesce((select round(avg(rating)::numeric, 1) from product_reviews where product_id = pid and is_approved), 0),
    review_count = (select count(*) from product_reviews where product_id = pid and is_approved)
  where p.id = pid;
  return coalesce(new, old);
end; $$;

drop trigger if exists reviews_refresh_rating on product_reviews;
create trigger reviews_refresh_rating
  after insert or update or delete on product_reviews
  for each row execute function refresh_product_rating();

-- RPC: kupac ostavlja recenziju uz broj narudžbe + email.
-- Pravila: narudžba postoji, email se poklapa, proizvod je u narudžbi,
--          prošlo je min. 15 dana, narudžba nije otkazana.
create or replace function submit_review(
  p_order_number text,
  p_email        text,
  p_product_id   uuid,
  p_name         text,
  p_rating       integer,
  p_comment      text default null
) returns json language plpgsql security definer set search_path = public as $$
declare v_order orders%rowtype;
begin
  select * into v_order
    from orders
   where order_number = trim(p_order_number)
     and lower(customer_email) = lower(trim(p_email));

  if not found then
    return json_build_object('ok', false, 'error', 'Narudžba nije pronađena. Provjerite broj narudžbe i email.');
  end if;
  if v_order.status = 'otkazana' then
    return json_build_object('ok', false, 'error', 'Narudžba je otkazana — recenzija nije moguća.');
  end if;
  if v_order.created_at > now() - interval '15 days' then
    return json_build_object('ok', false, 'error', 'Recenziju možete ostaviti najranije 15 dana nakon kupovine.');
  end if;
  if not exists (
    select 1 from jsonb_array_elements(v_order.items) it
     where it->>'id' = p_product_id::text
  ) then
    return json_build_object('ok', false, 'error', 'Ovaj proizvod nije dio navedene narudžbe.');
  end if;
  if p_rating not between 1 and 5 then
    return json_build_object('ok', false, 'error', 'Ocjena mora biti između 1 i 5.');
  end if;

  insert into product_reviews (product_id, order_id, customer_name, customer_email, rating, comment)
  values (p_product_id, v_order.id, coalesce(nullif(trim(p_name), ''), split_part(v_order.customer_name, ' ', 1)), lower(trim(p_email)), p_rating, nullif(trim(p_comment), ''))
  on conflict (product_id, order_id) do update
    set rating = excluded.rating, comment = excluded.comment, customer_name = excluded.customer_name;

  return json_build_object('ok', true);
end; $$;

grant execute on function submit_review(text, text, uuid, text, integer, text) to anon, authenticated;

-- ── 5. Praćenje pošiljke — javni RPC (broj narudžbe + email) ─────────────────
create or replace function track_order(p_order_number text, p_email text)
returns json language plpgsql security definer set search_path = public as $$
declare v_order orders%rowtype;
begin
  select * into v_order
    from orders
   where order_number = trim(p_order_number)
     and lower(customer_email) = lower(trim(p_email));

  if not found then
    return null;
  end if;

  return json_build_object(
    'order_number', v_order.order_number,
    'status',       v_order.status,
    'created_at',   v_order.created_at,
    'updated_at',   v_order.updated_at,
    'total',        v_order.total,
    'city',         v_order.shipping_city,
    'items',        v_order.items
  );
end; $$;

grant execute on function track_order(text, text) to anon, authenticated;

-- ── 6. Site content — news bar, quick kategorije, ciljevi, lifetime banner ───
-- news_bar_messages: jedna poruka po redu (editabilno u Admin → Sadržaj)
insert into site_content (key, value) values
  ('news_bar_messages', json_build_object('text',
     E'BESPLATNA DOSTAVA ZA NARUDŽBE PREKO 100 KM\n100% SIGURNA KUPOVINA\nKUPI WHEY OD 150 KM → GORILLA CIPELE (250 KM) BESPLATNO'
   )::jsonb),
  ('quick_categories', '{"items": [
      {"label": "Mršanje",           "to": "/kategorija/kontrola"},
      {"label": "Izgradnja mišića",  "to": "/kategorija/proteini"},
      {"label": "Whey",              "to": "/pretraga?q=whey"},
      {"label": "Kreatin",           "to": "/pretraga?q=kreatin"},
      {"label": "Izolat",            "to": "/pretraga?q=izolat"},
      {"label": "Vitamini",          "to": "/kategorija/vitamini"}
   ]}'),
  ('goals_items', '{"items": [
      {"label": "Mršanje",          "sub": "Sagorijevanje i kontrola težine", "to": "/kategorija/kontrola"},
      {"label": "Izgradnja mišića", "sub": "Proteini, kreatin i gaineri",     "to": "/kategorija/proteini"},
      {"label": "Energija i fokus", "sub": "Pre-workout i stimulansi",        "to": "/kategorija/performanse"},
      {"label": "Zdravlje",         "sub": "Vitamini, minerali i omega",      "to": "/kategorija/vitamini"}
   ]}'),
  ('lifetime_banner_text', '{"text": "−10% NA PRVU NARUDŽBU"}'),
  ('lifetime_banner_sub',  '{"text": "Kod: PRVIH10"}'),
  ('lifetime_banner_link', '{"text": "/kategorija/akcija"}')
on conflict (key) do nothing;
