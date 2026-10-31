// Logique pure du contrôle de taille : manifeste Vite + taille mesurée + budget → liste d'erreurs.
// Le script `check-bundle.mjs` ne fait que lire les fichiers et appeler cette fonction.

const PAGE_PATTERN = /^src\/(components\/Pages\/|features\/[^/]+\/pages\/).+\.jsx?$/
const TEST_PATTERN = /\.test\.jsx?$/

export const isPageSource = (source) => PAGE_PATTERN.test(source) && !TEST_PATTERN.test(source)

const findEntry = (manifest) => Object.values(manifest).find((chunk) => chunk.isEntry)

// Fichiers JS chargés dès le démarrage : l'entrée et tout ce qu'elle importe statiquement.
function startupFiles(manifest, entry) {
  const files = new Set()
  const visit = (chunk) => {
    if (!chunk || files.has(chunk.file)) return
    files.add(chunk.file)
    ;(chunk.imports ?? []).forEach((key) => visit(manifest[key]))
  }
  visit(entry)
  return files
}

export function checkBundle({ manifest, entryGzipBytes, budget, pageSources }) {
  const errors = []
  const entry = findEntry(manifest)
  if (!entry) return ['Aucun fichier d’entrée dans le manifeste (isEntry).']

  if (entryGzipBytes > budget.entryGzipBytes) {
    errors.push(
      `Fichier d’entrée trop lourd : ${entryGzipBytes} octets gzip pour un budget de ${budget.entryGzipBytes}.`,
    )
  }

  const atStartup = startupFiles(manifest, entry)
  const knownPages = pageSources ?? Object.values(manifest).map((chunk) => chunk.src).filter(Boolean)
  const bySource = new Map(Object.values(manifest).filter((c) => c.src).map((c) => [c.src, c]))

  for (const source of knownPages.filter(isPageSource)) {
    const chunk = bySource.get(source)
    // Absente du manifeste : son code est regroupé dans un autre fichier (l'entrée), pas dans le sien.
    if (!chunk || atStartup.has(chunk.file)) {
      errors.push(`Page chargée dans le fichier d’entrée au lieu d’être à la demande : ${source}`)
    }
  }
  return errors
}
