-- ============================================================
-- ProteinHouse.ba → Supabase Migration Script
-- Pokrenuti u Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. HERO BANNERS tabela ───────────────────────────────────
create table if not exists hero_banners (
  id                 uuid primary key default gen_random_uuid(),
  eyebrow            text,
  title_lines        text not null,        -- "/" za novi red, npr. "Snaga u/svakoj/mjerici"
  subtitle           text,
  cta_primary_text   text,
  cta_primary_link   text default '/kategorija/akcija',
  cta_secondary_text text,
  cta_secondary_link text default '/kategorija/proteini',
  image_url          text,
  is_active          boolean default false,
  sort_order         integer default 0,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

alter table hero_banners enable row level security;
create policy "Public read hero_banners"  on hero_banners for select using (true);
create policy "Admin full hero_banners"   on hero_banners using (is_admin());

-- ── 2. ORDERS tabela (ako ne postoji) ────────────────────────
create table if not exists orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text unique not null,
  customer_name    text not null,
  customer_email   text,
  customer_phone   text,
  shipping_address text,
  shipping_city    text,
  shipping_zip     text,
  notes            text,
  items            jsonb not null default '[]',
  total            numeric(10,2) not null,
  status           text not null default 'nova'
                   check (status in ('nova','potvrđena','u_pripremi','isporučena','otkazana')),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table orders enable row level security;
create policy "Admin full orders" on orders using (is_admin());

-- ── 3. KATEGORIJE ────────────────────────────────────────────
-- Briši i ponovo ubaci (uskladi s proteinhouse.ba strukturom)
insert into categories (slug, label, subs, sort_order, is_active, accent) values
  ('proteini',    'PROTEINI',          '["Whey","Izolat","Kazein","Veganski proteini","Proteinski barovi","Proteinski napici"]', 1,  true, false),
  ('gaineri',     'GAINERI',           '["Mass gaineri","Lean gaineri","Ugljikohidrati"]',                                       2,  true, false),
  ('kreatini',    'KREATINI',          '["Kreatin monohidrat","Kreatin HCL","Kreatin blend"]',                                   3,  true, false),
  ('aminokiseline','AMINOKISELINE',    '["BCAA","EAA","Glutamin","Arginini","Beta-alanin","Triptofan"]',                         4,  true, false),
  ('pre-workout', 'PRE-WORKOUT',       '["Stimulansi","Bez stimulansa","Pumpa","Energetici"]',                                   5,  true, false),
  ('vitamini',    'VITAMINI I ZDRAVLJE','["Multivitamini","Vitamin D","Omega 3","Magnezij","Zink","Probiotici","Kolagen"]',       6,  true, false),
  ('mrsavljenje', 'MRŠAVLJENJE',       '["Fat burneri","CLA","L-karnitin","Termogenici","Dijetetski proizvodi"]',                7,  true, false),
  ('hrana',       'ZDRAVA HRANA',      '["Proteinski namazi","Proteinske čokolade","Riževi kolutovi","Proteinska kaša"]',        8,  true, false),
  ('oprema',      'OPREMA I DODACI',   '["Šejkeri","Pojasevi za vježbanje","Rukavice","Trake","Torbe","Odjeća"]',                9,  true, false),
  ('akcija',      'AKCIJA',            '[]',                                                                                     10, true, true )
on conflict (slug) do update set
  label      = excluded.label,
  subs       = excluded.subs,
  sort_order = excluded.sort_order,
  is_active  = excluded.is_active,
  accent     = excluded.accent;

-- ── 4. HERO BANER (početni) ──────────────────────────────────
insert into hero_banners (eyebrow, title_lines, subtitle, cta_primary_text, cta_primary_link, cta_secondary_text, cta_secondary_link, image_url, is_active, sort_order)
values (
  'Dostava po cijeloj BiH · Mepas Mall, Mostar',
  'Proteini i/suplementi/za pobjednike',
  'Originalni proizvodi top svjetskih brendova. Brza dostava po cijeloj BiH. Do −50% na izabrane artikle.',
  'Pogledaj akcije',   '/kategorija/akcija',
  'Svi proizvodi',     '/',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=85&auto=format&fit=crop',
  true, 1
),
(
  'Novo u ponudi',
  'Najnoviji/proteini/2026',
  'Svježi dodaci iz tvornica direktno do vas. Optimum Nutrition, Scitec, Ostrovit i još 50+ brendova.',
  'Novi proizvodi',    '/kategorija/proteini',
  'Pogledaj brendove', '/',
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1920&q=85&auto=format&fit=crop',
  false, 2
)
on conflict do nothing;

-- ── 5. SITE CONTENT — kontakt i servisi ──────────────────────
insert into site_content (key, value, updated_at) values
  ('contact_phone',   '{"text":"+387 33 545 000 · +387 62 077 044"}', now()),
  ('contact_email',   '{"text":"info@proteinhouse.ba"}',              now()),
  ('contact_hours',   '{"text":"PON–PET 9–17 · SUB 9–14"}',          now()),
  ('footer_shipping', '{"text":"BESPLATNA DOSTAVA > 100 KM"}',        now()),
  ('store_sarajevo_addr',  '{"text":"Maršala Tita 28, Sarajevo"}',    now()),
  ('store_sarajevo_hours', '{"text":"PON–PET 9–17 · SUB 9–14"}',     now()),
  ('store_mostar_addr',    '{"text":"Bulevar 12, Mostar"}',           now()),
  ('store_mostar_hours',   '{"text":"PON–PET 9–17 · SUB 9–13"}',     now()),
  ('store_bl_addr',        '{"text":"Kralja Petra I 5, Banja Luka"}', now()),
  ('store_bl_hours',       '{"text":"PON–PET 9–17 · SUB 9–14"}',     now()),
  ('promo_1_title', '{"text":"Besplatna dostava"}',      now()),
  ('promo_1_sub',   '{"text":"Za narudžbe preko 100 KM"}',now()),
  ('promo_2_title', '{"text":"100% originalni proizvodi"}',now()),
  ('promo_2_sub',   '{"text":"Certifikati i garancija"}', now()),
  ('promo_3_title', '{"text":"Bodovi lojalnosti"}',      now()),
  ('promo_3_sub',   '{"text":"Za svaku kupovinu"}',      now()),
  ('promo_4_title', '{"text":"Plaćanje pouzećem"}',      now()),
  ('promo_4_sub',   '{"text":"Sigurno i pouzdano"}',     now()),
  ('footer_about',  '{"text":"ProteinHouse je vodeći online shop za sportsku prehranu u BiH. Nudimo originalne suplemente i proteinske proizvode top svjetskih brendova s brzom dostavom na kućnu adresu."}', now())
on conflict (key) do update set value = excluded.value, updated_at = now();

-- ── 6. STORAGE — dodaj subs kolonu na categories (ako ne postoji) ─
alter table categories add column if not exists subs jsonb default '[]';
alter table banners     add column if not exists tag  text;
alter table products    add column if not exists sizes       jsonb default '[]';
alter table products    add column if not exists image_path  text;

-- ── 7. PROIZVODI — predložak (popuni iz admin panela) ────────
-- Ubaci primjere proizvoda koji se mogu urediti u /admin/proizvodi
-- Zamijeni image_url s pravim slikama uploadovanim na Storage

-- insert into products (brand, title, slug, price, old_price, badge, category, description, flavors, sizes, image_url, is_active, sort_order)
-- values
--   ('OPTIMUM NUTRITION', 'Gold Standard 100% Whey 2268g', 'gold-standard-whey-2268g', 119.90, 149.90, '-20%', 'proteini', 'Premium whey protein...', '["Chocolate","Vanilla","Strawberry"]', '["908g","2268g"]', 'URL', true, 1),
--   ('SCITEC NUTRITION',  '100% Whey Protein 2350g',       'scitec-whey-2350g',        89.90, null,   null,    'proteini', '...', '["Chocolate","Vanilla"]', '["1000g","2350g"]', 'URL', true, 2);

-- ── 8. BLOG POSTOVI — predložak ──────────────────────────────
-- insert into blog_posts (title, slug, excerpt, content, cover_url, author, published, published_at)
-- values (...);

-- ── GOTOVO ───────────────────────────────────────────────────
-- Nakon ovoga:
-- 1. Idi na /admin/hero-baneri i aktiviraj željeni baner
-- 2. Idi na /admin/proizvodi i dodaj proizvode (upload slika)
-- 3. Idi na /admin/sadrzaj i provjeri sve tekstove
-- 4. Idi na /admin/kategorije i uredi pod-kategorije

-- ── 9. STORES tabela (dinamičke poslovnice) ──────────────────
create table if not exists stores (
  id            uuid primary key default gen_random_uuid(),
  city          text not null,
  address       text not null,
  phone         text,
  email         text,
  working_hours text,
  map_url       text,
  sort_order    integer default 0,
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
alter table stores enable row level security;
create policy "Public read stores"  on stores for select using (true);
create policy "Admin full stores"   on stores using (is_admin());

-- OBRIŠI stare pogrešne store ključeve iz site_content
delete from site_content where key in (
  'store_sarajevo_addr', 'store_sarajevo_hours',
  'store_bl_addr', 'store_bl_hours',
  'store_mostar_addr', 'store_mostar_hours'
);

-- Ubaci stvarnu poslovnicu (Mostar)
-- Podatke provjeri i korigiraj na proteinhouse.ba
insert into stores (city, address, phone, email, working_hours, sort_order, is_active)
values (
  'Mostar',
  'Adresu unesi iz proteinhouse.ba',   -- TODO: provjeri na sajtu
  '',                                   -- TODO: provjeri telefon
  'info@proteinhouse.ba',
  'PON–PET 9–17 · SUB 9–14',           -- TODO: provjeri radno vrijeme
  1,
  true
)
on conflict do nothing;
