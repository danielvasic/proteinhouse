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

-- ── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists products_category_idx  on products (category);
create index if not exists products_active_idx    on products (is_active);
create index if not exists products_slug_idx      on products (slug);
create index if not exists blog_slug_idx          on blog_posts (slug);
create index if not exists blog_published_idx     on blog_posts (published, published_at desc);
create index if not exists orders_status_idx      on orders (status);
create index if not exists orders_created_idx     on orders (created_at desc);
