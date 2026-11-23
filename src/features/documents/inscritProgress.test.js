import { describe, expect, it } from 'vitest'
import { inscritDocumentProgress, progressLabel } from './inscritProgress'

const LEA = 40
const CHARGEE = 1

const type = (id, nom) => ({ id, nom })
const doc = (id, fileName, uploaderId = LEA) => ({ id, fileName, uploadedBy: { id: uploaderId } })

const TEN_TYPES = Array.from({ length: 10 }, (_, index) => type(index + 1, `Type ${String.fromCharCode(65 + index)}`))

describe('inscritDocumentProgress', () => {
  it('compte les types qui ont au moins un fichier du stagiaire', () => {
    const documents = [
      ...TEN_TYPES.slice(0, 8).map((t, index) => doc(index + 1, `${t.nom} - scan.pdf`)),
      doc(99, 'Type A - verso.pdf'),
    ]
    const progress = inscritDocumentProgress(TEN_TYPES, documents, LEA)
    expect(progress.received).toBe(8)
    expect(progress.total).toBe(10)
    expect(progress.sentCount).toBe(9)
  })

  it('ignore les fichiers déposés par quelqu’un d’autre sur l’inscription', () => {
    const documents = [doc(1, 'Type A - scan.pdf', CHARGEE), doc(2, 'Convocation.pdf', CHARGEE)]
    const progress = inscritDocumentProgress(TEN_TYPES, documents, LEA)
    expect(progress.received).toBe(0)
    expect(progress.sentCount).toBe(0)
    expect(progress.others).toEqual([])
    expect(progress.slots.every((slot) => slot.documents.length === 0)).toBe(true)
  })

  it('ne compte pas les types fournis par l’ADAC (G35)', () => {
    const types = [type(1, 'Type A'), { ...type(2, 'Émargement'), providedBy: 'ADAC' }]
    const progress = inscritDocumentProgress(types, [doc(1, 'Type A - x.pdf')], LEA)
    expect(progress.total).toBe(1)
    expect(progress.received).toBe(1)
    expect(progress.slots.map((slot) => slot.type.id)).toEqual([1])
  })

  it('range les fichiers hors créneau dans « autres »', () => {
    const progress = inscritDocumentProgress([type(1, 'Type A')], [doc(1, 'Type A - x.pdf'), doc(2, 'CV.pdf')], LEA)
    expect(progress.slots[0].documents.map((d) => d.id)).toEqual([1])
    expect(progress.others.map((d) => d.id)).toEqual([2])
  })
})

describe('progressLabel', () => {
  it('« X/Y documents reçus » quand la formation a des types', () => {
    expect(progressLabel({ received: 8, total: 10, sentCount: 9 })).toBe('8/10 documents reçus')
  })

  it('« N documents envoyés » sans type, au singulier comme au pluriel', () => {
    expect(progressLabel({ received: 0, total: 0, sentCount: 2 })).toBe('2 documents envoyés')
    expect(progressLabel({ received: 0, total: 0, sentCount: 1 })).toBe('1 document envoyé')
    expect(progressLabel({ received: 0, total: 0, sentCount: 0 })).toBe('0 document envoyé')
  })

  it('compte les fichiers quand les types sont indisponibles', () => {
    expect(progressLabel({ received: 0, total: 0, sentCount: 3 }, { typesAvailable: false })).toBe('3 documents envoyés')
  })
})
