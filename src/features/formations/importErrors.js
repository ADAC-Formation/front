// Le back renvoie toutes les erreurs d'import dans un seul `message` : entrées jointes par « | »,
// chacune de la forme « ligne N, colonne X : texte » (points-pour-charlotte.md Q12, F20).
// Tout ce qui n'a pas cette forme est gardé tel quel : le format peut changer sans casser l'écran.

const SEPARATOR = '|'
const ROW_ERROR = /^ligne (\d+), colonne ([^:]+?) : (.+)$/

export function parseImportErrors(message) {
  const rows = []
  const others = []

  if (typeof message !== 'string') return { rows, others }

  for (const raw of message.split(SEPARATOR)) {
    const entry = raw.trim()
    if (!entry) continue

    const match = ROW_ERROR.exec(entry)
    if (match) {
      rows.push({ line: Number(match[1]), column: match[2], problem: match[3] })
    } else {
      others.push(entry)
    }
  }

  return { rows, others }
}
