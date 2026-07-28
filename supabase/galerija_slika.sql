-- Galerija slika po proizvodu + vezivanje slike za okus/gramažu
-- Run: Supabase Dashboard → SQL Editor → Run

alter table products add column if not exists images jsonb not null default '[]';

-- Format svakog elementa niza:
--   { "path": "gold-whey-172...jpg", "variant": null }   ← Supabase storage (isti bucket kao image_path)
--   { "url": "https://...",          "variant": "Čokolada" }  ← eksterni URL
--   variant: null = opšta slika (default); ili tačan okus / gramaža / "okus|gramaža"
--            (isti format ključa kao stock_variants) da se slika promijeni kad
--            kupac izabere tu varijantu.
--
-- Postojeći image_path/image_url ostaju kao fallback — ako "images" niz je
-- prazan, frontend i dalje koristi stari jednostruki image. Ništa se ne
-- migrira automatski; admin popuni galeriju kad otvori i sačuva proizvod
-- (ProductEdit učitava postojeću sliku kao prvu stavku galerije pri otvaranju).
