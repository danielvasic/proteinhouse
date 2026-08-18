-- ============================================================================
--  Sinhronizacija s ERP-om (proteinhouse-api.work)
--  Pokrenuti jednom u Supabase SQL Editoru. Sve je idempotentno.
-- ============================================================================
--
--  Dvije razine, namjerno odvojene:
--
--  1. erp_articles — SIROVO ogledalo API-ja, jedan red po sifraArtikla.
--     Uvijek potpuno i nepromijenjeno onako kako ERP kaže. Ovdje se ništa ne
--     uređuje ručno. Služi da se u svakom trenutku može odgovoriti "šta ERP
--     tvrdi o šifri 4472" bez pogađanja.
--
--  2. products — KURIRANI katalog shopa. Jedan proizvod objedinjuje više ERP
--     artikala (okusi i gramaže su u ERP-u zasebne šifre). Opisi, galerija,
--     tagovi i badge su naš rad i sinhronizacija ih NIKAD ne prepisuje.
--
--  Veza između njih je products.erp_skus — niz šifri koje pripadaju proizvodu.
--  Šifra je sidro identiteta: ako se u ERP-u promijeni naziv artikla, proizvod
--  se i dalje prepozna po šifri umjesto da se stvori duplikat.


-- ─────────────────────────────────────────────────────────────────────────────
--  1. Sirovo ogledalo ERP artikala
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists erp_articles (
  sku              text primary key,              -- sifraArtikla
  erp_id           bigint,                        -- idArtikla
  name             text not null,                 -- nazivArtikla, doslovno
  brand            text,                          -- nazivProizvodjaca
  group_name       text,                          -- nazivGrupe (ERP kategorija)

  -- Izvedeno pri uvozu (parsiranje naziva) — da spajanje u katalog ne mora
  -- ponavljati istu logiku i da se rezultat parsiranja može provjeriti.
  category_slug    text,                          -- naša kategorija
  base_name        text,                          -- naziv bez gramaže i okusa
  size             text,
  flavor           text,

  price            numeric(10,2),                 -- cijena
  price_discount   numeric(10,2),                 -- cijenaHH (snižena, ako postoji)
  qty              integer,                       -- kolicina; ERP je za sada NE šalje
  min_qty          integer,
  image_path       text,                          -- slikaPath
  description_html text,                          -- opisArtikla
  is_top           boolean not null default false,
  is_new           boolean not null default false,
  is_web           boolean not null default false, -- ERP je za sada uvijek false

  raw              jsonb not null default '{}',   -- cijeli red iz API-ja

  first_seen_at    timestamptz not null default now(),
  last_seen_at     timestamptz not null default now(),
  -- Popunjeno kad artikal prestane dolaziti iz API-ja. Ne brišemo ga — narudžbe
  -- i proizvodi se i dalje mogu referisati na tu šifru.
  missing_since    timestamptz,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists erp_articles_group_idx   on erp_articles (group_name);
create index if not exists erp_articles_brand_idx   on erp_articles (brand);
create index if not exists erp_articles_missing_idx on erp_articles (missing_since) where missing_since is null;

drop trigger if exists erp_articles_updated_at on erp_articles;
create trigger erp_articles_updated_at before update on erp_articles
  for each row execute function set_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
--  2. Veza kataloga na ERP
-- ─────────────────────────────────────────────────────────────────────────────
alter table products
  -- Sve ERP šifre koje čine ovaj proizvod (okusi × gramaže).
  add column if not exists erp_skus       text[] not null default '{}',
  -- Isključi kad se cijena postavlja ručno (npr. akcija koju ERP ne zna) —
  -- inače bi je sljedeća sinhronizacija vratila na ERP vrijednost.
  add column if not exists erp_sync_price boolean not null default true,
  add column if not exists erp_synced_at  timestamptz;

create index if not exists products_erp_skus_idx on products using gin (erp_skus);

-- Postojeći proizvodi su uvezeni s jednom šifrom u erp_sku — prenesi je u niz
-- da ih prva sinhronizacija prepozna umjesto da napravi duplikate.
update products
   set erp_skus = array[erp_sku]
 where erp_sku is not null and erp_sku <> '' and cardinality(erp_skus) = 0;


-- ─────────────────────────────────────────────────────────────────────────────
--  3. Dnevnik sinhronizacija
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists erp_sync_runs (
  id               uuid primary key default gen_random_uuid(),
  started_at       timestamptz not null default now(),
  finished_at      timestamptz,
  trigger_source   text,                          -- 'schedule' | 'manual'
  fetched          integer,                       -- artikala stiglo iz API-ja
  upserted         integer,                       -- upisano u erp_articles
  went_missing     integer,                       -- nestalo iz API-ja
  products_created integer,
  products_updated integer,
  ok               boolean,
  error            text
);

create index if not exists erp_sync_runs_started_idx on erp_sync_runs (started_at desc);


-- ─────────────────────────────────────────────────────────────────────────────
--  4. RLS — sve troje je interno, samo admin
-- ─────────────────────────────────────────────────────────────────────────────
alter table erp_articles  enable row level security;
alter table erp_sync_runs enable row level security;

drop policy if exists erp_articles_admin_all on erp_articles;
create policy erp_articles_admin_all on erp_articles for all using (is_admin()) with check (is_admin());

drop policy if exists erp_sync_runs_admin_all on erp_sync_runs;
create policy erp_sync_runs_admin_all on erp_sync_runs for all using (is_admin()) with check (is_admin());


-- ─────────────────────────────────────────────────────────────────────────────
--  5. Pregled: šta iz ERP-a još nije u katalogu
-- ─────────────────────────────────────────────────────────────────────────────
create or replace view erp_unmapped_articles as
select a.*
  from erp_articles a
 where a.missing_since is null
   and not exists (
     select 1 from products p where a.sku = any(p.erp_skus)
   );
