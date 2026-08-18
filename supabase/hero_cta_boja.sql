-- Notion: "NEĆEMO svaki CTA obojiti u crveno - idemo sa plavom bojom, a crvenu
-- ćemo koristiti u baš iznimnim situacijama. Mislim da će najčešća situacija
-- biti da imamo neke plave, a neke crvene."
--
-- Boja glavnog CTA-a je zato svojstvo pojedinačnog banera, s plavom kao
-- defaultom — crvena se bira svjesno, po baneru, u Admin → Hero baneri.
-- Već primijenjeno na produkciji preko MCP-a; fajl radi reproducibilnosti.
alter table hero_banners
  add column if not exists cta_style text not null default 'plavi'
  check (cta_style in ('plavi', 'crveni'));
