// Enregistre un fichier reçu en mémoire sous le nom donné : adresse d'objet temporaire, clic sur un
// lien `download`, puis révocation.
export function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const link = window.document.createElement('a')
  link.href = url
  link.download = fileName
  window.document.body.append(link)
  link.click()
  link.remove()
  // Firefox et Safari lancent l'enregistrement après le clic : on ne révoque pas l'adresse tout de suite.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
