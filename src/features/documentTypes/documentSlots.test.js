import { describe, expect, it } from 'vitest'
import { SLOT_SEPARATOR, slotFileName, splitBySlot, typesProvidedBy } from './documentSlots'

const identite = { id: 1, nom: 'Pièce d’identité' }
const cv = { id: 2, nom: 'CV' }
const cvAJour = { id: 3, nom: 'CV à jour' }
const doc = (id, fileName) => ({ id, fileName })

describe('slotFileName', () => {
  it('préfixe le nom du fichier du nom du type', () => {
    expect(slotFileName('Pièce d’identité', 'scan.pdf')).toBe(`Pièce d’identité${SLOT_SEPARATOR}scan.pdf`)
  })

  it('reste sous les 200 caractères du back en raccourcissant le nom d’origine, extension gardée', () => {
    const name = slotFileName('CV', `${'a'.repeat(300)}.pdf`)
    expect(name).toHaveLength(200)
    expect(name.startsWith(`CV${SLOT_SEPARATOR}a`)).toBe(true)
    expect(name.endsWith('.pdf')).toBe(true)
  })

  it('renvoie null quand le nom du type ne laisse aucune place au fichier', () => {
    expect(slotFileName('x'.repeat(199), 'scan.pdf')).toBeNull()
  })
})

describe('splitBySlot', () => {
  it('range chaque document dans le créneau de son type et le reste dans « autres »', () => {
    const documents = [
      doc(10, 'Pièce d’identité - recto.pdf'),
      doc(11, 'Pièce d’identité - verso.pdf'),
      doc(12, 'Programme.pdf'),
    ]
    const { slots, others } = splitBySlot([identite, cv], documents)
    expect(slots.map(({ type, documents: found }) => [type.id, found.map((d) => d.id)])).toEqual([
      [1, [10, 11]],
      [2, []],
    ])
    expect(others.map((d) => d.id)).toEqual([12])
  })

  it('garde l’ordre des types reçus, même sans document', () => {
    const { slots, others } = splitBySlot([cv, identite], [])
    expect(slots.map(({ type }) => type.id)).toEqual([2, 1])
    expect(others).toEqual([])
  })

  it('distingue « CV » de « CV à jour » grâce au séparateur', () => {
    const { slots } = splitBySlot([cv, cvAJour], [doc(20, 'CV - a.pdf'), doc(21, 'CV à jour - b.pdf')])
    expect(slots.map(({ type, documents }) => [type.id, documents.map((d) => d.id)])).toEqual([
      [2, [20]],
      [3, [21]],
    ])
  })

  it('ne confond pas un simple début de nom avec le préfixe d’un créneau', () => {
    const { slots, others } = splitBySlot([cv], [doc(30, 'CVthèque.pdf'), doc(31, 'CV.pdf')])
    expect(slots[0].documents).toEqual([])
    expect(others.map((d) => d.id)).toEqual([30, 31])
  })

  it('la casse compte : « cv - a.pdf » n’est pas dans le créneau « CV »', () => {
    const { others } = splitBySlot([cv], [doc(40, 'cv - a.pdf')])
    expect(others.map((d) => d.id)).toEqual([40])
  })

  it('choisit le type au nom le plus long quand deux préfixes conviennent', () => {
    const court = { id: 4, nom: 'Photo' }
    const long = { id: 5, nom: 'Photo - identité' }
    const { slots } = splitBySlot([court, long], [doc(50, 'Photo - identité - a.png')])
    expect(slots.map(({ type, documents }) => [type.id, documents.length])).toEqual([
      [4, 0],
      [5, 1],
    ])
  })
})

describe('typesProvidedBy (G35)', () => {
  const types = [
    { id: 1, nom: 'Pièce d’identité', providedBy: 'STAGIAIRE' },
    { id: 2, nom: 'Feuille d’émargement', providedBy: 'ADAC' },
    { id: 3, nom: 'CV' }, // type lu avant le champ : pièce du stagiaire
  ]

  it('garde les types du fournisseur demandé, un type sans fournisseur étant au stagiaire', () => {
    expect(typesProvidedBy(types, 'STAGIAIRE').map((type) => type.id)).toEqual([1, 3])
    expect(typesProvidedBy(types, 'ADAC').map((type) => type.id)).toEqual([2])
  })
})
