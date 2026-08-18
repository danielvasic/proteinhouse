-- Proizvod može pripadati u više kategorija: primarna ostaje products.category,
-- a extra_categories su dodatne (npr. whey koji ide i u "mršavljenje").
-- Dodjeljuje se u Admin → Proizvodi → uredi → "Dodatne kategorije";
-- storefront kategoriju filtrira po objema.
-- Već primijenjeno na produkciji preko MCP-a; fajl radi reproducibilnosti.
alter table products
  add column if not exists extra_categories text[] not null default '{}';
create index if not exists products_extra_categories_idx on products using gin (extra_categories);
