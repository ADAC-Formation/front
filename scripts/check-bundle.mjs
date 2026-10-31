// Contrôle de build : budget gzip du fichier d'entrée + aucune page dans l'entrée.
// À lancer après `npm run build` (le manifeste est écrit dans dist/.vite/manifest.json).
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import path from 'node:path'
import { checkBundle } from './bundle-budget.js'

const root = path.resolve(import.meta.dirname, '..')
const read = (file) => readFileSync(path.join(root, file))

const manifest = JSON.parse(read('dist/.vite/manifest.json'))
const budget = JSON.parse(read('bundle-budget.json'))

const entry = Object.values(manifest).find((chunk) => chunk.isEntry)
if (!entry) {
  console.error('Aucun fichier d’entrée dans dist/.vite/manifest.json.')
  process.exit(1)
}
const entryGzipBytes = gzipSync(read(path.join('dist', entry.file))).length

// Pages attendues : tous les modules que le routeur importe, en statique ou à la demande.
const routerSource = read('src/router/router.jsx').toString('utf8')
const importPattern = /(?:from\s+|import\(\s*)["'](\.[^"']+)["']/g
const pageSources = [...routerSource.matchAll(importPattern)].map(([, relative]) => {
  const resolved = path.posix.join('src/router', relative)
  return /\.jsx?$/.test(resolved) ? resolved : `${resolved}.jsx`
})

const errors = checkBundle({ manifest, entryGzipBytes, budget, pageSources })

if (errors.length > 0) {
  errors.forEach((message) => console.error(`✗ ${message}`))
  process.exit(1)
}
console.log(`✓ Entrée : ${entryGzipBytes} octets gzip (budget ${budget.entryGzipBytes}), aucune page dans l’entrée.`)
