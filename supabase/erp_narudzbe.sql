-- Veza web narudžbi s ERP-om (POST /api/Narudzbe/Add).
--
--   erp_order_id    int ID koji ERP vrati iz /Add; null = još nije poslana
--   erp_pushed_at   kada je uspješno poslana
--   erp_push_error  zadnja greška ili upozorenja rezolucije stavki
--
-- Parcijalni indeks nosi satnu metlu (pushPendingOrders) koja skuplja
-- neposlane narudžbe zadnjih 7 dana.

alter table orders
  add column if not exists erp_order_id   integer,
  add column if not exists erp_pushed_at  timestamptz,
  add column if not exists erp_push_error text;

create index if not exists orders_erp_pending_idx
  on orders (created_at)
  where erp_order_id is null;
