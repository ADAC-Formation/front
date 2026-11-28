// NOTES-34 (A1–A5) : contrastes WCAG 2.2 AA calculés depuis les jetons de src/index.css, pour chaque thème.
// Texte ≥ 4.5:1 ; bord des champs et anneau de focus ≥ 3:1 (WCAG 1.4.11). Les jetons en oklch sont convertis
// en sRGB comme le fait le navigateur ; un jeton à transparence est composé sur le fond testé.
import { describe, expect, it } from 'vitest'
import { cssSheets, rulesOf, stripComments } from './css-sheets'

const indexRules = rulesOf(stripComments(cssSheets['src/index.css']))
const tokensOf = (match) => {
  const rule = indexRules.find((r) => match(r.selector.trim()) && r.body.includes('--'))
  if (!rule) throw new Error('règle introuvable')
  return Object.fromEntries([...rule.body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()]))
}

const ROOT = tokensOf((s) => s === ':root')
const DARK = tokensOf((s) => s === '.dark')
const LIGHT_BACKGROUND = tokensOf((s) => s.includes('html.dark.light-background'))
const HIGH_CONTRAST = tokensOf((s) => s === 'html.high-contrast')
const DARK_HIGH_CONTRAST = tokensOf((s) => s === 'html.dark.high-contrast')

const THEMES = {
  clair: { ...ROOT },
  sombre: { ...ROOT, ...DARK },
  'clair, fond clair': { ...ROOT, ...LIGHT_BACKGROUND },
  'sombre, fond clair': { ...ROOT, ...DARK, ...LIGHT_BACKGROUND },
  'contraste élevé': { ...ROOT, ...HIGH_CONTRAST },
  'sombre, contraste élevé': { ...ROOT, ...DARK, ...DARK_HIGH_CONTRAST },
}

// --- Couleurs : #rrggbb ou oklch(L C H [/ a]) → { rgb: [0-255 ×3], alpha } ---
const gamma = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055)
function oklchToRgb(L, C, H) {
  const a = C * Math.cos((H * Math.PI) / 180)
  const b = C * Math.sin((H * Math.PI) / 180)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((v) => Math.round(Math.min(1, Math.max(0, gamma(v))) * 255))
}
function parseColor(value, tokens, depth = 0) {
  if (depth > 8) throw new Error(`référence circulaire : ${value}`)
  const ref = value.match(/^var\((--[\w-]+)\)$/)
  if (ref) return parseColor(tokens[ref[1]], tokens, depth + 1)
  const hex = value.match(/^#([0-9a-fA-F]{6})$/)
  if (hex) return { rgb: [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16)), alpha: 1 }
  const ok = value.match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)(%?))?\s*\)$/)
  if (ok) {
    const alpha = ok[4] === undefined ? 1 : Number(ok[4]) / (ok[5] ? 100 : 1)
    return { rgb: oklchToRgb(Number(ok[1]), Number(ok[2]), Number(ok[3])), alpha }
  }
  throw new Error(`couleur non prise en charge : ${value}`)
}
const over = (front, back) => front.rgb.map((c, i) => Math.round(c * front.alpha + back[i] * (1 - front.alpha)))
const linear = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const luminance = ([r, g, b]) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
function contrast(tokens, fg, bg) {
  const back = parseColor(tokens[bg], tokens).rgb
  const front = over(parseColor(tokens[fg], tokens), back)
  const [hi, lo] = [luminance(front), luminance(back)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const TEXT = [
  ['--foreground', '--background'],
  ['--card-foreground', '--card'],
  ['--muted-foreground', '--background'],
  ['--muted-foreground', '--card'],
  ['--muted-foreground', '--muted'],
  ['--color-on-action', '--color-action'],
  ['--color-status-active', '--card'],
  ['--color-status-active', '--background'],
]
const NON_TEXT = [
  ['--input', '--background'],
  ['--input', '--card'],
  ['--input', '--muted'],
  ['--ring', '--background'],
  ['--ring', '--card'],
]

describe.each(Object.entries(THEMES))('Contrastes du thème « %s »', (_name, tokens) => {
  it.each(TEXT)('texte %s sur %s ≥ 4.5:1', (fg, bg) => {
    expect(contrast(tokens, fg, bg)).toBeGreaterThanOrEqual(4.5)
  })

  it.each(NON_TEXT)('contour %s sur %s ≥ 3:1', (fg, bg) => {
    expect(contrast(tokens, fg, bg)).toBeGreaterThanOrEqual(3)
  })
})

describe('Le texte des boutons d’action reste sombre dans tous les modes (A1)', () => {
  it('--color-on-action vaut --color-on-yellow, constant, jamais --background', () => {
    expect(ROOT['--color-on-action']).toBe('var(--color-on-yellow)')
    expect(DARK['--color-on-action']).toBeUndefined()
  })
})

// A3 : chaque champ de formulaire a son bord en --input (les cartes gardent --border, décoratif).
const FIELDS = [
  ['src/components/atoms/FormInput/FormInput.module.css', '.input'],
  ['src/components/molecules/CheckboxPicker/CheckboxPicker.module.css', '.searchInput'],
  ['src/features/accounts/pages/AccountPages.module.css', '.searchContainer'],
  ['src/features/accounts/pages/AccountPages.module.css', '.sortContainer select'],
  ['src/features/formations/pages/FormationPages.module.css', '.searchContainer'],
  ['src/features/formations/pages/FormationPages.module.css', '.sortContainer select'],
  ['src/features/messagerie/components/GroupFilters.module.css', '.select'],
  ['src/features/messagerie/pages/MessagesPage.module.css', '.searchContainer'],
  ['src/features/messagerie/pages/MessagesPage.module.css', '.sortContainer select'],
  ['src/features/notifications/pages/NotificationsPage.module.css', '.sort select'],
]
describe('Bord des champs de formulaire (A3, WCAG 1.4.11)', () => {
  it.each(FIELDS)('%s %s : bord en var(--input)', (file, selector) => {
    const rule = rulesOf(stripComments(cssSheets[file])).find((r) => r.selector.trim() === selector)
    expect(rule, `${selector} dans ${file}`).toBeDefined()
    expect(rule.body).toMatch(/border\s*:[^;]*var\(--input\)/)
    expect(rule.body).not.toMatch(/border\s*:[^;]*var\(--border\)/)
  })
})

describe('Statut « Actif » (A4)', () => {
  it('a sa propre couleur de texte, par thème', () => {
    const active = rulesOf(stripComments(cssSheets['src/features/accounts/components/AccountRow.module.css'])).find(
      (r) => r.selector.trim() === '.active',
    )
    expect(active.body).toMatch(/color\s*:\s*var\(--color-status-active\)/)
  })
})

describe('Liens sans style propre (A5)', () => {
  it('prennent la couleur du texte (jamais le bleu du navigateur, illisible en mode sombre)', () => {
    const link = indexRules.find((r) => r.selector.trim() === 'a')
    expect(link?.body).toMatch(/color\s*:\s*inherit/)
  })
})
