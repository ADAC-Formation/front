import { formateurName } from './formationLabels'

// Recherche, filtres « Mes formations » et catégorie (C7) et tri de la liste, côté client (F2, F5) : le back ne
// renvoie que la liste de son périmètre, sans paramètre de recherche.

const normalize = (text) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()

const searchableText = (formation) =>
  normalize([formation.intitule, formateurName(formation.formateur), formation.category.nom].join(' '))

export function filterFormations(formations, { search = '', formateurId = null, categoryId = null } = {}) {
  const term = normalize(search)
  return formations.filter(
    (formation) =>
      (formateurId === null || formation.formateur.id === formateurId) &&
      (categoryId === null || formation.category.id === categoryId) &&
      (term === '' || searchableText(formation).includes(term)),
  )
}

const compareText = (a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' })

const COMPARATORS = {
  date: (a, b) => a.dateDebut.localeCompare(b.dateDebut),
  intitule: (a, b) => compareText(a.intitule, b.intitule),
  formateur: (a, b) =>
    compareText(a.formateur.nom, b.formateur.nom) || compareText(a.formateur.prenom, b.formateur.prenom),
}

export const SORT_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'intitule', label: 'Intitulé A-Z' },
  { value: 'formateur', label: 'Formateur A-Z' },
]

export function sortFormations(formations, sortBy) {
  const compare = COMPARATORS[sortBy] ?? COMPARATORS.date
  return [...formations].sort(compare)
}
