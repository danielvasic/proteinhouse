-- Osvjezavanje ERP slika, bez diranja rucnih.
--
-- Slike koje sync povuce iz ERP-a zive pod 'erp/...' u bucketu product-images.
-- Rucne (admin upload preko uploadProductImage) idu pod
-- '<slug>-<timestamp>.<ext>' — nikad pod 'erp/'. Taj prefiks je zato pouzdana
-- granica izmedju "nase, smije se prepisati" i "rucno, ne dirati".
--
-- erp_image_name pamti koje je ime slika imala u ERP-u kad smo je zadnji put
-- povukli. Kad se u ERP-u promijeni, sync to vidi i povuce novu; dok je isto,
-- slika se ne skida uopste (inace bi svaki prolaz vukao ~570 slika badava).
alter table products add column if not exists erp_image_name text;

comment on column products.erp_image_name is
  'Ime slike u ERP-u (erp_articles.image_path) u trenutku zadnjeg uvoza. NULL = nikad uvezeno iz ERP-a, ili je slika rucna.';
