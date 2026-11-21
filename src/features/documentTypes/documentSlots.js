// Créneaux « Mes documents » du stagiaire : un par type de document à envoyer pour la formation.
// Le back ne relie pas encore un fichier à un type : le front le fait avec le nom du fichier. Un dépôt
// depuis un créneau est envoyé sous « <nom du type> - <nom d'origine> » ; un document appartient au
// créneau dont le nom, suivi du séparateur, commence le sien. Tout le reste va dans « autres ».
// (Tranche suivante : un champ `documentTypeId` sur le dépôt remplacera cette convention.)

export const SLOT_SEPARATOR = ' - '

// Limite du back sur le nom d'un fichier (FileValidator).
const MAX_FILE_NAME_LENGTH = 200

function splitExtension(fileName) {
  const dot = fileName.lastIndexOf('.')
  return dot <= 0 ? { base: fileName, extension: '' } : { base: fileName.slice(0, dot), extension: fileName.slice(dot) }
}

// Nom d'envoi d'un fichier déposé dans le créneau du type, raccourci au besoin (l'extension est gardée) ;
// `null` si le nom du type ne laisse aucune place au fichier.
export function slotFileName(typeName, fileName) {
  const prefix = `${typeName}${SLOT_SEPARATOR}`
  const { base, extension } = splitExtension(fileName)
  const room = MAX_FILE_NAME_LENGTH - prefix.length - extension.length
  if (room < 1) return null
  return `${prefix}${base.slice(0, room)}${extension}`
}

const prefixOf = (type) => `${type.nom}${SLOT_SEPARATOR}`

// `types` dans l'ordre reçu ; chaque document va au type de nom le plus long qui le préfixe.
export function splitBySlot(types, documents) {
  const slots = types.map((type) => ({ type, documents: [] }))
  const others = []
  for (const document of documents) {
    const owner = slots
      .filter(({ type }) => document.fileName.startsWith(prefixOf(type)))
      .reduce((best, slot) => (best && best.type.nom.length >= slot.type.nom.length ? best : slot), null)
    if (owner) owner.documents.push(document)
    else others.push(document)
  }
  return { slots, others }
}
