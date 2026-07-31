-- ============================================================
-- ProteinHouse.ba — Demo seed data
-- Pokrenuti u: Supabase Dashboard → SQL Editor → Run
-- ============================================================
-- ⚠ TODO stavke su označene — unesi prave podatke nakon pokretanja
-- ============================================================


-- ── 1. SITE CONTENT ──────────────────────────────────────────
insert into site_content (key, value, updated_at) values
  ('contact_phone',    '{"text":"+387 33 XXX XXX · +387 6X XXX XXX"}', now()), -- ⚠ TODO: pravi broj
  ('contact_email',    '{"text":"proteinhousedoo@gmail.com"}',          now()),
  ('contact_hours',    '{"text":"PON–PET 9:00–17:00 · SUB 9:00–14:00"}', now()), -- ⚠ TODO: provjeri radno vrijeme
  ('footer_shipping',  '{"text":"BESPLATNA DOSTAVA > 100 KM"}',         now()),
  ('footer_about',     '{"text":"ProteinHouse je vodeći online shop za sportsku prehranu u Bosni i Hercegovini. Nudimo originalne suplemente i proteinske proizvode vodećih svjetskih brendova s brzom dostavom na kućnu adresu."}', now()),
  ('footer_phone',     '{"text":"+387 33 XXX XXX"}',                    now()), -- ⚠ TODO
  ('footer_email',     '{"text":"proteinhousedoo@gmail.com"}',          now()),
  ('footer_copyright', '{"text":"© 2026 ProteinHouse d.o.o. Sva prava zadržana."}', now()),
  ('site_title',       '{"text":"ProteinHouse — Online protein i suplement shop u BiH"}', now()),
  ('meta_description', '{"text":"Kupujte proteine, suplemente i sportsku opremu online. Originalni proizvodi, brza dostava po Bosni i Hercegovini. Do -50% popusta."}', now()),
  ('promo_1_title',    '{"text":"Besplatna dostava"}',         now()),
  ('promo_1_sub',      '{"text":"Za narudžbe preko 100 KM"}',  now()),
  ('promo_2_title',    '{"text":"100% originalni proizvodi"}', now()),
  ('promo_2_sub',      '{"text":"Certifikati i garancija"}',   now()),
  ('promo_3_title',    '{"text":"Bodovi lojalnosti"}',         now()),
  ('promo_3_sub',      '{"text":"Za svaku kupovinu"}',         now()),
  ('promo_4_title',    '{"text":"Plaćanje pouzećem"}',         now()),
  ('promo_4_sub',      '{"text":"Sigurno i pouzdano"}',        now()),
  ('about_intro',        '{"text":"ProteinHouse je osnovan s jednim ciljem — da sportašima i rekreativcima u BiH omogući pristup originalnim, kvalitetnim suplementima po dostupnim cijenama. Više od 10 godina smo lider u online prodaji sportske prehrane."}', now()),
  ('about_stat_1_value', '{"text":"10+"}',         now()),
  ('about_stat_1_label', '{"text":"Godina iskustva"}', now()),
  ('about_stat_2_value', '{"text":"50.000+"}',      now()),
  ('about_stat_2_label', '{"text":"Zadovoljnih kupaca"}', now()),
  ('about_stat_3_value', '{"text":"2.000+"}',       now()),
  ('about_stat_3_label', '{"text":"Proizvoda u ponudi"}', now()),
  ('about_stat_4_value', '{"text":"80+"}',           now()),
  ('about_stat_4_label', '{"text":"Brendova"}',     now())
on conflict (key) do update set value = excluded.value, updated_at = now();


-- ── 2. POSLOVNICE ────────────────────────────────────────────
truncate stores restart identity cascade;

