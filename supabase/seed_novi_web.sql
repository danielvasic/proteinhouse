-- Testni proizvodi sa proteinhouse.ba — agregirano po okusu i gramazi
-- PRVO pokrenuti supabase/novi_web.sql!
-- PAZNJA: brise SVE postojece proizvode pa ubacuje ispocetka.

delete from products;

insert into products (brand, title, slug, price, old_price, badge, category, description, usage_instructions, image_url, flavors, sizes, stock, stock_variants, internal_title, erp_sku, tags, is_active, sort_order) values
('Optimum Nutrition', 'Gold Whey', 'optimum-nutrition-gold-whey', 7.5, null, null, 'proteini', 'Optimum Nutrition Gold Whey je vrhunski whey protein dizajniran za sportiste i aktivne osobe koje žele podršku oporavku mišića i povećanju unosa proteina uz odličan ukus i topljivost. Sadrži brzo probavljive proteine za efikasnu opskrbu aminokiselinama nakon treninga ili tokom dana.
Primarna svrha: podrška mišićnom oporavku i održanju mišićne mase.', 'pomiješati mjericu s vodom i konzumirati poslije treninga ili tokom dana.', 'https://weberp-api.com/images/638836867958268752.png', '{"Double Rich Chocolate","Vanilla Ice Cream"}', '["30g"]'::jsonb, 0, '{"Double Rich Chocolate|30g":{"qty":25,"sku":"4472"},"Vanilla Ice Cream|30g":{"qty":25,"sku":"4474"}}'::jsonb, 'ON GOLD WHEY 30 g double rich chocolate', '4472', '{}', true, 1),
('OstroVit', 'Whey', 'ostrovit-whey', 53.1, 59, '-10%', 'proteini', 'Ostrovit Whey je visokokvalitetan whey protein dizajniran za sportiste i aktivne osobe koje žele podršku oporavku mišića i povećanju unosa proteina uz odličnu topljivost i ukus.
Detaljan opis:
 Ovaj whey protein se lako miješa i brzo se apsorbira, dopunjavajući mišiće ključnim aminokiselinama nakon treninga ili kao proteinski obrok tokom dana. Savršen je izbor za sve koji žele povećati dnevni unos proteina i podržati rezultate treninga bez kompromisa u ukusu.
Primarna svrha:
 Namijenjen sportistima i rekreativcima koji ciljaju na podršku oporavku mišića, održanje mišićne mase i ukupan unos proteina.', 'Pomiješati jednu mjericu sa vodom ili mlijekom i konzumirati nakon treninga ili tokom dana kao dodatnu proteinsku podršku.', 'https://weberp-api.com/images/639058863849689278.jpeg', '{"Almond & Coconut"}', '["700g"]'::jsonb, 0, '{"Almond & Coconut|700g":{"qty":25,"sku":"4806"}}'::jsonb, 'OST WHEY 700 g almond & coconut', '4806', '{}', true, 2),
('Mutant', 'Whey', 'mutant-whey', 80.1, 89, '-10%', 'proteini', 'Mutant Whey je visokokvalitetan whey protein dizajniran za sportiste i aktivne osobe koje žele podržati povećanje unosa proteina, oporavak mišića i razvoj mišićne mase uz odličan ukus i topljivost.
Detaljan opis:
 Ovaj whey protein sadrži brzo probavljive izvore proteina koji omogućavaju efikasnu opskrbu mišića aminokiselinama nakon treninga ili kao proteinski napitak tokom dana. Lako se miješa i odlikuje se bogatim, kremastim okusom, što ga čini popularnim izborom među rekreativcima i ozbiljnim vježbačima.
Primarna svrha:
 Namijenjen osobama koje žele povećati dnevni unos proteina, podržati oporavak mišića i održanje mišićne mase.', 'Pomiješati jednu mjericu sa vodom ili mlijekom i konzumirati nakon treninga ili tokom dana kao dodatnu proteinsku podršku.', 'https://weberp-api.com/images/639052231156323506.jpeg', '{"Triple Choco","Vanilla Ice"}', '["908g"]'::jsonb, 0, '{"Triple Choco|908g":{"qty":25,"sku":"4185"},"Vanilla Ice|908g":{"qty":25,"sku":"4000"}}'::jsonb, 'MUTANT WHEY 908 g triple choco', '4185', '{}', true, 3),
('BSN', 'Syntha-6', 'bsn-syntha-6', 152.1, 169, '-10%', 'proteini', 'BSN SYNTHA-6 je premium proteinska mješavina višestrukih izvora proteina dizajnirana za podršku mišićnom oporavku, rastu i svakodnevnom unosu proteina uz izvanredan ukus i kremastu teksturu.
Detaljan opis:
 Ovaj protein sadrži kombinaciju brzo i sporije probavljivih proteina koji osiguravaju produženo oslobađanje aminokiselina, što je idealno nakon treninga i kroz dan. Lako se miješa i poznat je po bogatom, kremastom okusu, što ga čini jednim od najpopularnijih proteinskih shakeova za sportiste i aktivne osobe.
Primarna svrha:
 Namijenjen sportistima, rekreativcima i svima koji žele podržati oporavak mišića, povećati dnevni unos proteina i unaprijediti rezultate treninga.', 'Pomiješati jednu mjericu sa vodom ili mlijekom i konzumirati nakon treninga ili tokom dana kao dodatak proteinskom unosu.', 'https://weberp-api.com/images/638464738746068747.jpeg', '{"Chocolade Mudslide"}', '["2270g"]'::jsonb, 0, '{"Chocolade Mudslide|2270g":{"qty":25,"sku":"1325"}}'::jsonb, 'BSN SYNTHA-6 2270 g chocolade mudslide', '1325', '{}', true, 4),
('Optimum Nutrition', 'Creatine Monohydrate', 'optimum-nutrition-creatine-monohydrate', 35.1, 39, '-10%', 'kreatini', 'Optimum Nutrition Creatine Monohydrate je čist i visokokvalitetan kreatin monohidrat dodatak prehrani, formuliran za sportiste i aktivne osobe koje žele podršku snazi, eksplozivnoj energiji i performansama tokom treninga.
Ovaj kreatin koristi najistraženiju formu kreatina monohidrata koja pomaže povećati zalihe kreatin-fosfata u mišićima, podržavajući veću snagu, intenzitet ponavljanja i učinkovitost tokom vježbanja. Neutralnog je okusa i lako se miješa, pa je praktičan dodatak tvojoj dnevnoj suplementaciji.
Primarna svrha:
 Namijenjen sportistima i rekreativcima koji žele poboljšati snagu, eksplozivnu energiju i ukupnu učinkovitost treninga.', 'Pomiješati preporučenu dozu s vodom ili napitkom po izboru i konzumirati prije ili nakon treninga radi dopune kreatina u mišićima i podrške intenzivnijim treninzima.', 'https://weberp-api.com/images/639069231415591186.jpeg', '{"Fruit Punch"}', '["187g", "247,50g"]'::jsonb, 0, '{"Fruit Punch|187g":{"qty":25,"sku":"4710"},"Fruit Punch|247,50g":{"qty":25,"sku":"4710"}}'::jsonb, 'ON CREATINE MONOHYDRATE 187 g', '4662', '{}', true, 5),
('OstroVit', 'Creatine Monohydrate', 'ostrovit-creatine-monohydrate', 39.2, 49, '-20%', 'kreatini', 'OstroVit Creatine Monohydrate je čist i efektan kreatin monohidrat dodatak prehrani dizajniran za sportiste i aktivne osobe koji žele podršku snazi, eksplozivnoj energiji i performansama tokom treninga.
Ovaj kreatin monohidrat koristi najistraženiju formu kreatina koja pomaže povećati zalihe kreatin-fosfata u mišićima, podržavajući veću snagu, intenzitet i kapacitet ponavljanja vježbi. Neutralnog je okusa, lako se miješa i jednostavan je za uključivanje u dnevnu suplementaciju.
Primarna svrha:
 Namijenjen sportistima i rekreativcima koji žele poboljšati snagu, performanse i efikasnost treninga.', 'Pomiješati preporučenu dozu s vodom ili napitkom po izboru i konzumirati prije ili nakon treninga radi podrške energetskim zalihama i intenzivnijem treningu.', 'https://weberp-api.com/images/638465266124597595.jpeg', '{"Orange"}', '["300g"]'::jsonb, 0, '{"Orange|300g":{"qty":25,"sku":"1713"}}'::jsonb, 'OST CREATINE MONOHYDRATE 300 g orange', '1713', '{}', true, 6),
('Optimum Nutrition', 'Serious Mass', 'optimum-nutrition-serious-mass', 116.1, 129, '-10%', 'gaineri', 'Optimum Nutrition Serious Mass - Gainer za ozbiljnu mišićnu masu

Opis: Želite veću masu i snagu? Optimum Nutrition Serious Mass sadrži 1250 kcal, 50g proteina, preko 250g ugljikohidrata, vitamine, minerale, kreatin i glutamin za maksimalne rezultate.

Prednosti:

Visokokalorični gainer (1250 kcal/serviranje)
50g kvalitetnih proteina za rast mišića
Preko 250g kompleksnih ugljikohidrata za energiju
Obogaćen vitaminima i mineralima (25+)
Sadrži kreatin i glutamin za oporavak', 'Između obroka (1/2-1 serviranje), nakon treninga (1/2-1 serviranje 30-45 min poslije), prije spavanja (1/2-1 serviranje 45-60 min prije). Miješati s vodom ili mlijekom. Za najbolje rezultate kombinirati s treningom i prehranom.', 'https://weberp-api.com/images/638827522928484669.png', '{"Banana","Vanilla"}', '["2730g"]'::jsonb, 0, '{"Banana|2730g":{"qty":25,"sku":"4272"},"Vanilla|2730g":{"qty":25,"sku":"4004"}}'::jsonb, 'ON SERIOUS MASS 2730 g banana', '4272', '{}', true, 7),
('OstroVit', 'Dextrose 500g', 'ostrovit-dextrose', 6.3, 7, '-10%', 'gaineri', 'OSTROVIT Dextrose je brz izvor glukoze za trenutnu energiju i efikasan oporavak.
• Brza apsorpcija za energiju tokom i nakon treninga
 • Podržava obnovu glikogena i mišićni oporavak
 • Neutralan ukus, savršena za kombinaciju sa suplementima', 'Pomiješaj 20–40 g s vodom, tokom ili poslije treninga', 'https://weberp-api.com/images/638469675425695324.png', '{}', '[]'::jsonb, 25, '{}'::jsonb, 'OST DEXTROSE 500 g', '2089', '{}', true, 8),
('Mutant', 'Madness', 'mutant-madness', 62.1, 69, '-10%', 'pre-workout', 'Mutant Madness je visoko koncentriran pre-workout za pojačanje energije i performansi. Sadrži mikronizirani kreatin monohidrat, beta-alanin, arginin, citrulin i kofeinski kompleks koji smanjuju umor i potiču izdržljivost. Sa 1500 mg kreatina i 500 mg kofeina po dozi, uz dodatke niacina, vitamina B12 i magnezija, idealan je za intenzivne treninge i povećava fizičku učinkovitost', null, 'https://weberp-api.com/images/638878344050763532.png', '{"Orange Rush"}', '["30 serv"]'::jsonb, 0, '{"Orange Rush|30 serv":{"qty":25,"sku":"4642"}}'::jsonb, 'MUTANT MADNESS 30 serv orange rush', '4642', '{}', true, 9),
('BSN', 'NO Xplode', 'bsn-no-xplode', 67.5, 75, '-10%', 'pre-workout', 'BSN NO-Xplode – 30 porcija: Dodatak Pre Treninga sa Kofeinom, Citrulinom i Aminokiselinama

BSN NO-Xplode je dodatak prehrani namijenjen konzumiranju prije treninga, koji je pažljivo revidiran kako bi odgovarao potrebama rekreativaca i profesionalnih sportista. Sadrži odabrane sastojke koji su često korišteni prije treninga, uključujući razne aminokiseline, beta-alanin, L-citrulin, visokokvalitetne minerale i kofein.

Ključne Karakteristike:

Kvalitetni Sastojci: BSN NO-Xplode se ističe po visokokvalitetnim sastojcima kao što su citrulin, beta-alanin, kofein i minerali poput cinka.

Poboljšana Formula: Nova verzija NO-Xplode-a donosi unaprijeđenu formulu koja je rezultat dugogodišnjeg iskustva kompanije BSN.

Podrška Prije Treninga: Ovaj dodatak prehrani pruža podršku tijelu prije treninga, pomažući u sintezi proteina, sprječavajući katabolizam mišića, osiguravajući nadopunu zaliha glikogena i ubrzavajući regeneraciju nakon treninga.

Višestruke Funkcije: N.O.-EXPLODE ima mnoge pozitiv', null, 'https://weberp-api.com/images/638464631980222349.png', '{"Green Burst","Red Rush"}', '["390g", "650g"]'::jsonb, 0, '{"Green Burst|390g":{"qty":25,"sku":"1091"},"Green Burst|650g":{"qty":25,"sku":"1091"},"Red Rush|390g":{"qty":25,"sku":"1092"},"Red Rush|650g":{"qty":25,"sku":"1092"}}'::jsonb, 'BSN NO XPLODE 390 g green burst', '1091', '{}', true, 10),
('Optimum Nutrition', 'Amino Energy', 'optimum-nutrition-amino-energy', 58.5, 65, '-10%', 'aminokiseline', 'Optimum Nutrition Amino Energy je energizirajuća aminokiselinska formula za fokus, snagu i oporavak.
• Sadrži BCAA + EAAs za podršku sintezi proteina
 • Kofein za energiju i mentalnu oštrinu prije treninga
 • Lako se miješa, osvježavajući okus', 'Pomiješaj 1 mjericu s vodom 20–30 min prije treninga ili tokom dana.', 'https://weberp-api.com/images/638655486723813433.png', '{"Fruit","Orange"}', '["270g"]'::jsonb, 0, '{"Fruit|270g":{"qty":25,"sku":"4364"},"Orange|270g":{"qty":25,"sku":"4365"}}'::jsonb, 'ON AMINO ENERGY 270 g fruit', '4364', '{}', true, 11),
('OstroVit', 'BCAA 8:1:1', 'ostrovit-bcaa-8-1-1', 23.4, 26, '-10%', 'aminokiseline', 'OSTROVIT BCAA 8:1:1 Lemon je premium BCAA formula s intenzivnim limun ukusom za podršku oporavku i izdržljivosti.
• Povećan omjer leucina (8:1:1) za snažniju sintezu proteina
 • Pomaže smanjiti umor i zaštititi mišiće
 • Osvježavajući lemon okus, lako se miješa', 'Pomiješaj 1 mjericu s vodom i koristi prije, tokom ili poslije treninga.', 'https://weberp-api.com/images/638465261949909122.jpeg', '{"Lemon"}', '["200g"]'::jsonb, 0, '{"Lemon|200g":{"qty":25,"sku":"1709"}}'::jsonb, 'OST BCAA 8:1:1 200 g lemon', '1709', '{}', true, 12),
('Optimum Nutrition', 'Optimen 90 tabs', 'optimum-nutrition-optimen', 49.5, 55, '-10%', 'vitamini', 'Optimum Nutrition Opti-Men je napredni multivitaminski kompleks za muškarce koji žele energiju, oporavak i svakodnevnu podršku organizmu.
• Više od 75 aktivnih sastojaka za energiju, imunitet i vitalnost
 • Vitamini, minerali i biljni ekstrakti za aktivan stil života
 • Podržava oporavak, fokus i ukupne performanse', 'Uzmi 3 tablete dnevno uz obroke i vodu.', 'https://weberp-api.com/images/638746070914734460.jpeg', '{}', '[]'::jsonb, 25, '{}'::jsonb, 'ON OPTIMEN 90 tabs', '4475', '{}', true, 13),
('Optimum Nutrition', 'Optiwomen 60 caps', 'optimum-nutrition-optiwomen', 41.5, 45, '-8%', 'vitamini', 'Optimum Nutrition Opti-Women je premium multivitaminski kompleks dizajniran za aktivne žene i svakodnevnu podršku zdravlju.
• 23 vitamina i minerala za energiju, imunitet i vitalnost 
 • Biljni ekstrakti i antioksidansi za oporavak i opštu dobrobit 
 • Formula prilagođena aktivnom načinu života i treningu', 'Uzmi 2 kapsule dnevno uz obrok i čašu vode.', 'https://weberp-api.com/images/638851699504798472.png', '{}', '[]'::jsonb, 25, '{}'::jsonb, 'ON OPTIWOMEN 60  caps', '4512', '{}', true, 14),
('OstroVit', 'Tyrosine Orange 210g', 'ostrovit-tyrosine-orange', 22.5, 25, '-10%', 'vitamini', 'OstroVit Supreme Pure Tyrosine: Podrška za Mentalni Fokus
OstroVit Supreme Pure Tyrosine je napredni dodatak prehrani s L-tirozinom, dizajniran za poboljšanje mentalnih sposobnosti, posebno u stresnim situacijama. Zahvaljujući naprednoj mikronizaciji, osigurana je iznimna iskoristivost.
Što je Tirozin i Njegovo Djelovanje?
Tirozin je aminokiselina ključna za proizvodnju važnih supstanci u mozgu:
• Dopamin: Regulira centre za zadovoljstvo, utječe na pamćenje i motoričke sposobnosti.
• Adrenalin i noradrenalin: Hormoni stresa koji pripremaju tijelo za reakciju.
• Tiroidni hormoni: Reguliraju metabolizam.
• Melanin: Pigment kože, kose i očiju.
Tirozin je često prisutan u pre-workout dodacima zbog svog djelovanja na fokus i budnost.
Prednosti Tirozina:
• Poboljšava mentalne sposobnosti u stresnim situacijama: Pomaže u održavanju koncentracije, pamćenja i pažnje unatoč stresu.
• Poboljšava radnu memoriju: Značajno poboljšava radnu memoriju kod mentalno zahtjevnih zadataka.
• Poboljšava kvalitetu sna: Doprinosi boljem snu.
Preporučena', 'Pomiješajte 1,5 g (1/2 čajne žličice) u 100-150 ml vode ili soka.
• U danima treninga: Jedna porcija 30 minuta prije treninga.
• Za mentalne sposobnosti u stresnim situacijama: Preporučena doza je 100-150 mg po kilogramu tjelesne mase (npr., 7-10 g za osobu od 68 kg). Veće doze podijelite.
Pakovanje: 210g.
Važna Napomena:
Ne prekoračujte preporučenu dnevnu dozu. Dodatak prehrani nije zamjena za raznoliku prehranu. Preporučuje se uravnotežena prehrana i zdrav način života. N', 'https://weberp-api.com/images/638465259948844953.jpeg', '{}', '[]'::jsonb, 25, '{}'::jsonb, 'OST TYROSINE ORANGE 210 g', '1704', '{}', true, 15),
('Body&Fit', 'Clean Protein Bar', 'body-fit-clean-protein-bar', 5.3, 5.9, '-10%', 'hrana', 'Body&Fit Clean Protein Bar je savršen izbor za sportiste i sve koji vode računa o ishrani. Ova pločica sadrži samo čiste proteine i vlakna, uz izuzetno nizak udio ugljikohidrata i samo 179 kcal.
Napravljena je od hladno-presovanih proteina mlijeka (kazein i izolat proteina sirutke) i prebiotičkih vlakana, bez čokoladnog premaza ili nepotrebnih dodataka. Clean Protein Bar je skoro potpuno bez ugljikohidrata i masti, što je čini zaista "čistom proteinskom pločicom".
Visokoproteinska je, s niskim sadržajem ugljikohidrata, iznimno hranjiva i fantastičnog okusa. Idealna je za konzumaciju u bilo kojem trenutku kada vam je potreban brz unos proteina i vlakana. Proteini potiču rast mišićne mase, a ova pločica sadrži najčišće i najučinkovitije proteine. Zaslađena je stevijom, bez vještačkih zaslađivača.', null, 'https://weberp-api.com/images/638887991518192289.png', '{"Blueberry","Chocolate Cookie"}', '["60g"]'::jsonb, 0, '{"Blueberry|60g":{"qty":25,"sku":"4647"},"Chocolate Cookie|60g":{"qty":25,"sku":"4649"}}'::jsonb, 'BF CLEAN PROTEIN BAR 60 g blueberry', '4647', '{}', true, 16),
('OstroVit', 'CLA + Green Tea + L-CARNITINE 90 tabs', 'ostrovit-cla-green-tea-l-carnitine', 26.1, 29, '-10%', 'mrsavljenje', 'OSTROVIT CLA + GREEN TEA + L-CARNITINE je dodatak prehrani namijenjen osobama koje žele podršku pri redukciji masnog tkiva i kontroli tjelesne težine. Svaka kapsula sadrži kombinaciju CLA, ekstrakta zelenog čaja i L-karnitina, sastojaka koji se često koriste u programima mršavljenja i definicije tijela. 
Ključne prednosti:
• Podrška sagorijevanju masti i kontroli tjelesne težine
• Povećanje energije tokom treninga
• Pogodan za fazu definicije i dijete
• Jednostavna', 'u kapsulama
Upotreba:
 Uzeti 1 kapsulu dnevno, po mogućnosti prije treninga ili prema potrebi u toku dana.', 'https://weberp-api.com/images/639100665137838316.jpeg', '{}', '[]'::jsonb, 25, '{}'::jsonb, 'OST CLA + GREEN TEA + L-CARNITINE 90 tabs', '1726', '{}', true, 17),
('OstroVit', 'Fat Burner For Women 60 caps', 'ostrovit-fat-burner-for-women', 43.2, 48, '-10%', 'mrsavljenje', 'OstroVit Fat Burner za žene je dodatak prehrani u 60 kapsula (30 porcija) namijenjen ženama za smanjenje viška tjelesne masti. Sadrži L-karnitin, ekstrakt zelenog čaja za podršku mršavljenju, L-tirozin za bolju podnošljivost dijeta i kofein za energiju i ubrzan metabolizam. Afrički mango pomaže u regulaciji apetita, zelena kafa ubrzava metabolizam, đumbir podržava probavu, a krom regulira glukozu. Bez piperina i kapsaicina, ovaj sagorjevač stimulira metabolizam i pomaže u kontroli žudnje.', null, 'https://weberp-api.com/images/638465293921197300.png', '{}', '[]'::jsonb, 25, '{}'::jsonb, 'OST FAT BURNER FOR WOMEN 60 caps', '1734', '{}', true, 18);
