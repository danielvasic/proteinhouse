-- ─────────────────────────────────────────────────────────────────────────────
-- Sadržaj sa starog sajta (proteinhouse.ba) → novi sajt
-- Kontakti, O nama, trgovina i blog. Email je NOVI: podrska@proteinhouse.ba
-- Run: Supabase Dashboard → SQL Editor → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Kontakti (header, footer, kontakt stranica) ───────────────────────────
insert into site_content (key, value) values
  ('contact_phone',  '{"text": "065/091-094 (dostupni i na Viberu)"}'),
  ('contact_email',  '{"text": "podrska@proteinhouse.ba"}'),
  ('contact_hours',  '{"text": "PON–SUB 9:00–21:00"}'),
  ('footer_phone',   '{"text": "065/091-094"}'),
  ('footer_email',   '{"text": "podrska@proteinhouse.ba"}'),
  ('footer_description', '{"text": "Potpora za vaš fitness cilj i kvalitetni suplementi za svaki korak vašeg aktivnog života."}'),
  ('footer_about',   '{"text": "Potpora za vaš fitness cilj i kvalitetni suplementi za svaki korak vašeg aktivnog života."}')
on conflict (key) do update set value = excluded.value;

-- ── 2. O nama — uvodni tekst sa starog sajta ─────────────────────────────────
insert into site_content (key, value) values
  ('about_intro', json_build_object('text',
    E'Protein House d.o.o. je firma aktivna od 2018. godine na polju distribucije i prodaje suplementacije, prehrane i opreme — kako za vrhunske sportaše, tako i za rekreativce i sve one s aktivnim načinom života.\n\nUvoznici i distributeri smo vrhunskih svjetskih brendova sportske suplementacije i opreme, kao što su: Optimum Nutrition, Universal Nutrition, Applied Nutrition, BBN Nutrition, Best Body Nutrition, BioTechUSA, Body&Fit, BSN, Cellucor, Dymatize, Gorilla Wear, Mammut, Mars, Maxler, MuscleTech, Mutant, Nutriversum, OstroVit, Pure Gold Protein, Swanson Health…\n\nPoslovna politika našeg društva zasniva se na apsolutnom povjerenju u odnosu na našeg kupca i pružanju podrške i savjeta — kako za suplementaciju i prehranu, tako i za trening za one koji se aktivno bave sportom. Svoje proizvode distribuiramo online i putem vlastitih trgovina specijalizirane robe u većim gradovima širom BiH.'
  )::jsonb)
on conflict (key) do update set value = excluded.value;

-- ── 3. Trgovina (Mepas Mall, Mostar) ─────────────────────────────────────────
insert into stores (city, address, phone, email, working_hours, sort_order, is_active)
select 'Mostar', 'Kardinala Stepinca bb (Mepas Mall), 88 000 Mostar',
       '065/091-094', 'podrska@proteinhouse.ba', 'pon–sub 9:00–21:00', 1, true
where not exists (select 1 from stores where address like '%Mepas Mall%');

