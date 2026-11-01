import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { HttpResponse, delay, http } from 'msw'
import { Route, Routes, useLocation, useParams } from 'react-router'
import FormationFormPage from './FormationFormPage'
import { renderWithProviders } from '../../../test/render'
import { server } from '../../../test/msw/server'
import { API_URL, mockSession } from '../../../test/session'
import { FORMATEURS, mockAccountList } from '../../../test/accounts'
import { mockCategories } from '../../../test/categories'
import {
  CATEGORIES,
  FORMATIONS,
  mockCreateFormation,
  mockFormationDetail,
  mockUpdateFormation,
} from '../../../test/formations'

const [secours, , postures] = FORMATIONS

// Pages d'arrivée simplifiées : on vérifie où l'on atterrit et quel bandeau est transmis.
function Landing() {
  const { formationId } = useParams()
  const { state } = useLocation()
  return <p>{`détail ${formationId} ${state?.notice ?? 'sans bandeau'}`}</p>
}

function renderForm(route) {
  mockSession('SUPER_ADMIN')
  return renderWithProviders(
    <Routes>
      <Route path="/formations" element={<p>liste des formations</p>} />
      <Route path="/formations/creer" element={<FormationFormPage />} />
      <Route path="/formations/:formationId/modifier" element={<FormationFormPage />} />
      <Route path="/formations/:formationId" element={<Landing />} />
    </Routes>,
    { route, withSession: true },
  )
}

function mockLists() {
  mockCategories()
  mockAccountList('formateurs', FORMATEURS)
}

const setDate = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } })

// Les listes (catégories, formateurs) arrivent de l'API : on attend leurs options avant de choisir.
async function fillValidForm({ withFormateur = false } = {}) {
  await userEvent.type(await screen.findByLabelText('Intitulé'), '  Excel niveau 2 ')
  setDate('Du', '2026-05-04')
  setDate('Au', '2026-05-05')
  await userEvent.selectOptions(screen.getByLabelText('Modalité'), 'VISIO')
  await screen.findByRole('option', { name: 'Numérique' })
  await userEvent.selectOptions(screen.getByLabelText('Catégorie'), 'Numérique')
  await screen.findByRole('option', { name: 'Anne Martin' })
  if (withFormateur) await userEvent.selectOptions(screen.getByLabelText('Formateur'), 'Anne Martin')
}

const submit = (name) => userEvent.click(screen.getByRole('button', { name }))

