-- Brendovi s logotipima (serviraju se s vlastite domene: public/brands/)
-- Run: Supabase Dashboard → SQL Editor → Run
-- PAŽNJA: briše postojeće brendove pa ubacuje ispočetka.

delete from brands;

insert into brands (name, logo_url, is_active, sort_order) values
  ('Optimum Nutrition', '/brands/optimum-nutrition.png', true,  1),
  ('OstroVit',          '/brands/ostrovit.svg',          true,  2),
  ('Mutant',            '/brands/mutant.png',            true,  3),
  ('BSN',               '/brands/bsn.png',               true,  4),
  ('MuscleTech',        '/brands/muscletech.png',        true,  5),
  ('BioTechUSA',        '/brands/biotechusa.svg',        true,  6),
  ('Applied Nutrition', '/brands/applied-nutrition.jpg', true,  7),
  ('Body&Fit',          '/brands/body-fit.svg',          true,  8),
  ('Swanson Health',    '/brands/swanson.svg',           true,  9),
  ('Pure Gold Protein', '/brands/pure-gold.svg',         true, 10),
  ('Nutriversum',       '/brands/nutriversum.svg',       true, 11),
  ('Gorilla Wear',      '/brands/gorilla-wear.png',      true, 12);
