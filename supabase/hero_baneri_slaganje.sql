-- Hero baneri po Slavenovim mockupima: sadržaj se slaže iz polja u adminu,
-- umjesto da je zapečen u sliku — Vico mijenja tekst/cijenu/USP bez dizajnera.
--   price_text/old_price_text → veliki cjenovni blok (mockup 2, ON Gold)
--   usp_lines → redovi s ikonama, jedan red = jedna stavka
--   fg_image_url → slika proizvoda, gura se u DESNU TREĆINU banera;
--                  tekst lijevo ostaje čitljiv preko gradijenta s lijeva na desno
-- Već primijenjeno preko MCP-a; fajl radi reproducibilnosti.
alter table hero_banners
  add column if not exists price_text     text,
  add column if not exists old_price_text text,
  add column if not exists usp_lines      text,
  add column if not exists fg_image_url   text;
