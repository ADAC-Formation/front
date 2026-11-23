import { describe, expect, it } from 'vitest'
import {
  DEADLINE_ANCHOR_LABELS,
  FORMATS,
  deadlineLabel,
  formatsLabel,
  providerLabel,
  scopeLabel,
  sortByName,
} from './documentTypeLabels'

const categories = [
  { id: 1, nom: 'Secourisme' },
  { id: 2, nom: 'Numérique' },
]

describe('FORMATS', () => {
  it('liste les six formats du back avec leur libellé', () => {
    expect(FORMATS).toEqual([
      { value: 'pdf', label: 'PDF' },
      { value: 'jpg', label: 'JPG' },
      { value: 'jpeg', label: 'JPEG' },
      { value: 'png', label: 'PNG' },
      { value: 'docx', label: 'DOCX' },
      { value: 'xlsx', label: 'XLSX' },
    ])
  })
})

describe('DEADLINE_ANCHOR_LABELS', () => {
  it('nomme les deux repères', () => {
    expect(DEADLINE_ANCHOR_LABELS).toEqual({
      BEFORE_START: 'Jours avant le début',
      AFTER_END: 'Jours après la fin',
    })
  })
})

describe('scopeLabel', () => {
  it('résume « toutes les formations »', () => {
    expect(scopeLabel({ appliesToAllFormations: true, categories: [] })).toBe('Toutes les formations')
  })

  it('liste les catégories par nom', () => {
    expect(scopeLabel({ appliesToAllFormations: false, categories })).toBe('Secourisme, Numérique')
  })
})

describe('deadlineLabel', () => {
  it.each([
    [{ deadlineDays: 7, deadlineAnchor: 'BEFORE_START' }, '7 jours avant le début'],
    [{ deadlineDays: 15, deadlineAnchor: 'AFTER_END' }, '15 jours après la fin'],
    [{ deadlineDays: 1, deadlineAnchor: 'BEFORE_START' }, '1 jour avant le début'],
    [{ deadlineDays: 0, deadlineAnchor: 'AFTER_END' }, '0 jour après la fin'],
  ])('%j → %s', (type, label) => {
    expect(deadlineLabel(type)).toBe(label)
  })

  it('renvoie null sans délai', () => {
    expect(deadlineLabel({ deadlineDays: null, deadlineAnchor: null })).toBeNull()
  })
})

describe('formatsLabel', () => {
  it('annonce la règle générale sans format choisi', () => {
    expect(formatsLabel([])).toBe('Règle générale')
    expect(formatsLabel(null)).toBe('Règle générale')
  })

  it('liste les formats en majuscules', () => {
    expect(formatsLabel(['pdf', 'png'])).toBe('PDF, PNG')
  })
})

describe('sortByName', () => {
  it('trie sans tenir compte de la casse ni des accents, sans modifier l’entrée', () => {
    const types = [{ nom: 'zèbre' }, { nom: 'Étude' }, { nom: 'Attestation' }, { nom: 'etat' }]
    expect(sortByName(types).map((t) => t.nom)).toEqual(['Attestation', 'etat', 'Étude', 'zèbre'])
    expect(types[0].nom).toBe('zèbre')
  })
})

describe('providerLabel (G35)', () => {
  it('nomme qui fournit le document, le stagiaire par défaut', () => {
    expect(providerLabel({ providedBy: 'ADAC' })).toBe('Fourni par l’ADAC')
    expect(providerLabel({ providedBy: 'STAGIAIRE' })).toBe('Fourni par le stagiaire')
    expect(providerLabel({})).toBe('Fourni par le stagiaire')
  })
})
