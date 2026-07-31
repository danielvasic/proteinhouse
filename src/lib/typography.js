/**
 * Tipografija po Brand Guidelines 2026 (Friday 13 Marketing).
 *
 *   Naslovi — Inter ExtraBold (800) ITALIC, UPPERCASE
 *   Tekst   — Roboto Regular
 *
 * Ranije je ovo bilo raspisano kao inline style na ~80 mjesta ('Exo 2' /
 * 'Inter'); sada je na jednom mjestu da promjena brendinga ne znači ponovni
 * obilazak svakog fajla.
 */

/** Naslovi i istaknuti brend-tekst */
export const DISPLAY = {
  fontFamily: "'Inter', system-ui, sans-serif",
  fontWeight: 800,
  fontStyle: 'italic',
  textTransform: 'uppercase',
  letterSpacing: '-0.01em',
}

/**
 * Brojevi i cijene — Inter, ali BEZ italica i uppercasea.
 * Kosa cijena se teško čita i nije u duhu guidelinesa (naslovi su kosi, podaci nisu).
 */
export const NUMERIC = {
  fontFamily: "'Inter', system-ui, sans-serif",
  fontWeight: 800,
  letterSpacing: '-0.01em',
}

/** Tijelo teksta */
export const BODY = {
  fontFamily: "'Roboto', system-ui, sans-serif",
}