insert into stores (city, address, phone, email, working_hours, map_url, sort_order, is_active) values
  ('Sarajevo',
   'XXX ulica bb, Sarajevo',                   -- ⚠ TODO: prava adresa
   '+387 33 XXX XXX',                           -- ⚠ TODO
   'proteinhousedoo@gmail.com',
   'PON–PET 9:00–17:00 · SUB 9:00–14:00',
   'https://maps.google.com/?q=Sarajevo+BiH',   -- ⚠ TODO: pravi Maps link
   1, true),
  ('Mostar',
   'XXX ulica bb, Mostar',                      -- ⚠ TODO
   '+387 36 XXX XXX',                           -- ⚠ TODO
   'proteinhousedoo@gmail.com',
   'PON–PET 9:00–17:00 · SUB 9:00–13:00',
   'https://maps.google.com/?q=Mostar+BiH',     -- ⚠ TODO
   2, true),
  ('Banja Luka',
   'XXX ulica bb, Banja Luka',                  -- ⚠ TODO
   '+387 51 XXX XXX',                           -- ⚠ TODO
   'proteinhousedoo@gmail.com',
   'PON–PET 9:00–17:00 · SUB 9:00–14:00',
   'https://maps.google.com/?q=Banja+Luka+BiH', -- ⚠ TODO
   3, true);


-- ── 3. HERO BANERI ───────────────────────────────────────────
delete from hero_banners;

insert into hero_banners
  (eyebrow, title_lines, subtitle,
   cta_primary_text, cta_primary_link,
   cta_secondary_text, cta_secondary_link,
   image_url, is_active, sort_order)
values
  ('Dostava po cijeloj BiH · Mepas Mall, Mostar',
   'Proteini i/suplementi/za pobjednike',
   'Originalni proizvodi vodećih svjetskih brendova. Brza dostava po cijeloj BiH. Do -50% na izabrane artikle.',
   'Pogledaj akcije', '/kategorija/akcija',
   'Svi proizvodi',   '/',
   'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80&auto=format&fit=crop',
   true, 1),
  ('Novo u ponudi · 2026',
   'Najnoviji/suplementi/stigli su',
   'Optimum Nutrition, Scitec, BioTech USA, Ostrovit i još 80+ brendova. Sve na jednom mjestu.',
   'Novi proizvodi', '/kategorija/proteini',
   'Pogledaj brendove', '/',
   'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1920&q=80&auto=format&fit=crop',
   false, 2),
  ('Ljetna akcija',
   'Do -50%/na izabrane/suplemente',
   'Iskoristite ljetnu ponudu i uštedite na najboljim proteinima, kreatinima i vitaminima.',
   'Kupi s popustom', '/kategorija/akcija',
   'Pogledaj sve', '/',
   'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1920&q=80&auto=format&fit=crop',
   false, 3);


-- ── 4. KATEGORIJE ────────────────────────────────────────────
insert into categories (slug, label, subs, sort_order, is_active, accent) values
  ('proteini',      'PROTEINI',           '["Whey protein","Izolat","Kazein","Veganski protein","Proteinski barovi","Proteinski napici"]',    1,  true, false),
  ('gaineri',       'GAINERI',            '["Mass gaineri","Lean gaineri","Ugljikohidrati"]',                                                  2,  true, false),
  ('kreatini',      'KREATINI',           '["Kreatin monohidrat","Kreatin HCL","Kreatin blend","Kreatin kapsule"]',                           3,  true, false),
  ('aminokiseline', 'AMINOKISELINE',      '["BCAA","EAA","Glutamin","Arginin","Beta-alanin","L-karnitin"]',                                    4,  true, false),
  ('pre-workout',   'PRE-WORKOUT',        '["Sa stimulansima","Bez stimulansa","Pumpa","Energetski napici"]',                                  5,  true, false),
  ('vitamini',      'VITAMINI I ZDRAVLJE','["Multivitamini","Vitamin D3","Omega-3","Magnezij","Zink","Probiotici","Kolagen","ZMA"]',           6,  true, false),
  ('mrsavljenje',   'MRŠAVLJENJE',        '["Fat burneri","CLA","L-karnitin","Termogenici","Dijeta proteini"]',                               7,  true, false),
  ('hrana',         'ZDRAVA HRANA',       '["Proteinski namazi","Proteinske čokolade","Riževi kolutovi","Proteinska kaša"]',                  8,  true, false),
  ('oprema',        'OPREMA I DODACI',    '["Šejkeri","Pojasevi","Rukavice","Elastične trake","Torbe","Majice"]',                             9,  true, false),
  ('akcija',        'AKCIJA',             '[]',                                                                                                10, true, true)
on conflict (slug) do update set
  label = excluded.label, subs = excluded.subs,
  sort_order = excluded.sort_order, is_active = excluded.is_active, accent = excluded.accent;


