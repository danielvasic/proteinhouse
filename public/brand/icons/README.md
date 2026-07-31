# Brend ikone (Brand Guidelines 2026)

Ovdje idu ikone koje šalje dizajner (Friday 13 Marketing), stranica
"Ikonografija" iz brand booka.

## Format

**SVG, ne PNG.** Razlozi:

- ostaje oštra na svakoj veličini i na retina ekranima
- jedan fajl umjesto @1x/@2x/@3x varijanti
- 2–5 KB po ikoni umjesto 20–60 KB, pa se stranica brže učitava
- ako zatreba, boja se može mijenjati direktno u fajlu

Uz svaku ikonu: `viewBox` postavljen na sadržaj (bez suvišnog praznog prostora),
kvadratni omjer, i boje iz palete (`#0145f2`, `#ff4103`).

## Imenovanje

Mala slova, bez naših slova (č, ć, ž, š, đ), riječi spojene crticom.
Naziv fajla = `name` koji se koristi u kodu:

```
/public/brand/icons/dostava.svg   →   <BrandIcon name="dostava" />
```

Imena koja kod već očekuje:

| fajl | gdje se koristi |
|---|---|
| `dostava.svg` | traka povjerenja na checkoutu i stranici proizvoda |
| `original.svg` | isto — "originalni proizvodi" |
| `korpa.svg` | korpa u headeru |
| `poklon.svg` | izbor gratis poklona |
| `kupon.svg` | polje za kupon na checkoutu |

Ostale ikone iz brand booka (protein, kreatin, vitamini, probiotici, omega-3,
energija, misici, mrsavljenje, imunitet…) mogu se ubaciti istim principom i
vezati na kategorije proizvoda.

## Kako se uključuju

Nikako — same se uključe. `BrandIcon` pokušava učitati fajl; dok ga nema,
prikazuje postojeću ikonu kao rezervu. Čim se SVG ubaci u ovaj folder i
deploy prođe, ikona se zamijeni.
