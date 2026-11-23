import { describe, expect, it } from 'vitest'
import { emptyValues, fromType, toRequest, validateDocumentType } from './documentTypeForm'

const valid = { ...emptyValues(), nom: 'Certificat médical' }

describe('emptyValues', () => {
  it('commence pour toutes les formations, sans délai ni format', () => {
    expect(emptyValues()).toEqual({
      nom: '',
      aide: '',
      isSensitive: false,
      scope: 'all',
      categoryIds: [],
      deadlineAnchor: '',
      deadlineDays: '',
      allowedFormats: [],
      providedBy: 'STAGIAIRE',
    })
  })
})

describe('validateDocumentType', () => {
  it('accepte un type minimal', () => {
    expect(validateDocumentType(valid)).toEqual({})
  })

  it.each(['', '   '])('refuse un nom vide (%j)', (nom) => {
    expect(validateDocumentType({ ...valid, nom }).nom).toMatch(/obligatoire/i)
  })

  it('accepte 255 caractères de nom et refuse 256', () => {
    expect(validateDocumentType({ ...valid, nom: 'a'.repeat(255) }).nom).toBeUndefined()
    expect(validateDocumentType({ ...valid, nom: 'a'.repeat(256) }).nom).toMatch(/255/)
  })

  it('accepte 500 caractères d’aide et refuse 501', () => {
    expect(validateDocumentType({ ...valid, aide: 'a'.repeat(500) }).aide).toBeUndefined()
    expect(validateDocumentType({ ...valid, aide: 'a'.repeat(501) }).aide).toMatch(/500/)
  })

  it('refuse la portée « certaines catégories » sans catégorie', () => {
    expect(validateDocumentType({ ...valid, scope: 'categories', categoryIds: [] }).categoryIds).toMatch(/catégorie/i)
    expect(validateDocumentType({ ...valid, scope: 'categories', categoryIds: [3] }).categoryIds).toBeUndefined()
  })

  it('ignore les catégories cochées quand la portée est « toutes »', () => {
    expect(validateDocumentType({ ...valid, scope: 'all', categoryIds: [3] })).toEqual({})
  })

  it('refuse un repère de délai sans nombre de jours', () => {
    const errors = validateDocumentType({ ...valid, deadlineAnchor: 'BEFORE_START', deadlineDays: '' })
    expect(errors.deadlineDays).toMatch(/nombre de jours/i)
  })

  it.each(['-1', '366', '1.5', 'abc', '1e2', ' '])('refuse %j comme nombre de jours', (deadlineDays) => {
    expect(validateDocumentType({ ...valid, deadlineAnchor: 'AFTER_END', deadlineDays }).deadlineDays).toMatch(
      /nombre de jours|0 et 365/,
    )
  })

  it.each(['0', '7', '365'])('accepte %j jours', (deadlineDays) => {
    expect(validateDocumentType({ ...valid, deadlineAnchor: 'AFTER_END', deadlineDays })).toEqual({})
  })

  it('ne contrôle pas les jours quand il n’y a pas de délai', () => {
    expect(validateDocumentType({ ...valid, deadlineAnchor: '', deadlineDays: 'abc' })).toEqual({})
  })
})

describe('toRequest', () => {
  it('construit le corps complet pour « toutes les formations »', () => {
    expect(
      toRequest({ ...valid, nom: '  Pièce d’identité ', isSensitive: true, categoryIds: [3] }),
    ).toEqual({
      nom: 'Pièce d’identité',
      aide: null,
      isSensitive: true,
      appliesToAllFormations: true,
      categoryIds: [],
      deadlineDays: null,
      deadlineAnchor: null,
      allowedFormats: [],
      providedBy: 'STAGIAIRE',
    })
  })

  it('envoie le fournisseur choisi (G35)', () => {
    expect(toRequest({ ...valid, providedBy: 'ADAC' }).providedBy).toBe('ADAC')
  })

  it('envoie les catégories cochées pour « certaines catégories »', () => {
    const body = toRequest({ ...valid, scope: 'categories', categoryIds: [2, 5] })
    expect(body.appliesToAllFormations).toBe(false)
    expect(body.categoryIds).toEqual([2, 5])
  })

  it('envoie le délai en nombre avec son repère', () => {
    const body = toRequest({ ...valid, deadlineAnchor: 'BEFORE_START', deadlineDays: '7' })
    expect(body.deadlineDays).toBe(7)
    expect(body.deadlineAnchor).toBe('BEFORE_START')
  })

  it('n’envoie ni jours ni repère pour « Aucun délai »', () => {
    const body = toRequest({ ...valid, deadlineAnchor: '', deadlineDays: '7' })
    expect(body.deadlineDays).toBeNull()
    expect(body.deadlineAnchor).toBeNull()
  })

  it('envoie les formats cochés et l’aide nettoyée', () => {
    const body = toRequest({ ...valid, aide: '  À jour ', allowedFormats: ['pdf', 'png'] })
    expect(body.allowedFormats).toEqual(['pdf', 'png'])
    expect(body.aide).toBe('À jour')
  })

  it('envoie une aide vide comme null', () => {
    expect(toRequest({ ...valid, aide: '   ' }).aide).toBeNull()
  })
})

describe('fromType', () => {
  const type = {
    id: 4,
    nom: 'Certificat médical',
    aide: 'Moins de 3 mois',
    isSensitive: true,
    appliesToAllFormations: false,
    categories: [{ id: 2, nom: 'Secourisme', couleur: '#D62828', isActive: true }],
    deadlineDays: 7,
    deadlineAnchor: 'BEFORE_START',
    allowedFormats: ['pdf'],
    providedBy: 'ADAC',
    isActive: true,
  }

  it('remplit le formulaire depuis un type', () => {
    expect(fromType(type)).toEqual({
      nom: 'Certificat médical',
      aide: 'Moins de 3 mois',
      isSensitive: true,
      scope: 'categories',
      categoryIds: [2],
      deadlineAnchor: 'BEFORE_START',
      deadlineDays: '7',
      allowedFormats: ['pdf'],
      providedBy: 'ADAC',
    })
  })

  it('lit un type sans fournisseur comme une pièce du stagiaire', () => {
    expect(fromType({ ...type, providedBy: undefined }).providedBy).toBe('STAGIAIRE')
  })

  it('gère un type sans aide, sans délai ni formats', () => {
    const values = fromType({
      ...type,
      aide: null,
      appliesToAllFormations: true,
      categories: [],
      deadlineDays: null,
      deadlineAnchor: null,
      allowedFormats: null,
    })
    expect(values).toMatchObject({ aide: '', scope: 'all', deadlineAnchor: '', deadlineDays: '', allowedFormats: [] })
  })

  it('fait l’aller-retour : le corps renvoyé redonne le type d’origine', () => {
    expect(toRequest(fromType(type))).toEqual({
      nom: type.nom,
      aide: type.aide,
      isSensitive: true,
      appliesToAllFormations: false,
      categoryIds: [2],
      deadlineDays: 7,
      deadlineAnchor: 'BEFORE_START',
      allowedFormats: ['pdf'],
      providedBy: 'ADAC',
    })
  })
})
