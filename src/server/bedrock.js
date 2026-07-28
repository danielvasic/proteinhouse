/**
 * AI generator opisa proizvoda — poziva Claude (Sonnet) preko AWS Bedrocka.
 *
 * Zajednička logika za lokalni Express dev server (server.js) i Netlify
 * funkciju (netlify/functions/generate-description.mjs) — jedno mjesto,
 * dva ulaza.
 *
 * VAŽNO — zašto posebni env nazivi (BEDROCK_AWS_*, ne AWS_*):
 * Netlify funkcije (i AWS Lambda generalno) automatski postavljaju
 * AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_REGION za SVOJ izvršni
 * kontekst — to su privremeni kredencijali same Lambda funkcije, bez
 * Bedrock pristupa. Ako bismo se oslonili na te iste nazive, dobili bismo
 * zbunjujuć AccessDenied umjesto jasne greške. Zato IAM korisnik za Bedrock
 * ide pod zasebnim imenima.
 *
 * Potrebne env varijable (.env.local lokalno, Netlify → Site config → Env vars u produkciji):
 *   BEDROCK_AWS_ACCESS_KEY_ID
 *   BEDROCK_AWS_SECRET_ACCESS_KEY
 *   BEDROCK_AWS_REGION       (npr. eu-central-1 — mora imati Bedrock + model access)
 *   BEDROCK_MODEL_ID         (opciono — vidi DEFAULT_MODEL_ID ispod)
 *
 * IAM korisnik treba samo dozvolu: bedrock:InvokeModel na odabrani model ARN.
 * Model mora biti uključen u AWS Bedrock Console → Model access za taj region
 * PRIJE prvog poziva, inače Bedrock vraća AccessDeniedException.
 */

import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime'

// Bedrock cesto zahtijeva "cross-region inference profile" ID (prefiks us./eu.)
// umjesto golog model ID-a za on-demand pristup Sonnetu. Provjeriti tačan
// string u Bedrock Console → Model catalog → (odabrani model) → Inference profile ID.
const DEFAULT_MODEL_ID = 'us.anthropic.claude-sonnet-4-20250514-v1:0'

const FIELD_LABELS = {
  description:        'Opis',
  usage_instructions:  'Način upotrebe',
  composition:         'Sastav',
  nutrition_info:      'Nutritivne vrijednosti',
}
const ALL_FIELDS = Object.keys(FIELD_LABELS)

function client() {
  const accessKeyId     = process.env.BEDROCK_AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.BEDROCK_AWS_SECRET_ACCESS_KEY
  const region          = process.env.BEDROCK_AWS_REGION
  if (!accessKeyId || !secretAccessKey || !region) {
    throw Object.assign(new Error(
      'AI generator nije podešen — nedostaju BEDROCK_AWS_ACCESS_KEY_ID / BEDROCK_AWS_SECRET_ACCESS_KEY / BEDROCK_AWS_REGION.'
    ), { code: 'NOT_CONFIGURED' })
  }
  return new BedrockRuntimeClient({ region, credentials: { accessKeyId, secretAccessKey } })
}

function buildPrompt({ brand, title, category, existing, fields }) {
  const wanted = fields
  const schema = wanted.map((k) => `"${k}"`).join(', ')

  const contextLines = ALL_FIELDS
    .filter((k) => existing?.[k]?.trim() && !wanted.includes(k))
    .map((k) => `${FIELD_LABELS[k]} (već postoji, koristi kao kontekst — ne mijenjaj): ${existing[k].trim()}`)

  return [
    `Proizvod: ${brand} ${title}`.trim(),
    category ? `Kategorija: ${category}` : null,
    ...contextLines,
    '',
    `Napiši sljedeće tekstove za ovaj proizvod, na bosanskom jeziku, u informativnom i profesionalnom tonu kakav koriste sportski suplement shopovi (npr. OstroVit): ${wanted.map((k) => FIELD_LABELS[k]).join(', ')}.`,
    '',
    '- "description": 2–4 rečenice — šta je proizvod, za koga je, glavna korist. Bez marketinških superlativa bez pokrića.',
    '- "usage_instructions": kratko, imperativ (npr. "Pomiješajte 1 mjericu (30g) s 250ml vode i konzumirajte nakon treninga.").',
    '- "composition": realni sastojci tipični za ovu vrstu proizvoda (ne izmišljaj tačne brojeve ako ih ne znaš — piši opisno).',
    '- "nutrition_info": kratak tekstualni pregled nutritivnih vrijednosti po porciji (opisno, ne precizna tablica ako podaci nisu poznati).',
    '',
    `Odgovori ISKLJUČIVO validnim JSON objektom s tačno ovim ključevima: ${schema}. Bez markdown ograda, bez dodatnog teksta prije ili poslije JSON-a.`,
  ].filter(Boolean).join('\n')
}

/**
 * @param {{brand:string, title:string, category?:string, existing?:object, fields?:string[]|null}} input
 *   fields: koja polja generisati (default: sva 4 ako je null/prazno)
 * @returns {Promise<object>} — samo tražena polja, npr. { description: "..." }
 */
export async function generateProductCopy(input) {
  const { brand, title } = input
  if (!brand?.trim() || !title?.trim()) {
    throw Object.assign(new Error('Potreban je brend i naziv proizvoda prije generisanja opisa.'), { code: 'BAD_INPUT' })
  }
  const fields = Array.isArray(input.fields) && input.fields.length ? input.fields : ALL_FIELDS
  const unknown = fields.find((k) => !ALL_FIELDS.includes(k))
  if (unknown) {
    throw Object.assign(new Error(`Nepoznato polje: ${unknown}`), { code: 'BAD_INPUT' })
  }

  const modelId = process.env.BEDROCK_MODEL_ID || DEFAULT_MODEL_ID
  const prompt  = buildPrompt({ ...input, fields })

  const response = await client().send(new ConverseCommand({
    modelId,
    messages: [{ role: 'user', content: [{ text: prompt }] }],
    inferenceConfig: { maxTokens: 1024, temperature: 0.6 },
  }))

  const raw = response.output?.message?.content?.[0]?.text?.trim() || ''
  const jsonText = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')

  let parsed
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw Object.assign(new Error('AI je vratio nevažeći format — pokušajte ponovo.'), { code: 'BAD_RESPONSE' })
  }

  const result = {}
  for (const key of fields) {
    if (typeof parsed[key] === 'string' && parsed[key].trim()) result[key] = parsed[key].trim()
  }
  return result
}
