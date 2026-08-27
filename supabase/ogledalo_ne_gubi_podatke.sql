-- ERP je 27.8.2026. vratio stari API: GetAllProducts opet radi, a GetByKlijent
-- je pao na "skeleton" zapise (bez brenda, grupe, slike, opisa). Kako sync tada
-- upisuje null u ta polja, ogledalo je preko noći izgubilo brend/kategoriju/
-- sliku za svih 3958 artikala, a stanje je obrisano jer je endpoint za lager
-- (GetArtikliSaStanjem) nestao.
--
-- Pravilo: degradiran odgovor NE SMIJE obrisati ono što već znamo. Ako novi
-- zapis nema vrijednost, a stari ju je imao — zadrži staru. Briše se samo
-- eksplicitno, ručno. Trigger štiti bez obzira koji kod piše u tabelu.
-- Već primijenjeno preko MCP-a; fajl radi reproducibilnosti.
create or replace function erp_articles_keep_known()
returns trigger
language plpgsql
as $$
begin
  new.brand            := coalesce(new.brand,            old.brand);
  new.group_name       := coalesce(new.group_name,       old.group_name);
  new.category_slug    := coalesce(new.category_slug,    old.category_slug);
  new.base_name        := coalesce(new.base_name,        old.base_name);
  new.size             := coalesce(new.size,             old.size);
  new.flavor           := coalesce(new.flavor,           old.flavor);
  new.image_path       := coalesce(new.image_path,       old.image_path);
  new.qty              := coalesce(new.qty,              old.qty);
  new.min_qty          := coalesce(new.min_qty,          old.min_qty);
  if coalesce(new.description_html, '') = '' then
    new.description_html := old.description_html;
  end if;
  return new;
end;
$$;

drop trigger if exists erp_articles_keep_known_trg on erp_articles;
create trigger erp_articles_keep_known_trg
  before update on erp_articles
  for each row execute function erp_articles_keep_known();

-- Dnevnik je govorio ok=true iako stanje nije stiglo — kvar je bio nevidljiv.
alter table erp_sync_runs
  add column if not exists source        text,
  add column if not exists stock_fetched integer,
  add column if not exists stock_error   text;
