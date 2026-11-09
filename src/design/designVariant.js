// Design alternatif activable par l'adresse (?design=site), pour comparer avec celui du site de l'ADAC
// pendant une réunion. Le choix tient le temps de l'onglet (sessionStorage : aucune donnée personnelle,
// D31) ; ?design=default revient au design du portail. Sans paramètre, rien ne change.

const STORAGE_KEY = 'design-variant'
const CLASS_NAME = 'design-site'
const VARIANTS = ['site', 'default']

function readStored() {
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function store(variant) {
  try {
    sessionStorage.setItem(STORAGE_KEY, variant)
  } catch {
    // stockage indisponible : le choix ne survit pas à la navigation, sans conséquence
  }
}

// Renvoie la variante appliquée : 'site' ou 'default'. La feuille de style (et ses polices) n'est
// chargée que pour 'site'.
export async function applyDesignVariant(search = window.location.search) {
  const requested = new URLSearchParams(search).get('design')
  if (VARIANTS.includes(requested)) store(requested)
  const variant = VARIANTS.includes(requested) ? requested : readStored()

  const root = document.documentElement
  if (variant !== 'site') {
    root.classList.remove(CLASS_NAME)
    return 'default'
  }
  root.classList.add(CLASS_NAME)
  await import('./design-site.css')
  return 'site'
}