-- ── 4. Blog — članci sa starog sajta ─────────────────────────────────────────
insert into blog_posts (title, slug, excerpt, content, author, published, published_at) values
(
  'Efekat proteina na organizam',
  'efekat-proteina-na-organizam',
  'Proteini su u doslovnom smislu gradivni blokovi života — sve stanice, sva tkiva i svi organski sustavi u našem tijelu sadrže proteine.',
  E'Proteini su u doslovnom smislu gradivni blokovi života. Sve stanice, sva tkiva i svi organski sustavi u našemu tijelu sadrže proteine. Kao što znamo, proteini su polimeri (složeni spojevi) koji su sastavljeni od niza aminokiselina. U sastavu proteina nalazimo ukupno 20 aminokiselina. Devet aminokiselina su esencijalne aminokiseline, što znači da ih tijelo nije sposobno samo sintetizirati, nego ih moramo unijeti kroz prehranu.\n\nKvaliteta proteina određuje se pomoću nekoliko pokazatelja, no jedan od najčešćih je biološka vrijednost proteina (BV). BV nam govori koliko učinkovito tijelo može apsorbirati određeni protein, odnosno koji postotak unesenog proteina je tijelo iskoristilo.\n\nKome su potrebni proteini?\n\nProteini doprinose održavanju normalnih kostiju te rastu i održavanju mišićne mase, a prema preporukama nutricionista proteini bi trebali biti zastupljeni u svakom obroku. Uz masti i ugljikohidrate, proteini su makronutrijenti koji su potrebni za optimalno funkcioniranje organizma i potrebni su svim osobama.',
  'Slaven Vico', true, '2024-02-03'
),
(
  'Ashwagandha — kraljica ayurvedske medicine',
  'ashwagandha-kraljica-ayurvedske-medicine',
  'Ashwagandha je jedna od najmoćnijih biljaka za ozdravljenje — najpoznatija po snažnom djelovanju koje pomaže da se um i tijelo bolje prilagode stresu.',
  E'Ashwagandha je tradicionalna ayurvedska biljka, latinskog naziva Withania somnifera, poznata i pod nazivom „Zimska trešnja" ili „Indijski ginseng". Porijeklom je iz Indije, sjeverne Afrike i Bliskog istoka, a danas se uzgaja u raznim zemljama. Jedna je od najvažnijih ayurvedskih biljaka koja ima širok spektar djelovanja.\n\nAshwagandha prah dobiva se iz korijena biljke uzgojene u organskim uvjetima, koji se potom suše i melju do praha fine strukture. Sadrži brojne korisne nutritivne komponente i prirodan je izvor vlakana. U Ayurvedi se koristi od davnina kao tonik za pomlađivanje organizma i afrodizijak.\n\nDanas se često preporučuje za rješavanje neugodnih simptoma stresa — bio on posljedica jače fizičke aktivnosti, stresne situacije ili hormonalne neravnoteže. Oplemenjena je blagim, decentnim osjetom gorčine te ju je iznimno lako uklopiti u svakodnevnu prehranu: prah možete pomiješati s vodom, voćnim sokom, mlijekom, ili dodati u frape i smoothie.\n\nNačin upotrebe: pomiješati 3–6 grama praha (1–2 čajne žličice) s čajem, nekim drugim toplim napitkom ili dodati u smoothie.',
  'Slaven Vico', true, '2024-01-22'
),
(
  'Whey proteini (proteini sirutke)',
  'whey-proteini-proteini-sirutke',
  'Protein sirutke jedan je od najbolje proučenih dodataka prehrani u svijetu — s vrlo visokom nutritivnom vrijednošću i brojnim dokazanim dobrobitima.',
  E'Protein sirutke (whey protein) jedan je od najbolje proučenih dodataka prehrani u svijetu, i to s dobrim razlogom. Ima vrlo visoku nutritivnu vrijednost, a znanstvena istraživanja otkrila su brojne zdravstvene dobrobiti whey proteina, odnosno proteina sirutke.\n\nProteini sirutke sadrže sve potrebne esencijalne aminokiseline i koriste se kao dodatak prehrani, posebno za obnovu mišića i povećanje mišićne mase.\n\nŠto su proteini i koja je njihova uloga?\n\nProteini ili bjelančevine su velika skupina molekula od kojih je sastavljeno svako tkivo u tijelu. Prijeko su potrebni za stvaranje i rast novih stanica te pravilno funkcioniranje organizma svih živih bića. Trebaju nam za čitav niz procesa koji se svakodnevno zbivaju u našem tijelu.',
  'Slaven Vico', true, '2024-03-15'
),
(
  'Whey, izolat ili hidrolizat — kako ne baciti novac na pogrešan protein?',
  'whey-izolat-ili-hidrolizat',
  'Sva tri dolaze iz istog izvora — mlijeka, točnije sirutke koja ostaje pri proizvodnji sira. Ali tu sličnost i prestaje.',
  E'Znaš onaj osjećaj kad uđeš u shop s namjerom da kupiš protein, i onda te dočeka zid kutija i kesa? Whey concentrate, whey isolate, hydrolyzed whey… sve izgleda isto, a cijene se razlikuju i do 50%. Tipična reakcija? „Uzmem što je najjeftinije i nadam se da radi." Poznato, zar ne?\n\nBio sam u toj situaciji bezbroj puta — i kao klijent, i kao trener koji gleda ljude kako godinama forsiraju pogrešan proizvod i onda se čude zašto ne napumpaju mišić kako su zamislili. Nije uvijek stvar treninga. Ponekad je stvar proteina u šejkeru. Hajdemo to raščistiti jednom zauvijek.\n\nŠto je uopće razlika? (nije samo marketing)\n\nSva tri dolaze iz istog izvora — mlijeka, točnije sirutke koja ostaje kao nusprodukt pri proizvodnji sira. Ali tu sličnost i prestaje.\n\nWhey koncentrat je sirova, minimalno obrađena verzija. Sadrži negdje između 70 i 80% proteina, a ostatak su ugljikohidrati (uglavnom laktoza) i masti. Jeftino, pristupačno, i iskreno sasvim dovoljno za većinu ljudi. Apsorpcija je solidna, okus je obično bolji nego kod skupljih verzija jer masti nose aromu. Jedini problem? Ako si osjetljiv na laktozu, može te malo „uzrujati" — da budem kulturan.\n\nWhey izolat prolazi kroz dodatni proces filtracije. Rezultat: 90%+ proteina, minimalno laktoze i masti. Apsorpcija je brža, stomak je sretniji, a makro profil je čišći — što je sjajno ako brojiš svaki gram.\n\nHidrolizat je na vrhu piramide. Proteini su već „prerezani" na manje peptide kroz enzimsku hidrolizu — tijelo ih praktički ne mora razgrađivati, nego ih samo upije. Najbrža apsorpcija, minimalna alergenska reakcija, i da, pogađaš — najviša cijena.\n\nKratko: koncentrat = ekonomičan i učinkovit, izolat = čišći i brži, hidrolizat = F1 bolid proteina.',
  'Slaven Vico', true, '2026-04-03'
)
on conflict (slug) do update set
  title = excluded.title, excerpt = excluded.excerpt, content = excluded.content,
  author = excluded.author, published = excluded.published, published_at = excluded.published_at;
