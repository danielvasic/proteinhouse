-- Notion TO-DO: "Lowercase — Uklanjamo ALL CAPS".
-- CSS transformacija je skinuta u kodu; ovo sredjuje podatke koji su u bazi
-- bili uneseni velikim slovima. Vec primijenjeno na produkciji preko MCP-a —
-- fajl je tu radi reproducibilnosti na svjezoj bazi.

update categories set label = case slug
  when 'proteini'      then 'Proteini'
  when 'gaineri'       then 'Gaineri'
  when 'kreatini'      then 'Kreatini'
  when 'aminokiseline' then 'Aminokiseline'
  when 'pre-workout'   then 'Pre-workout'
  when 'vitamini'      then 'Vitamini i zdravlje'
  when 'mrsavljenje'   then 'Mršavljenje'
  when 'hrana'         then 'Zdrava hrana'
  when 'oprema'        then 'Oprema i dodaci'
  when 'akcija'        then 'Akcija'
  else label end
where slug in ('proteini','gaineri','kreatini','aminokiseline','pre-workout','vitamini','mrsavljenje','hrana','oprema','akcija');

update site_content set value = '{"text": "Besplatna dostava > 100 KM"}' where key = 'footer_shipping';
update site_content set value = '{"text": "−10% na prvu narudžbu"}'     where key = 'lifetime_banner_text';