-- ── 5. BRENDOVI ──────────────────────────────────────────────
-- Kreirati tabelu ako ne postoji (vidi /admin/brendovi za SQL)
delete from brands;

insert into brands (name, logo_url, is_active, sort_order) values
  ('Optimum Nutrition', '', true,  1),
  ('Scitec Nutrition',  '', true,  2),
  ('BioTech USA',       '', true,  3),
  ('Ostrovit',          '', true,  4),
  ('BSN',               '', true,  5),
  ('MuscleTech',        '', true,  6),
  ('Dymatize',          '', true,  7),
  ('MyProtein',         '', true,  8),
  ('Applied Nutrition', '', true,  9),
  ('QNT',               '', true, 10),
  ('Kevin Levrone',     '', true, 11),
  ('Nutrend',           '', true, 12);


-- ── 6. PROIZVODI ─────────────────────────────────────────────
-- image_url = '' → uploaduj slike naknadno iz /admin/proizvodi
-- flavors koristi PostgreSQL array sintaksu: ARRAY['...']

delete from products;

insert into products
  (brand, title, slug, price, old_price, badge, category,
   description, flavors, rating, review_count, is_active, sort_order)
values

-- PROTEINI ────────────────────────────────────────────────────
('OPTIMUM NUTRITION', 'Gold Standard 100% Whey 908g',
 'on-gold-standard-whey-908g', 79.90, 89.90, '-11%', 'proteini',
 'Gold Standard je najprodavaniji whey protein na svijetu. Svaka porcija sadrži 24g proteina, 5.5g BCAA i 4g glutamina.',
 ARRAY['Double Rich Chocolate','Vanilla Ice Cream','Strawberry Banana','Cookies & Cream','Rocky Road'],
 4.9, 312, true, 1),

('OPTIMUM NUTRITION', 'Gold Standard 100% Whey 2270g',
 'on-gold-standard-whey-2270g', 169.90, 189.90, '-11%', 'proteini',
 'Najveće pakovanje Gold Standard whey proteina. Idealno za redovne korisnike. 73 porcije po pakovanju.',
 ARRAY['Double Rich Chocolate','Vanilla Ice Cream','Strawberry Banana','Extreme Milk Chocolate'],
 4.9, 186, true, 2),

('SCITEC NUTRITION', '100% Whey Protein Professional 920g',
 'scitec-whey-protein-920g', 54.90, null, null, 'proteini',
 'Scitec 100% Whey Professional pruža 22g proteina iz sirutke po porciji. Odlična cijena i kvalitet. Bez aspartama.',
 ARRAY['Čokolada','Vanilija','Jagoda','Banana','Čokolada-Kokos','Bijela čokolada','Tiramisu'],
 4.7, 254, true, 3),

('SCITEC NUTRITION', '100% Whey Protein Professional 2350g',
 'scitec-whey-protein-2350g', 104.90, 119.90, '-12%', 'proteini',
 'Ekonomično pakovanje Scitec whey proteina. 76 porcija. Idealan omjer cijene i kvaliteta na tržištu BiH.',
 ARRAY['Čokolada','Vanilija','Jagoda','Čokolada-Kokos','Banana'],
 4.7, 198, true, 4),

('BIOTECH USA', 'Iso Whey Zero 500g',
 'biotech-iso-whey-zero-500g', 49.90, null, 'NOVO', 'proteini',
 'Izolat sirutke bez glutena i laktoze. 86g proteina na 100g. Nulti šećer, nulte masti.',
 ARRAY['Čokolada','Vanilija','Jagoda','Cookies & Cream','Peanut Butter'],
 4.8, 143, true, 5),

('DYMATIZE', 'ISO100 Hydrolyzed 725g',
 'dymatize-iso100-725g', 79.90, 89.90, '-11%', 'proteini',
 'Hidrolizovani izolat sirutke — najbrža apsorpcija. 25g proteina, 5.5g BCAA. Idealan za post-workout.',
 ARRAY['Gourmet Chocolate','Gourmet Vanilla','Strawberry','Birthday Cake','Fudge Brownie'],
 4.8, 97, true, 6),

('MYPROTEIN', 'Impact Whey Protein 1kg',
 'myprotein-impact-whey-1kg', 44.90, 54.90, '-18%', 'proteini',
 '21g proteina po porciji. Više od 70 ukusa. Certificiran Informed-Sport.',
 ARRAY['Čokolada','Vanilija','Jagoda','Cookies & Cream','Natural Chocolate'],
 4.6, 421, true, 7),

