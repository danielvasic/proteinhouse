-- Pravila dostave i poruke — po informacijama od Vice (18.08.2026):
--   do 100 KM → 9 KM · 100–149 KM → 7 KM · preko 149 KM → besplatno
--   Gorilla poklon: prag potrošnje 150+ KM (ne "kupi whey")
-- Obračun je u src/lib/shipping.js; ovo su tekstovi i prag kampanje.
-- Već primijenjeno na produkciji preko MCP-a; fajl radi reproducibilnosti.

update site_content set value = '{"text": "100% sigurna kupovina\nBesplatna dostava za narudžbe preko 149 KM\nKorpa 150+ KM → Gorilla Wear artikal po izboru gratis"}'
 where key = 'news_bar_messages';
update site_content set value = '{"text": "Besplatna dostava > 149 KM"}' where key = 'footer_shipping';

update gift_campaigns
   set min_order_total = 150,
       subtitle = 'Uz narudžbu preko 150 KM poklanjamo ti Gorilla Wear artikal u tvojoj veličini.'
 where name = 'Gorilla Wear poklon';
