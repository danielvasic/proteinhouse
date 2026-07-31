# Brend ikone (Brand Guidelines 2026)

82 ikone izvučene iz brand booka (`ProteinHouse Brand Guidelines [TEMP].pdf`,
stranica "Ikonografija") — svaka kao zaseban SVG, u originalnim brend bojama
(`#0145f2` i `#ff4103`).

Kako su nastale: stranica je konvertovana u SVG (`pdftocairo -svg`), path-ovi su
grupisani po bounding boxu u pojedinačne ikone, koordinate skraćene na dvije
decimale i pomjerene u ishodište, a `rgb(…%)` pretvoren u hex. Prosjek ~5,5 KB
po ikoni.

Ako dizajner pošalje svoje exporte, samo prepiši istoimeni fajl — kod ne treba dirati.

## Format

**SVG, ne PNG** — ostaje oštra na svakoj veličini i na retina ekranima, jedan
fajl umjesto @1x/@2x/@3x varijanti, i višestruko manja od PNG-a.

## Kako se koriste

```jsx
import BrandIcon from '../components/BrandIcon'

<BrandIcon name="korpa" size={22} fallback={<ShoppingCart size={20} />} />
```

`fallback` se prikaže ako fajl ne postoji, pa se ikona može ugraditi i prije nego
što stigne. Ikone se **ne** prebojavaju CSS-om — dvobojne su po dizajnu.

Trenutno u upotrebi: `korpa` (header), `korpa-prazna` i `paket` (korpa),
`paket` i `paket-potvrda` (traka povjerenja na checkoutu), `placanje-potvrda`
(stranica proizvoda), `popust` (polje za kupon), `telefon` / `email` /
`lokacija` / `sat` (kontakt), plus set u brzim kategorijama.

**Male veličine:** neke ikone iz brand booka su gusto crtane i na 16–20px se
sliju u mrlju — najgore `energija`, `analiza-uzorka`, `laboratorija`,
`karton-pacijenta`, `molekula-vitamin`. Za chipove i trake koristi jednostavnije
(`mjerica`, `energija-ciklus`, `protein`, `bicep`, `vaga`, `paket`, `korpa`), a
guste ostavi za veće formate (32px pa naviše).

## Spisak

**Suplementi i vitamini** — `suplement-srce`, `suplement-imunitet`,
`suplement-energija`, `tablete-energija`, `vitamini-voce`, `vitamini-jabuka`,
`vitamin-c`, `sirup`, `prah-vrecica`, `kapsule`, `doziranje`, `tekuci-dodatak`,
`vrijeme-uzimanja`

**Zdravlje i tijelo** — `probiotik`, `crijevna-flora`, `probava`,
`zeludac-lijek`, `zeludac-tablete`, `metabolizam`, `krv-zeljezo`, `fokus`,
`oporavak`, `energija`, `energija-ciklus`, `bicep`, `misici-snaga`,
`kosti-zastita`, `kosti-oporavak`, `zglobovi-zastita`, `kalcij-kosti`,
`kalcij-element`, `minerali`, `molekula`, `molekula-vitamin`, `baterija`

**Sport i prehrana** — `protein`, `sejker`, `sejker-obrok`, `obrok-shake`,
`mjerica`, `blender`, `bidon`, `boca-energija`, `omega-3`, `riblje-ulje`,
`riba`, `vaga`, `vaga-analiza`, `vaga-tjelesna`

**Medicina i lab** — `recept`, `karton-pacijenta`, `laboratorija`,
`analiza-uzorka`

**Prodaja** — `korpa`, `korpa-prazna`, `korpa-puna`, `kolica`, `kolica-mreza`,
`akcija`, `popust`, `cijena`, `sale`, `sale-oznaka`, `etiketa`

**Dostava i plaćanje** — `paket`, `paket-potvrda`, `kartica`, `kartice`,
`placanje-potvrda`, `novcanik`, `novcanik-otvoren`, `novcanik-kartice`, `dolar`,
`dolar-obris`

**Kontakt** — `korisnici`, `telefon`, `mobitel`, `email`, `posta`, `lokacija`,
`lokacija-pin`, `sat`

Pregled svih na `/brand-preview.html`.