('APPLIED NUTRITION', 'Critical Whey 2kg',
 'applied-nutrition-critical-whey-2kg', 79.90, null, null, 'proteini',
 'Blend whey koncentrata, izolata i hidrolizata. 25g proteina po porciji. Odličan ukus i miješanje.',
 ARRAY['Chocolate Silk','Vanilla Cheesecake','Strawberry Milkshake','Banoffee Pie'],
 4.7, 88, true, 8),

-- GAINERI ─────────────────────────────────────────────────────
('OPTIMUM NUTRITION', 'Serious Mass 2720g',
 'on-serious-mass-2720g', 89.90, 109.90, '-18%', 'gaineri',
 'Najpopularniji mass gainer na svijetu. 1250 kalorija po porciji, 50g proteina, 252g ugljikohidrata.',
 ARRAY['Chocolate','Vanilla','Strawberry','Cookies & Cream'],
 4.7, 203, true, 9),

('BSN', 'True Mass 1200 4.73kg',
 'bsn-true-mass-1200-4-73kg', 149.90, 179.90, '-16%', 'gaineri',
 'Ultra-premium mass gainer. 1230 kalorija, 52g proteina, 215g ugljikohidrata. Sadrži MCT masti i probavne enzime.',
 ARRAY['Chocolate Milkshake','Vanilla Ice Cream','Strawberry Milkshake'],
 4.6, 119, true, 10),

('KEVIN LEVRONE', 'Anabolic Mass 7kg',
 'kevin-levrone-anabolic-mass-7kg', 149.90, 179.90, '-16%', 'gaineri',
 'Profesionalni mass gainer s anaboličnom formulom. 596 kalorija, 40g proteina, 95g ugljikohidrata po porciji.',
 ARRAY['Čokolada','Vanilija','Jagoda'],
 4.5, 76, true, 11),

-- KREATINI ────────────────────────────────────────────────────
('OPTIMUM NUTRITION', 'Micronized Creatine Powder 634g',
 'on-creatine-634g', 59.90, 69.90, '-14%', 'kreatini',
 'Kreatin monohidrat farmaceutske čistoće. 125 serviranja. Mikronizovan za bolju topivost i apsorpciju.',
 ARRAY['Unflavoured'],
 4.9, 445, true, 12),

('OSTROVIT', 'Creatine Monohydrate 500g',
 'ostrovit-creatine-500g', 19.90, null, null, 'kreatini',
 'Čisti kreatin monohidrat bez aditiva. 100 porcija po 5g. Odlična vrijednost za novac.',
 ARRAY['Unflavoured'],
 4.7, 287, true, 13),

('SCITEC NUTRITION', 'Creatine Ethyl Ester 300g',
 'scitec-cee-300g', 29.90, 34.90, '-14%', 'kreatini',
 'Kreatin etil estar — poboljšana apsorpcija. Bez faze punjenja. 60 porcija.',
 ARRAY['Unflavoured'],
 4.4, 62, true, 14),

-- AMINOKISELINE ───────────────────────────────────────────────
('SCITEC NUTRITION', 'BCAA Xpress 700g',
 'scitec-bcaa-xpress-700g', 44.90, 49.90, '-10%', 'aminokiseline',
 'BCAA aminokiseline u omjeru 2:1:1. Pomaže u oporavku i smanjenju razgradnje mišića.',
 ARRAY['Jabuka','Mango','Lubenica','Grejpfrut','Tropical'],
 4.7, 178, true, 15),

('BIOTECH USA', 'BCAA Zero 360g',
 'biotech-bcaa-zero-360g', 34.90, null, null, 'aminokiseline',
 'Niskokaloričan BCAA napitak bez šećera. Omjer 2:1:1 s dodanim B6 vitaminom.',
 ARRAY['Fruit Punch','Cola','Mango-Maracuja','Tropical','Peach Ice Tea'],
 4.6, 134, true, 16),

-- PRE-WORKOUT ─────────────────────────────────────────────────
('MUSCLETCH', 'Vapor X5 Next Gen 260g',
 'muscletech-vapor-x5-260g', 54.90, 64.90, '-15%', 'pre-workout',
 'Jedan od najjačih pre-workout formula. Kreatin, betain, beta-alanin i kofein za maksimalnu energiju i pumpu.',
 ARRAY['Blue Raspberry','Fruit Punch','Watermelon','Mango','Green Apple'],
 4.5, 93, true, 17),

