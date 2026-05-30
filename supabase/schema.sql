-- ProteinHouse — Supabase schema
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "unaccent";

-- ── Products ─────────────────────────────────────────────────────────────────
create table if not exists products (
  id            uuid primary key default gen_random_uuid(),
  brand         text not null,
  title         text not null,
  slug          text unique not null,
  price         numeric(10,2) not null,
  old_price     numeric(10,2),
  description   text,
  category      text not null,  -- matches categories.slug
  image_url     text,
  badge         text,           -- e.g. '-30%', 'NOVO'
  is_active     boolean not null default true,
  flavors       text[] not null default '{}',
  rating        numeric(3,1) not null default 0,
  review_count  integer not null default 0,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── Blog posts ───────────────────────────────────────────────────────────────
create table if not exists blog_posts (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  slug          text unique not null,
  excerpt       text,
  content       text,           -- Markdown or HTML
  cover_url     text,
  author        text not null default 'ProteinHouse Tim',
  published     boolean not null default false,
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── Orders ───────────────────────────────────────────────────────────────────
create table if not exists orders (
  id              uuid primary key default gen_random_uuid(),
  order_number    text unique not null,   -- e.g. 'PH-2026-0001'
  customer_name   text not null,
  customer_email  text,
  customer_phone  text,
  shipping_city   text,
  shipping_address text,
  items           jsonb not null,         -- [{id, brand, title, price, qty}]
  subtotal        numeric(10,2) not null,
  shipping_cost   numeric(10,2) not null default 0,
  total           numeric(10,2) not null,
  status          text not null default 'nova',
    -- nova | potvrđena | isporučena | otkazana
  payment_method  text not null default 'pouzece',
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── Auto-updated updated_at ──────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger products_updated_at
  before update on products
  for each row execute function set_updated_at();

create trigger blog_posts_updated_at
  before update on blog_posts
  for each row execute function set_updated_at();

create trigger orders_updated_at
  before update on orders
  for each row execute function set_updated_at();

-- ── Admin helper ─────────────────────────────────────────────────────────────
-- To make a user admin:
--   update auth.users
--   set raw_user_meta_data = raw_user_meta_data || '{"role":"admin"}'
--   where email = 'your@email.com';

create or replace function is_admin()
returns boolean language sql security definer as $$
  select coalesce(
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table products   enable row level security;
alter table blog_posts enable row level security;
alter table orders     enable row level security;

-- Products: everyone reads active; admin manages all
create policy "products_public_read"  on products   for select using (is_active = true);
create policy "products_admin_all"    on products   for all    using (is_admin());

-- Blog: everyone reads published; admin manages all
create policy "blog_public_read"      on blog_posts for select using (published = true);
create policy "blog_admin_all"        on blog_posts for all    using (is_admin());

-- Orders: admin only
create policy "orders_admin_all"      on orders     for all    using (is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- NEW TABLES (admin panel v2)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Categories (DB-driven, replaces hardcoded catalog.js) ────────────────
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  label       text not null,
  description text,
  image_url   text,
  accent      boolean not null default false,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── Banners (hero slider) ────────────────────────────────────────────────
create table if not exists banners (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  subtitle    text,
  cta_text    text,
  cta_link    text,
  image_url   text,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Promotions (special offers, promo codes) ─────────────────────────────
create table if not exists promotions (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  subtitle         text,
  badge            text,
  description      text,
  image_url        text,
  link             text,
  promo_code       text,
  discount_percent integer,
  sort_order       integer not null default 0,
  is_active        boolean not null default true,
  starts_at        timestamptz,
  ends_at          timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ── Site content (editable text blocks / key-value store) ─────────────────
create table if not exists site_content (
  key         text primary key,
  value       jsonb not null default '{}',
  updated_at  timestamptz not null default now()
);

-- ── Triggers for updated_at ──────────────────────────────────────────────
create trigger banners_updated_at
  before update on banners
  for each row execute function set_updated_at();

create trigger promotions_updated_at
  before update on promotions
  for each row execute function set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table categories    enable row level security;
alter table banners       enable row level security;
alter table promotions    enable row level security;
alter table site_content  enable row level security;

-- Categories: public reads active, admin manages all
create policy "categories_public_read" on categories   for select using (is_active = true);
create policy "categories_admin_all"   on categories   for all    using (is_admin());

-- Banners: public reads active, admin manages all
create policy "banners_public_read"    on banners      for select using (is_active = true);
create policy "banners_admin_all"      on banners      for all    using (is_admin());

-- Promotions: public reads active, admin manages all
create policy "promos_public_read"     on promotions   for select using (is_active = true);
create policy "promos_admin_all"       on promotions   for all    using (is_admin());

-- Site content: public reads, admin writes
create policy "content_public_read"    on site_content for select using (true);
create policy "content_admin_write"    on site_content for all    using (is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED: default categories (mirrors current catalog.js)
-- Run this AFTER main schema to populate initial categories
-- ─────────────────────────────────────────────────────────────────────────────
insert into categories (slug, label, sort_order) values
  ('proteini',    'Proteini',       1),
  ('gaineri',     'Gaineri',        2),
  ('performanse', 'Performanse',    3),
  ('vitamini',    'Vitamini',       4),
  ('kontrola',    'Kontrola težine',5),
  ('hrana',       'Zdrava hrana',   6),
  ('oprema',      'Oprema',         7),
  ('akcija',      'Akcija',         8)
on conflict (slug) do nothing;

-- ── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists products_category_idx  on products (category);
create index if not exists products_active_idx    on products (is_active);
create index if not exists products_slug_idx      on products (slug);
create index if not exists blog_slug_idx          on blog_posts (slug);
create index if not exists blog_published_idx     on blog_posts (published, published_at desc);
create index if not exists orders_status_idx      on orders (status);
create index if not exists orders_created_idx     on orders (created_at desc);
create index if not exists categories_slug_idx    on categories (slug);
create index if not exists banners_active_idx     on banners (is_active, sort_order);
create index if not exists promos_active_idx      on promotions (is_active, starts_at, ends_at);
