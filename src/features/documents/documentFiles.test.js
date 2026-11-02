import { describe, expect, it } from 'vitest'
import { AUTRE_FORMATEUR, FORMATIONS } from '../../test/formations'
import { USERS } from '../../test/session'
import {
  MAX_FILE_SIZE,
  canDeleteDocument,
  canUploadOwnDocument,
  canUploadDocument,
  documentKind,
  formatDocumentDate,
  formatFileSize,
  inscriptionIdOf,
  validateDocumentFile,
} from './documentFiles'

const file = (name, size = 1000) => ({ name, size })

describe('validateDocumentFile', () => {
  it.each(['cours.pdf', 'photo.jpg', 'photo.jpeg', 'schema.png', 'support.docx'])('accepte %s', (name) => {
    expect(validateDocumentFile(file(name))).toBeNull()
  })

  it('ignore la casse de l’extension', () => {
    expect(validateDocumentFile(file('COURS.PDF'))).toBeNull()
    expect(validateDocumentFile(file('Photo.JpG'))).toBeNull()
  })

  it.each(['virus.exe', 'ancien.doc', 'tableau.xlsx', 'sans-extension', 'archive.pdf.zip'])('refuse %s', (name) => {
    expect(validateDocumentFile(file(name))).toMatch(/Format non autorisé/)
  })

  it('accepte 10 Mo pile et refuse un octet de plus', () => {
    expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024)
    expect(validateDocumentFile(file('a.pdf', MAX_FILE_SIZE))).toBeNull()
    expect(validateDocumentFile(file('a.pdf', MAX_FILE_SIZE + 1))).toMatch(/trop volumineux.*10 Mo/)
  })

  it('refuse un fichier vide', () => {
    expect(validateDocumentFile(file('a.pdf', 0))).toMatch(/vide/)
  })
})

describe('formatFileSize', () => {
  it.each([
    [850, '850 o'],
    [1024, '1 Ko'],
    [12 * 1024, '12 Ko'],
    [1536, '2 Ko'],
    [Math.round(3.4 * 1024 * 1024), '3,4 Mo'],
    [10 * 1024 * 1024, '10 Mo'],
  ])('%i octets → %s', (bytes, label) => {
    expect(formatFileSize(bytes)).toBe(label)
  })
})

describe('formatDocumentDate', () => {
  it('écrit la date d’envoi en français', () => {
    expect(formatDocumentDate('2026-02-20T10:30:00')).toBe('20 février 2026')
  })

  it('renvoie un texte vide plutôt que de planter sur une date absente ou invalide', () => {
    expect(formatDocumentDate(undefined)).toBe('')
    expect(formatDocumentDate(null)).toBe('')
    expect(formatDocumentDate('pas une date')).toBe('')
  })
})

describe('documentKind', () => {
  it.each([
    ['cours.pdf', 'PDF'],
    ['photo.JPG', 'Image'],
    ['schema.png', 'Image'],
    ['support.docx', 'Word'],
    ['inconnu.bin', 'Fichier'],
  ])('%s → %s', (name, kind) => {
    expect(documentKind(name)).toBe(kind)
  })
})

// La formation 101 est active et confiée à USERS.ADMIN ; 103 est archivée.
const active = FORMATIONS.find((f) => f.id === 101)
const otherTrainersActive = { ...active, formateur: AUTRE_FORMATEUR }
const archived = { ...active, status: 'ARCHIVED' }
const byMe = { id: 1, uploadedBy: USERS.ADMIN }
const byOther = { id: 2, uploadedBy: AUTRE_FORMATEUR }

describe('canUploadDocument', () => {
  it('la chargée de formation dépose sur toute formation active', () => {
    expect(canUploadDocument(USERS.SUPER_ADMIN, active)).toBe(true)
    expect(canUploadDocument(USERS.SUPER_ADMIN, otherTrainersActive)).toBe(true)
  })

  it('le formateur dépose sur sa formation seulement', () => {
    expect(canUploadDocument(USERS.ADMIN, active)).toBe(true)
    expect(canUploadDocument(USERS.ADMIN, otherTrainersActive)).toBe(false)
  })

  it('le stagiaire ne dépose jamais', () => {
    expect(canUploadDocument(USERS.STAGIAIRE, active)).toBe(false)
  })

  it('personne ne dépose sur une formation archivée', () => {
    expect(canUploadDocument(USERS.SUPER_ADMIN, archived)).toBe(false)
    expect(canUploadDocument(USERS.ADMIN, archived)).toBe(false)
  })

  it('refuse sans utilisateur', () => {
    expect(canUploadDocument(undefined, active)).toBe(false)
  })
})

describe('canDeleteDocument', () => {
  it('la chargée de formation supprime tout sur une formation active', () => {
    expect(canDeleteDocument(USERS.SUPER_ADMIN, active, byMe)).toBe(true)
    expect(canDeleteDocument(USERS.SUPER_ADMIN, active, byOther)).toBe(true)
  })

  it('le formateur supprime ses propres envois seulement, quelle que soit la formation', () => {
    expect(canDeleteDocument(USERS.ADMIN, active, byMe)).toBe(true)
    expect(canDeleteDocument(USERS.ADMIN, active, byOther)).toBe(false)
    expect(canDeleteDocument(USERS.ADMIN, otherTrainersActive, byMe)).toBe(true)
  })

  it('le stagiaire ne supprime jamais', () => {
    expect(canDeleteDocument(USERS.STAGIAIRE, active, byMe)).toBe(false)
  })

  it('personne ne supprime sur une formation archivée', () => {
    expect(canDeleteDocument(USERS.SUPER_ADMIN, archived, byMe)).toBe(false)
    expect(canDeleteDocument(USERS.ADMIN, archived, byMe)).toBe(false)
  })
})

// 028 (G8, G11, Q13) : seul point qui lit l'identifiant d'inscription du stagiaire sur la formation.
describe('inscriptionIdOf', () => {
  it("renvoie l'identifiant quand la formation le porte", () => {
    expect(inscriptionIdOf({ id: 101, inscriptionId: 7 })).toBe(7)
  })

  it.each([
    ['absent', { id: 101 }],
    ['null', { id: 101, inscriptionId: null }],
    ['non numérique', { id: 101, inscriptionId: 'abc' }],
  ])('renvoie null quand le champ est %s', (_label, formation) => {
    expect(inscriptionIdOf(formation)).toBeNull()
  })
})

describe('canUploadOwnDocument', () => {
  it('autorise le dépôt sur une formation active dont l’inscription est connue', () => {
    expect(canUploadOwnDocument({ status: 'ACTIVE', inscriptionId: 7 })).toBe(true)
  })

  it('refuse sur une formation archivée', () => {
    expect(canUploadOwnDocument({ status: 'ARCHIVED', inscriptionId: 7 })).toBe(false)
  })

  it('refuse sans inscriptionId (Q13)', () => {
    expect(canUploadOwnDocument({ status: 'ACTIVE' })).toBe(false)
  })
})
