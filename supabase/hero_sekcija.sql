-- Hero sekcija proizvoda — 3 najrelevantnije brojke (Ostrovit stil)
-- Format: [{"value":"60","label":"kapsula","sub":"po pakovanju"}, ...]
-- Run: Supabase Dashboard → SQL Editor → Run

alter table products add column if not exists hero_stats jsonb not null default '[]';

-- Primjeri (Opti-Men / Opti-Women — stvarne vrijednosti s deklaracije)
update products set hero_stats = '[
  {"value":"90","label":"tableta","sub":"po pakovanju"},
  {"value":"30","label":"porcija","sub":"po pakovanju"},
  {"value":"3","label":"tablete","sub":"1 porcija = 3 tablete"}
]'::jsonb where slug = 'optimum-nutrition-optimen-90-tabs';

update products set hero_stats = '[
  {"value":"60","label":"kapsula","sub":"po pakovanju"},
  {"value":"30","label":"porcija","sub":"po pakovanju"},
  {"value":"2","label":"kapsule","sub":"1 porcija = 2 kapsule"}
]'::jsonb where slug = 'optimum-nutrition-optiwomen-60-caps';