describe('FormationFormPage — création', () => {
  it('affiche les champs du contrat, obligatoires pour ceux qui doivent l’être', async () => {
    mockLists()
    renderForm('/formations/creer')
    expect(await screen.findByRole('heading', { level: 1, name: 'Créer une nouvelle formation' })).toBeInTheDocument()
    await screen.findByLabelText('Catégorie')
    for (const label of ['Intitulé', 'Du', 'Au', 'Modalité', 'Catégorie']) {
      expect(screen.getByLabelText(label)).toBeRequired()
    }
    expect(screen.getByLabelText('Description')).not.toBeRequired()
    expect(screen.getByLabelText('Formateur')).not.toBeRequired()
  })

  it('ne propose ni référence, ni public, ni lieu, ni dépôt de documents', async () => {
    mockLists()
    renderForm('/formations/creer')
    await screen.findByLabelText('Intitulé')
    for (const label of ['Référence', 'Public', 'Lieu', 'Date']) {
      expect(screen.queryByLabelText(label)).not.toBeInTheDocument()
    }
    expect(screen.queryByText(/déposer vos fichiers/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /créer une catégorie/i })).not.toBeInTheDocument()
  })

  it('refuse un formulaire vide sans appel et signale chaque champ obligatoire', async () => {
    mockLists()
    const calls = mockCreateFormation()
    renderForm('/formations/creer')
    await screen.findByLabelText('Catégorie')
    await submit('Créer la formation')
    expect(await screen.findByText("L'intitulé est obligatoire.")).toBeInTheDocument()
    expect(screen.getByText('La date de début est obligatoire.')).toBeInTheDocument()
    expect(screen.getByText('La date de fin est obligatoire.')).toBeInTheDocument()
    expect(screen.getByText('La modalité est obligatoire.')).toBeInTheDocument()
    expect(screen.getByText('La catégorie est obligatoire.')).toBeInTheDocument()
    expect(calls.count).toBe(0)
  })

  it('relie le message au champ en erreur (aria-invalid, aria-describedby)', async () => {
    mockLists()
    renderForm('/formations/creer')
    await screen.findByLabelText('Catégorie')
    await submit('Créer la formation')
    const field = screen.getByLabelText('Intitulé')
    await waitFor(() => expect(field).toHaveAttribute('aria-invalid', 'true'))
    expect(field).toHaveAccessibleDescription("L'intitulé est obligatoire.")
  })

  describe('dates', () => {
    it('préremplit « Au » quand on choisit « Du »', async () => {
      mockLists()
      renderForm('/formations/creer')
      await screen.findByLabelText('Du')
      setDate('Du', '2026-03-10')
      expect(screen.getByLabelText('Au')).toHaveValue('2026-03-10')
    })

    it('suit « Du » tant que « Au » n’a pas été choisie séparément, puis la laisse', async () => {
      mockLists()
      renderForm('/formations/creer')
      await screen.findByLabelText('Du')
      setDate('Du', '2026-03-10')
      setDate('Du', '2026-03-14')
      expect(screen.getByLabelText('Au')).toHaveValue('2026-03-14')
      setDate('Au', '2026-03-20')
      setDate('Du', '2026-03-16')
      expect(screen.getByLabelText('Au')).toHaveValue('2026-03-20')
    })

    it('refuse une plage inversée sans appel', async () => {
      mockLists()
      const calls = mockCreateFormation()
      renderForm('/formations/creer')
      await fillValidForm()
      setDate('Du', '2026-05-12')
      setDate('Au', '2026-05-10')
      await submit('Créer la formation')
      expect(await screen.findByText('La date de fin ne peut pas précéder la date de début.')).toBeInTheDocument()
      expect(calls.count).toBe(0)
    })

    it('accepte une formation d’un jour', async () => {
      mockLists()
      const calls = mockCreateFormation()
      renderForm('/formations/creer')
      await fillValidForm()
      setDate('Du', '2026-05-04')
      setDate('Au', '2026-05-04')
      await submit('Créer la formation')
      await waitFor(() => expect(calls.count).toBe(1))
      expect(calls.body).toMatchObject({ dateDebut: '2026-05-04', dateFin: '2026-05-04' })
    })
  })

  describe('catégories et formateurs', () => {
    it('propose les catégories actives de l’API, pas les désactivées', async () => {
      mockLists()
      renderForm('/formations/creer')
      const select = await screen.findByLabelText('Catégorie')
      const options = Array.from(select.querySelectorAll('option')).map((option) => option.textContent)
      expect(options).toEqual(['Sélectionner une catégorie', 'Secourisme', 'Numérique'])
    })

    it('signale une erreur de chargement des catégories et permet de réessayer', async () => {
      mockAccountList('formateurs', FORMATEURS)
      mockCategories(undefined, { errorStatus: 500 })
      renderForm('/formations/creer')
      expect(await screen.findByRole('alert')).toBeInTheDocument()
      expect(screen.queryByLabelText('Catégorie')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Créer la formation' })).toBeDisabled()
      mockCategories()
      await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
      expect(await screen.findByLabelText('Catégorie')).toBeInTheDocument()
    })

    it('propose « Assigné à la chargée de formation » puis les formateurs actifs', async () => {
      mockLists()
      renderForm('/formations/creer')
      const select = await screen.findByLabelText('Formateur')
      await waitFor(() => expect(select.querySelectorAll('option')).toHaveLength(2))
      const options = Array.from(select.querySelectorAll('option')).map((option) => option.textContent)
      expect(options).toEqual(['Assigné à la chargée de formation', 'Anne Martin'])
    })
  })

  describe('envoi', () => {
    it('envoie les champs du contrat nettoyés, formateur null sans choix', async () => {
      mockLists()
      const calls = mockCreateFormation()
      renderForm('/formations/creer')
      await fillValidForm()
      await submit('Créer la formation')
      await waitFor(() => expect(calls.count).toBe(1))
      expect(calls.body).toEqual({
        intitule: 'Excel niveau 2',
        description: null,
        dateDebut: '2026-05-04',
        dateFin: '2026-05-05',
        modalite: 'VISIO',
        categoryId: CATEGORIES.numerique.id,
        formateurId: null,
      })
    })

    it('envoie l’identifiant du formateur choisi et la description', async () => {
      mockLists()
      const calls = mockCreateFormation()
      renderForm('/formations/creer')
      await fillValidForm({ withFormateur: true })
      await userEvent.type(screen.getByLabelText('Description'), 'Niveau avancé.')
      await submit('Créer la formation')
      await waitFor(() => expect(calls.count).toBe(1))
      expect(calls.body).toMatchObject({ formateurId: 10, description: 'Niveau avancé.' })
    })

    it('redirige vers la formation créée avec le bandeau « formation-created »', async () => {
      mockLists()
      mockCreateFormation({ id: 55 })
      renderForm('/formations/creer')
      await fillValidForm()
      await submit('Créer la formation')
      expect(await screen.findByText('détail 55 formation-created')).toBeInTheDocument()
    })

    it('désactive le bouton pendant l’envoi', async () => {
      mockLists()
      server.use(
        http.post(`${API_URL}/formations`, async () => {
          await delay(150)
          return HttpResponse.json({ ...secours, id: 55 }, { status: 201 })
        }),
      )
      renderForm('/formations/creer')
      await fillValidForm()
      await submit('Créer la formation')
      await waitFor(() => expect(screen.getByRole('button', { name: 'Créer la formation' })).toBeDisabled())
      await screen.findByText(/détail 55/)
    })

    it('affiche l’erreur 400 du back dans un bandeau et garde la saisie', async () => {
      mockLists()
      mockCreateFormation({ errorStatus: 400, errorMessage: 'formateurId invalide : doit être un formateur actif' })
      renderForm('/formations/creer')
      await fillValidForm({ withFormateur: true })
      await submit('Créer la formation')
      expect(await screen.findByRole('alert')).toHaveTextContent('formateurId invalide : doit être un formateur actif')
      expect(screen.getByLabelText('Intitulé')).toHaveValue('  Excel niveau 2 ')
      expect(screen.getByLabelText('Du')).toHaveValue('2026-05-04')
      expect(screen.getByRole('button', { name: 'Créer la formation' })).toBeEnabled()
    })

    it('annule sans appel et revient à la liste', async () => {
      mockLists()
      const calls = mockCreateFormation()
      renderForm('/formations/creer')
      await fillValidForm()
      await userEvent.click(screen.getByRole('link', { name: 'Annuler' }))
      expect(await screen.findByText('liste des formations')).toBeInTheDocument()
      expect(calls.count).toBe(0)
    })
  })

  it('ne présente aucune violation d’accessibilité (création)', async () => {
    mockLists()
    const { container } = renderForm('/formations/creer')
    await screen.findByLabelText('Catégorie')
    await screen.findByRole('option', { name: 'Anne Martin' })
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('FormationFormPage — modification', () => {
  it('préremplit le formulaire depuis la formation', async () => {
    mockLists()
    mockFormationDetail(secours)
    renderForm('/formations/101/modifier')
    expect(await screen.findByRole('heading', { level: 1, name: 'Modifier la formation' })).toBeInTheDocument()
    expect(await screen.findByLabelText('Intitulé')).toHaveValue('Premiers secours PSC1')
    await screen.findByLabelText('Catégorie')
    await screen.findByLabelText('Formateur')
    expect(screen.getByLabelText('Description')).toHaveValue('Gestes de premiers secours.')
    expect(screen.getByLabelText('Du')).toHaveValue('2026-03-10')
    expect(screen.getByLabelText('Au')).toHaveValue('2026-03-12')
    expect(screen.getByLabelText('Modalité')).toHaveValue('PRESENTIEL')
    expect(screen.getByLabelText('Catégorie')).toHaveValue(String(CATEGORIES.secours.id))
    expect(screen.getByLabelText('Formateur')).toHaveValue('2')
    expect(screen.getByRole('option', { name: 'Formateur Dev' })).toBeInTheDocument()
  })

  it('n’envoie que les champs modifiés puis revient au détail avec « formation-updated »', async () => {
    mockLists()
    mockFormationDetail(secours)
    const calls = mockUpdateFormation(secours)
    renderForm('/formations/101/modifier')
    const intitule = await screen.findByLabelText('Intitulé')
    await userEvent.clear(intitule)
    await userEvent.type(intitule, 'PSC1 recyclage')
    await submit('Enregistrer')
    expect(await screen.findByText('détail 101 formation-updated')).toBeInTheDocument()
    expect(calls.body).toEqual({ intitule: 'PSC1 recyclage' })
  })

  it('n’émet aucun appel quand rien n’a changé et revient au détail', async () => {
    mockLists()
    mockFormationDetail(secours)
    const calls = mockUpdateFormation(secours)
    renderForm('/formations/101/modifier')
    await screen.findByLabelText('Intitulé')
    await submit('Enregistrer')
    expect(await screen.findByText('détail 101 sans bandeau')).toBeInTheDocument()
    expect(calls.count).toBe(0)
  })

  it('conserve une catégorie désactivée sans la proposer ailleurs', async () => {
    const formation = { ...secours, category: CATEGORIES.ancienne }
    mockLists()
    mockFormationDetail(formation)
    renderForm('/formations/101/modifier')
    const select = await screen.findByLabelText('Catégorie')
    await waitFor(() => expect(select).toHaveValue(String(CATEGORIES.ancienne.id)))
    expect(screen.getByRole('option', { name: 'Ancienne catégorie (désactivée)' })).toBeInTheDocument()
  })

  it('repasse à « Assigné à la chargée de formation » en envoyant formateurId: null', async () => {
    mockLists()
    mockFormationDetail(secours)
    const calls = mockUpdateFormation(secours)
    renderForm('/formations/101/modifier')
    await screen.findByLabelText('Intitulé')
    await screen.findByLabelText('Formateur')
    await userEvent.selectOptions(screen.getByLabelText('Formateur'), 'Assigné à la chargée de formation')
    await submit('Enregistrer')
    await screen.findByText(/détail 101/)
    expect(calls.body).toEqual({ formateurId: null })
  })

  it('refuse de modifier une formation archivée', async () => {
    mockLists()
    mockFormationDetail(postures)
    renderForm('/formations/103/modifier')
    expect(await screen.findByText('Cette formation est archivée : elle ne peut plus être modifiée.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Enregistrer' })).not.toBeInTheDocument()
  })

  it('affiche « Formation introuvable ou non accessible » sur un 404', async () => {
    mockLists()
    mockFormationDetail(secours, { errorStatus: 404 })
    renderForm('/formations/101/modifier')
    expect(await screen.findByText('Formation introuvable ou non accessible')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Retour aux formations' })).toHaveAttribute('href', '/formations')
  })

  it('invite à recharger sur un 409 et garde la saisie jusqu’au rechargement', async () => {
    mockLists()
    const detail = mockFormationDetail(secours)
    mockUpdateFormation(secours, { errorStatus: 409 })
    renderForm('/formations/101/modifier')
    const intitule = await screen.findByLabelText('Intitulé')
    await userEvent.clear(intitule)
    await userEvent.type(intitule, 'PSC1 recyclage')
    await submit('Enregistrer')
    expect(await screen.findByText(/modifiée entre-temps/)).toBeInTheDocument()
    expect(screen.getByLabelText('Intitulé')).toHaveValue('PSC1 recyclage')
    await userEvent.click(screen.getByRole('button', { name: 'Recharger' }))
    await waitFor(() => expect(detail.count).toBe(2))
    await waitFor(() => expect(screen.getByLabelText('Intitulé')).toHaveValue('Premiers secours PSC1'))
    expect(screen.queryByText(/modifiée entre-temps/)).not.toBeInTheDocument()
  })

  it('ne présente aucune violation d’accessibilité (modification)', async () => {
    mockLists()
    mockFormationDetail(secours)
    const { container } = renderForm('/formations/101/modifier')
    await screen.findByLabelText('Intitulé')
    await screen.findByRole('option', { name: 'Anne Martin' })
    expect(await axe(container)).toHaveNoViolations()
  })
})
