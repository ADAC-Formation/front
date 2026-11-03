import { USERS } from '../../test/session'
import { FORMATEURS, STAGIAIRES } from '../../test/accounts'
import { allowedRecipients, canWriteTo } from './recipients'

const [anne, paul] = FORMATEURS // paul est suspendu
const [lea, omar] = STAGIAIRES // omar est désactivé
const chargee = USERS.SUPER_ADMIN
const formateur = { ...anne, id: 2 } // le formateur connecté (USERS.ADMIN a l'id 2)
const stagiaire = USERS.STAGIAIRE

const ids = (users) => users.map((u) => u.id)

describe('allowedRecipients', () => {
  describe('chargée de formation', () => {
    it('peut écrire à tous les formateurs et stagiaires actifs', () => {
      const result = allowedRecipients(chargee, { formateurs: [anne, paul], stagiaires: [lea, omar] })
      expect(ids(result)).toEqual([anne.id, lea.id])
    })

    it("ne se propose pas à elle-même, même si elle figure dans une conversation", () => {
      const conversations = [{ participant: chargee }]
      const result = allowedRecipients(chargee, { formateurs: [anne], stagiaires: [], conversations })
      expect(ids(result)).toEqual([anne.id])
    })

    it('ajoute une autre chargée de formation déjà connue par une conversation', () => {
      const autre = { ...chargee, id: 99 }
      const result = allowedRecipients(chargee, { formateurs: [], stagiaires: [], conversations: [{ participant: autre }] })
      expect(ids(result)).toEqual([99])
    })
  })

  describe('formateur', () => {
    it('peut écrire aux stagiaires actifs fournis, pas aux autres formateurs', () => {
      const result = allowedRecipients(USERS.ADMIN, { formateurs: [anne], stagiaires: [lea, omar] })
      expect(ids(result)).toEqual([lea.id])
    })

    it('ajoute la chargée de formation quand une conversation la fait connaître', () => {
      const result = allowedRecipients(USERS.ADMIN, {
        stagiaires: [lea],
        conversations: [{ participant: chargee }, { participant: lea }],
      })
      expect(ids(result)).toEqual([lea.id, chargee.id])
    })

    it('ajoute la chargée de formation quand elle est formateur d\'une formation', () => {
      const result = allowedRecipients(USERS.ADMIN, {
        stagiaires: [],
        formations: [{ formateur: chargee }],
      })
      expect(ids(result)).toEqual([chargee.id])
    })

    it("n'ajoute pas un autre formateur ou un stagiaire venu d'une conversation seulement", () => {
      const result = allowedRecipients(USERS.ADMIN, {
        stagiaires: [],
        conversations: [{ participant: anne }, { participant: omar }],
      })
      expect(result).toEqual([])
    })

    it('ne se propose pas à lui-même', () => {
      const result = allowedRecipients(formateur, { stagiaires: [formateur, lea] })
      expect(ids(result)).toEqual([lea.id])
    })
  })

  describe('stagiaire', () => {
    const formations = [
      { id: 1, formateur: anne },
      { id: 2, formateur: anne },
      { id: 3, formateur: paul },
    ]

    it('peut écrire aux formateurs actifs de ses formations, sans doublon', () => {
      const result = allowedRecipients(stagiaire, { formations })
      expect(ids(result)).toEqual([anne.id])
    })

    it("ne propose aucun autre stagiaire, même s'il figure dans une conversation", () => {
      const result = allowedRecipients(stagiaire, { formations, conversations: [{ participant: lea }] })
      expect(ids(result)).toEqual([anne.id])
    })

    it('ajoute la chargée de formation connue par une conversation', () => {
      const result = allowedRecipients(stagiaire, { formations, conversations: [{ participant: chargee }] })
      expect(ids(result)).toEqual([anne.id, chargee.id])
    })

    it('compte la chargée de formation formateur d\'une formation une seule fois', () => {
      const result = allowedRecipients(stagiaire, {
        formations: [{ formateur: chargee }],
        conversations: [{ participant: chargee }],
      })
      expect(ids(result)).toEqual([chargee.id])
    })

    it("n'ajoute pas une chargée de formation suspendue", () => {
      const suspended = { ...chargee, isActive: false }
      const result = allowedRecipients(stagiaire, { formations: [], conversations: [{ participant: suspended }] })
      expect(result).toEqual([])
    })
  })

  it('tolère des sources absentes', () => {
    expect(allowedRecipients(stagiaire, {})).toEqual([])
    expect(allowedRecipients(chargee, {})).toEqual([])
  })

  it('renvoie une liste vide sans utilisateur', () => {
    expect(allowedRecipients(null, { formateurs: [anne] })).toEqual([])
  })
})

describe('canWriteTo', () => {
  const recipients = [anne, lea]

  it('accepte une personne de la liste des destinataires', () => {
    expect(canWriteTo(recipients, anne.id)).toBe(true)
  })

  it("accepte l'id en texte (paramètre d'adresse)", () => {
    expect(canWriteTo(recipients, String(lea.id))).toBe(true)
  })

  it('refuse une personne absente de la liste', () => {
    expect(canWriteTo(recipients, 999)).toBe(false)
  })

  it('refuse un id invalide', () => {
    expect(canWriteTo(recipients, 'abc')).toBe(false)
    expect(canWriteTo(recipients, undefined)).toBe(false)
  })
})