('APPLIED NUTRITION', 'ABE Pre-Workout 315g',
 'applied-nutrition-abe-315g', 39.90, null, 'NOVO', 'pre-workout',
 'All Black Everything — beta-alanin, citrulin, kofein i kreatin monohidrat. Energija i pumpa.',
 ARRAY['Tropical','Bubblegum','Cola Lime','Candy Ice Blast','Cherry Cola'],
 4.7, 156, true, 18),

-- VITAMINI ────────────────────────────────────────────────────
('BIOTECH USA', 'Daily One Multivitamin 90 kapsula',
 'biotech-daily-one-90kaps', 19.90, null, null, 'vitamini',
 'Kompletna formula multivitamina i minerala za sportaše. 28 esencijalnih nutrijenata u jednoj kapsuli dnevno.',
 ARRAY[]::text[],
 4.8, 312, true, 19),

('OSTROVIT', 'Vitamin D3 + K2 90 tableta',
 'ostrovit-vit-d3-k2-90tab', 14.90, null, null, 'vitamini',
 '2000 IU vitamina D3 i 100mcg vitamina K2 MK-7. Podrška imunitetu, kostima i kardiovaskularnom zdravlju.',
 ARRAY[]::text[],
 4.8, 267, true, 20),

('SCITEC NUTRITION', 'Omega-3 100 kapsula',
 'scitec-omega3-100kaps', 24.90, 29.90, '-16%', 'vitamini',
 '1000mg ribljeg ulja po kapsuli. EPA i DHA masne kiseline za zdravlje srca i mozga.',
 ARRAY[]::text[],
 4.7, 198, true, 21),

-- MRŠAVLJENJE ─────────────────────────────────────────────────
('SCITEC NUTRITION', 'L-Carnitine Concentrate 500ml',
 'scitec-lcarnitine-concentrate-500ml', 24.90, null, null, 'mrsavljenje',
 '3000mg L-karnitina po porciji. Tečni oblik za bržu apsorpciju. Transport masnih kiselina u mitohondrije.',
 ARRAY['Cherry','Mandarin','Lemon'],
 4.6, 143, true, 22),

('BIOTECH USA', 'Thermo Drine 60 kapsula',
 'biotech-thermo-drine-60kaps', 29.90, 34.90, '-14%', 'mrsavljenje',
 'Termogeni fat burner s kofeinom, zelenim čajem, kapsaicinom i L-karnitinom. Poboljšava metabolizam i energiju.',
 ARRAY[]::text[],
 4.3, 87, true, 23),

-- ZDRAVA HRANA ────────────────────────────────────────────────
('SCITEC NUTRITION', 'Choco Pro 50g',
 'scitec-choco-pro-50g', 3.90, null, null, 'hrana',
 'Proteinska čokolada s 20g proteina i samo 1g šećera. Savršena kao zdravi desert ili post-workout obrok.',
 ARRAY['Tamna čokolada','Mliječna čokolada','Bijela čokolada','Naranča-čokolada'],
 4.6, 209, true, 24),

-- OPREMA ──────────────────────────────────────────────────────
('SCITEC NUTRITION', 'BigMouth Shaker 1000ml',
 'scitec-bigmouth-shaker-1000ml', 12.90, null, null, 'oprema',
 'Kvalitetni šejker s velikim otvorom. BPA-free plastika. Sadrži mrežicu za miješanje. 1000ml.',
 ARRAY['Crni','Bijeli','Plavi','Crveni','Zeleni'],
 4.5, 176, true, 25);


-- ── ZAVRŠNO ───────────────────────────────────────────────────
-- Nakon pokretanja:
-- 1. /admin/hero-baneri  → aktiviraj željeni baner (klikni zvjezdicu)
-- 2. /admin/proizvodi    → uploaduj slike za svaki proizvod
-- 3. /admin/poslovnice   → zamijeni sve ⚠ TODO adrese i telefone
-- 4. /admin/postavke     → zamijeni ⚠ TODO telefone u Kontakt tabu
-- 5. /admin/brendovi     → uploaduj logotipe brendova
