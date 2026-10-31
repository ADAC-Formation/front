// Accès aux sources des feuilles de style et des composants pour les tests de garde-fou.
// Lecture directe du disque (la config Vitest `css: false` vide les imports CSS, y compris `?raw`).
// Les clés sont des chemins depuis la racine du dépôt (ex. `src/index.css`).
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()

function sourcesWithExtension(dir, extension) {
  const found = {}
  for (const entry of readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const relative = `${dir}/${entry.name}`
    if (entry.isDirectory()) Object.assign(found, sourcesWithExtension(relative, extension))
    else if (entry.name.endsWith(extension)) found[relative] = readFileSync(path.join(ROOT, relative), 'utf8')
  }
  return found
}

export const cssSheets = sourcesWithExtension('src', '.css')
export const jsxSources = sourcesWithExtension('src', '.jsx')

export const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '')

// Règles « sélecteur { corps } » sans imbrication (les blocs @media sont traversés).
export const rulesOf = (css) =>
  [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({ selector, body }))
