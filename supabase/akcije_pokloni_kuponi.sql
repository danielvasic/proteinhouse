-- ============================================================================
--  Akcije, add-oni, kuponi i gratis pokloni
--  Pokrenuti jednom u Supabase SQL Editoru. Sve je idempotentno.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
--  1. ONE-CLICK ADD-ON — proizvodi koji se nude u korpi uz glavni proizvod
-- ─────────────────────────────────────────────────────────────────────────────
--  Oblik: [{ "product_id": "<uuid>", "price": 10.00 }]
--  price je opcionalna promo cijena add-ona; ako je null, koristi se redovna
--  cijena tog proizvoda.
alter table products add column if not exists addons jsonb not null default '[]';


-- ─────────────────────────────────────────────────────────────────────────────
--  2. KUPONI
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists coupons (
  id               uuid primary key default gen_random_uuid(),
  code             text not null,
  description      text,
  discount_percent integer,                              -- npr. 5  → 5% popusta
  discount_amount  numeric(10,2),                        -- ili fiksni iznos u KM
  free_shipping    boolean not null default false,
  min_order        numeric(10,2) not null default 0,     -- minimalni međuzbir
  max_uses         integer,                              -- null = neograničeno
  used_count       integer not null default 0,
  once_per_email   boolean not null default false,       -- jedan kupac = jedno korištenje
  is_active        boolean not null default true,
  starts_at        timestamptz,
  ends_at          timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Kodovi su case-insensitive jedinstveni ("popust5" == "POPUST5")
create unique index if not exists coupons_code_uniq on coupons (upper(code));

drop trigger if exists coupons_updated_at on coupons;
create trigger coupons_updated_at before update on coupons
  for each row execute function set_updated_at();

alter table coupons enable row level security;

-- Kuponi se NE čitaju javno (inače bi se kodovi mogli pokupiti iz baze).
-- Kupac ih provjerava isključivo kroz validate_coupon() RPC ispod.
drop policy if exists coupons_admin_all on coupons;
create policy coupons_admin_all on coupons for all using (is_admin()) with check (is_admin());


-- ─────────────────────────────────────────────────────────────────────────────
--  3. GRATIS POKLONI — kampanja + artikli sa stanjem po veličini
-- ─────────────────────────────────────────────────────────────────────────────
--  Namjerno generički (nije vezano za Gorilla Wear): admin otvara kampanju,
--  postavlja prag narudžbe i ubacuje artikle. Kad kampanja istekne, otvori se
--  nova s drugim brendom — kod ostaje isti.
create table if not exists gift_campaigns (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,                     -- interni naziv
  headline            text,                              -- naslov u korpi
  subtitle            text,
  min_order_total     numeric(10,2) not null default 200,
  allow_mystery       boolean not null default true,
  mystery_label       text not null default 'Mystery Gift',
  mystery_description text,
  is_active           boolean not null default true,
  starts_at           timestamptz,
  ends_at             timestamptz,
  sort_order          integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists gift_products (
  id               uuid primary key default gen_random_uuid(),
  campaign_id      uuid not null references gift_campaigns(id) on delete cascade,
  brand            text,
  title            text not null,
  description      text,
  image_path       text,                                 -- storage bucket product-images
  image_url        text,
  -- 'clothing' → S/M/L/XL…, 'shoes' → 40/41/42…, 'none' → artikal bez veličine
  size_type        text not null default 'clothing'
                   check (size_type in ('clothing', 'shoes', 'none')),
  -- Stanje po veličini: {"M": 3, "L": 5} · {"42": 2} · {"_": 10} za size_type='none'
  stock_by_size    jsonb not null default '{}',
  mystery_eligible boolean not null default true,        -- smije li ući u Mystery Gift izbor
  is_active        boolean not null default true,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists gift_products_campaign_idx on gift_products (campaign_id, is_active);

drop trigger if exists gift_campaigns_updated_at on gift_campaigns;
create trigger gift_campaigns_updated_at before update on gift_campaigns
  for each row execute function set_updated_at();

drop trigger if exists gift_products_updated_at on gift_products;
create trigger gift_products_updated_at before update on gift_products
  for each row execute function set_updated_at();

alter table gift_campaigns enable row level security;
alter table gift_products  enable row level security;

drop policy if exists gift_campaigns_public_read on gift_campaigns;
create policy gift_campaigns_public_read on gift_campaigns for select using (is_active = true);
drop policy if exists gift_campaigns_admin_all on gift_campaigns;
create policy gift_campaigns_admin_all on gift_campaigns for all using (is_admin()) with check (is_admin());

drop policy if exists gift_products_public_read on gift_products;
create policy gift_products_public_read on gift_products for select using (is_active = true);
drop policy if exists gift_products_admin_all on gift_products;
create policy gift_products_admin_all on gift_products for all using (is_admin()) with check (is_admin());


-- ─────────────────────────────────────────────────────────────────────────────
--  4. NARUDŽBE — popust, poklon, praćenje podsjetnika
-- ─────────────────────────────────────────────────────────────────────────────
alter table orders
  add column if not exists subtotal         numeric(10,2),
  add column if not exists shipping_cost    numeric(10,2) not null default 0,
  add column if not exists coupon_code      text,
  add column if not exists discount         numeric(10,2) not null default 0,
  -- { gift_product_id, title, size, size_type, mystery: bool, clothing_size, shoe_size }
  add column if not exists gift             jsonb,
  add column if not exists reminder_sent_at timestamptz;

create index if not exists orders_reminder_idx on orders (created_at) where reminder_sent_at is null;


-- ─────────────────────────────────────────────────────────────────────────────
--  5. validate_coupon() — jedina tačka kroz koju kupac dodiruje kupone
-- ─────────────────────────────────────────────────────────────────────────────
--  Vraća { valid, reason, code, discount, free_shipping, description }.
--  security definer jer čita coupons i orders, a oboje su zatvoreni za javnost.
create or replace function validate_coupon(p_code text, p_subtotal numeric, p_email text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c        coupons%rowtype;
  v_disc   numeric(10,2) := 0;
begin
  select * into c from coupons where upper(code) = upper(trim(p_code)) limit 1;

  if not found then
    return jsonb_build_object('valid', false, 'reason', 'Kupon ne postoji.');
  end if;
  if not c.is_active then
    return jsonb_build_object('valid', false, 'reason', 'Kupon više nije aktivan.');
  end if;
  if c.starts_at is not null and now() < c.starts_at then
    return jsonb_build_object('valid', false, 'reason', 'Kupon još nije počeo važiti.');
  end if;
  if c.ends_at is not null and now() > c.ends_at then
    return jsonb_build_object('valid', false, 'reason', 'Kupon je istekao.');
  end if;
  if c.max_uses is not null and c.used_count >= c.max_uses then
    return jsonb_build_object('valid', false, 'reason', 'Kupon je iskorišten.');
  end if;
  if p_subtotal < c.min_order then
    return jsonb_build_object('valid', false,
      'reason', format('Kupon vrijedi za narudžbe preko %s KM.', trim(to_char(c.min_order, 'FM999990.00'))));
  end if;
  if c.once_per_email and p_email is not null and exists (
    select 1 from orders where upper(coupon_code) = upper(c.code) and lower(customer_email) = lower(p_email)
  ) then
    return jsonb_build_object('valid', false, 'reason', 'Ovaj kupon ste već iskoristili.');
  end if;

  if c.discount_percent is not null then
    v_disc := round(p_subtotal * c.discount_percent / 100.0, 2);
  elsif c.discount_amount is not null then
    v_disc := least(c.discount_amount, p_subtotal);
  end if;

  return jsonb_build_object(
    'valid',         true,
    'code',          upper(c.code),
    'discount',      v_disc,
    'free_shipping', c.free_shipping,
    'description',   c.description
  );
end;
$$;

revoke all on function validate_coupon(text, numeric, text) from public;
grant execute on function validate_coupon(text, numeric, text) to anon, authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
--  6. Trigeri na narudžbi: broji iskorištene kupone, skida poklon sa stanja
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function consume_order_perks()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gift_id uuid;
  v_size    text;
  v_left    integer;
begin
  if new.coupon_code is not null and new.coupon_code <> '' then
    update coupons set used_count = used_count + 1 where upper(code) = upper(new.coupon_code);
  end if;

  -- Mystery poklon nema konkretan artikal — skladište skida admin pri pakovanju.
  v_gift_id := nullif(new.gift ->> 'gift_product_id', '')::uuid;
  v_size    := coalesce(nullif(new.gift ->> 'size', ''), '_');

  if v_gift_id is not null then
    select coalesce((stock_by_size ->> v_size)::integer, 0) into v_left
      from gift_products where id = v_gift_id;

    if v_left > 0 then
      update gift_products
         set stock_by_size = jsonb_set(stock_by_size, array[v_size], to_jsonb(v_left - 1))
       where id = v_gift_id;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists orders_consume_perks on orders;
create trigger orders_consume_perks after insert on orders
  for each row execute function consume_order_perks();


-- ─────────────────────────────────────────────────────────────────────────────
--  7. Startni podaci iz Slavenovog zahtjeva
-- ─────────────────────────────────────────────────────────────────────────────
insert into coupons (code, description, discount_percent, is_active)
values ('POPUST5', 'Dodatnih 5% popusta na sljedeću kupovinu', 5, true)
on conflict do nothing;

insert into gift_campaigns (name, headline, subtitle, min_order_total, allow_mystery, mystery_description)
select 'Gorilla Wear poklon',
       'Odaberi svoj besplatni Gorilla Wear poklon',
       'Uz narudžbu preko 200 KM poklanjamo ti Gorilla Wear artikal u tvojoj veličini.',
       200, true,
       'Prepusti izbor nama — poslat ćemo ti iznenađenje u veličini koju si označio.'
where not exists (select 1 from gift_campaigns where name = 'Gorilla Wear poklon');
