import { splitBySlot, typesProvidedBy } from '../documentTypes/documentSlots'

// Suivi des documents d'un inscrit, vu par la chargée de formation et le formateur (G34) : seuls comptent
// les fichiers déposés par le stagiaire lui-même (G17), rattachés aux types de la formation par leur nom (G33) ;
// les types fournis par l'ADAC ne comptent pas (G35).
// `received` : types avec au moins un fichier ; `total` : types de la formation ; `sentCount` : fichiers envoyés.
export function inscritDocumentProgress(types, documents, stagiaireId) {
  const stagiaireTypes = typesProvidedBy(types, 'STAGIAIRE')
  const sent = documents.filter((document) => document.uploadedBy?.id === stagiaireId)
  const { slots, others } = splitBySlot(stagiaireTypes, sent)
  return {
    slots,
    others,
    received: slots.filter((slot) => slot.documents.length > 0).length,
    total: stagiaireTypes.length,
    sentCount: sent.length,
  }
}

const sentLabel = (count) => `${count} document${count > 1 ? 's' : ''} envoyé${count > 1 ? 's' : ''}`

// « 8/10 documents reçus » ; sans type (ou types indisponibles), le nombre de fichiers envoyés.
export function progressLabel({ received, total, sentCount }, { typesAvailable = true } = {}) {
  if (!typesAvailable || total === 0) return sentLabel(sentCount)
  return `${received}/${total} documents reçus`
}

export const isComplete = ({ received, total }) => total > 0 && received === total
