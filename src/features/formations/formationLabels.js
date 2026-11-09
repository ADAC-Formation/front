// Libellés et formats partagés par la liste et le détail des formations.

const MODALITE_LABELS = {
  VISIO: 'Distanciel',
  PRESENTIEL: 'Présentiel',
  MIXTE: 'Mixte',
}

export const modaliteLabel = (modalite) => MODALITE_LABELS[modalite] ?? modalite

const dateFormat = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

// « 2026-03-10 » (LocalDate du back) → « 10 mars 2026 », sans décalage de fuseau horaire.
function formatDay(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number)
  return dateFormat.format(new Date(Date.UTC(year, month - 1, day)))
}

export function formatDateRange(dateDebut, dateFin) {
  return dateDebut === dateFin
    ? `le ${formatDay(dateDebut)}`
    : `du ${formatDay(dateDebut)} au ${formatDay(dateFin)}`
}

export const formateurName = (formateur) => `${formateur.prenom} ${formateur.nom}`
