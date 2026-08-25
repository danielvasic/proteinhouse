-- Novi ERP API (WebShopRobMat, kolovoz 2026) napokon šalje stanje skladišta,
-- pa ogledalo i katalog dobijaju ono što je add_stock_columns.sql pripremio.

-- ERP šalje stanje kao decimal (npr. 2.0) — kolona je bila integer iz vremena
-- kad se ništa nije slalo. Pogled erp_unmapped_articles ovisi o koloni, pa se
-- spušta i vraća identičan.
drop view erp_unmapped_articles;

alter table erp_articles
  alter column qty type numeric using qty::numeric;

create view erp_unmapped_articles as
select sku, erp_id, name, brand, group_name, category_slug, base_name, size,
       flavor, price, price_discount, qty, min_qty, image_path,
       description_html, is_top, is_new, is_web, raw, first_seen_at,
       last_seen_at, missing_since, created_at, updated_at
  from erp_articles a
 where missing_since is null
   and not exists (select 1 from products p where a.sku = any (p.erp_skus));

-- Pristanak po proizvodu, po uzoru na erp_sync_price — ali default FALSE.
-- Pogrešna cijena je kriva cifra; pogrešno stanje BLOKIRA kupovinu, jer
-- hasAnyStock za proizvod s varijantama gleda isključivo stock_variants.
-- Uključuje se po proizvodu tek kad se provjeri da se ključevi varijanti
-- (okus/gramaža) poklapaju s onim što ERP parser izvuče iz naziva artikla.
alter table products
  add column if not exists erp_sync_stock boolean not null default false;
