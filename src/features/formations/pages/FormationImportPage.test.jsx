import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { Route, Routes, useLocation } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import FormationImportPage from './FormationImportPage'
import FormationNotice from '../components/FormationNotice'
import { IMPORT_COLUMNS } from '../importColumns'
import { downloadImportTemplate } from '../importTemplate'
import { MAX_IMPORT_BYTES } from '../importFile'
import { renderWithProviders } from '../../../test/render'
import { mockSession } from '../../../test/session'
import { FORMATEURS, mockAccountList } from '../../../test/accounts'
import { mockCategories } from '../../../test/categories'
import { mockImportFormations } from '../../../test/formations'

// La génération du .xlsx est mockée ici (testée dans importTemplate.test.js).
vi.mock('../importTemplate', () => ({ downloadImportTemplate: vi.fn().mockResolvedValue(undefined) }))

// Page d'arrivée simplifiée : le bandeau est lu par le vrai FormationNotice.
function Landing() {
  const { state } = useLocation()
  return (
    <div>
      <p>liste des formations</p>
      <FormationNotice />
      <p>{`bandeau ${state?.notice ?? 'aucun'} ${state?.count ?? ''}`}</p>
    </div>
  )
}

function renderImport() {
  mockSession('SUPER_ADMIN')
  return renderWithProviders(
    <Routes>
      <Route path="/formations" element={<Landing />} />
      <Route path="/formations/importer" element={<FormationImportPage />} />
    </Routes>,
    { route: '/formations/importer', withSession: true },
  )
}

const xlsx = (name = 'formations.xlsx') =>
  new File(['contenu'], name, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

// `applyAccept: false` : le test doit pouvoir déposer un fichier que l'attribut accept écarterait.
const user = () => userEvent.setup({ applyAccept: false })

async function chooseFile(file = xlsx()) {
  const input = await screen.findByLabelText(/fichier excel/i)
  await user().upload(input, file)
  return input
}

const importButton = () => screen.getByRole('button', { name: 'Importer' })

beforeEach(() => {
  vi.mocked(downloadImportTemplate).mockClear()
})

describe('FormationImportPage — consignes et modèle', () => {
  it('affiche le titre et le lien Retour vers la création de formation', async () => {
    renderImport()
    expect(await screen.findByRole('heading', { level: 1, name: 'Importer des formations' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /retour/i })).toHaveAttribute('href', '/formations/creer')
  })

  it('annule vers la création de formation', async () => {
    renderImport()
    expect(await screen.findByRole('link', { name: 'Annuler' })).toHaveAttribute('href', '/formations/creer')
  })

  it('place un « ? » à côté de « Fichier à importer », fermé au départ', async () => {
    renderImport()
    const help = await screen.findByRole('button', { name: /aide/i })
    expect(help).toHaveTextContent('?')
    expect(help).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('table', { name: /colonnes attendues/i })).not.toBeInTheDocument()
    const heading = screen.getByRole('heading', { level: 2, name: 'Fichier à importer' })
    expect(heading.compareDocumentPosition(help) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(help.parentElement).toBe(heading.parentElement)
  })

  it('ouvre et referme l’aide avec le « ? »', async () => {
    renderImport()
    const help = await screen.findByRole('button', { name: /aide/i })
    await userEvent.click(help)
    expect(help).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('table', { name: /colonnes attendues/i })).toBeInTheDocument()
    await userEvent.click(help)
    expect(help).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('table', { name: /colonnes attendues/i })).not.toBeInTheDocument()
  })

  it('met le modèle sous « Fichier à importer », après le champ fichier', async () => {
    renderImport()
    const file = await screen.findByLabelText(/fichier excel/i)
    const template = screen.getByRole('button', { name: 'Télécharger le modèle' })
    expect(file.compareDocumentPosition(template) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(template.closest('form')).toBe(file.closest('form'))
    expect(screen.queryByRole('heading', { level: 2, name: 'Modèle' })).not.toBeInTheDocument()
  })

  it('liste les sept colonnes attendues avec leur caractère obligatoire et leur format', async () => {
    renderImport()
    await userEvent.click(await screen.findByRole('button', { name: /aide/i }))
    const table = await screen.findByRole('table', { name: /colonnes attendues/i })
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(IMPORT_COLUMNS.length)
    IMPORT_COLUMNS.forEach((column, index) => {
      const cells = within(rows[index]).getAllByRole('cell')
      expect(cells[0]).toHaveTextContent(column.key)
      expect(cells[1]).toHaveTextContent(column.required ? 'Oui' : 'Non')
      expect(cells[2]).toHaveTextContent(column.format)
    })
  })

  it('explique que la première ligne est ignorée et que le formateur vide est la chargée de formation', async () => {
    renderImport()
    await userEvent.click(await screen.findByRole('button', { name: /aide/i }))
    expect(await screen.findByRole('heading', { name: 'Format du fichier' })).toBeInTheDocument()
    expect(screen.getByText(/première ligne/i)).toBeInTheDocument()
    expect(screen.getAllByText(/chargée de formation est assignée/i).length).toBeGreaterThan(0)
  })

  it('télécharge le modèle avec les catégories et les formateurs actifs de l’API', async () => {
    const categories = mockCategories()
    const formateurs = mockAccountList('formateurs', FORMATEURS)
    renderImport()
    await userEvent.click(await screen.findByRole('button', { name: 'Télécharger le modèle' }))
    await waitFor(() => expect(downloadImportTemplate).toHaveBeenCalledTimes(1))
    const lists = vi.mocked(downloadImportTemplate).mock.calls[0][0]
    expect(lists.categories.map((c) => c.nom)).toEqual(['Secourisme', 'Numérique'])
    expect(lists.formateurs.map((f) => f.email)).toEqual(['anne@adac.test'])
    expect(categories.urls[0]).toContain('active=true')
    expect(formateurs.urls[0]).toContain('active=true')
  })

  it('ne charge pas les listes avant le clic', async () => {
    const categories = mockCategories()
    const formateurs = mockAccountList('formateurs', FORMATEURS)
    renderImport()
    await screen.findByRole('button', { name: 'Télécharger le modèle' })
    expect(categories.count).toBe(0)
    expect(formateurs.count).toBe(0)
  })

  it('affiche une erreur annoncée si les listes ne se chargent pas, sans télécharger', async () => {
    mockCategories(undefined, { errorStatus: 500 })
    mockAccountList('formateurs', FORMATEURS)
    renderImport()
    await userEvent.click(await screen.findByRole('button', { name: 'Télécharger le modèle' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/catégories et de formateurs/i)
    expect(downloadImportTemplate).not.toHaveBeenCalled()
  })

  it('affiche une erreur annoncée si le modèle ne peut pas être généré', async () => {
    mockCategories()
    mockAccountList('formateurs', FORMATEURS)
    vi.mocked(downloadImportTemplate).mockRejectedValueOnce(new Error('boom'))
    renderImport()
    await userEvent.click(await screen.findByRole('button', { name: 'Télécharger le modèle' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/modèle/i)
  })

  it('explique que le modèle propose des listes déroulantes', async () => {
    renderImport()
    expect(await screen.findByText(/listes déroulantes/i)).toBeInTheDocument()
  })
})

describe('FormationImportPage — choix du fichier', () => {
  it('désactive « Importer » tant qu’aucun fichier n’est choisi', async () => {
    renderImport()
    await screen.findByLabelText(/fichier excel/i)
    expect(importButton()).toBeDisabled()
  })

  it('active « Importer » et affiche le nom d’un fichier .xlsx valide', async () => {
    renderImport()
    await chooseFile()
    expect(importButton()).toBeEnabled()
    expect(screen.getByText(/formations\.xlsx/)).toBeInTheDocument()
  })

  it('refuse un fichier qui n’est pas .xlsx, sans appel', async () => {
    const calls = mockImportFormations()
    renderImport()
    await chooseFile(xlsx('formations.csv'))
    expect(await screen.findByText(/seuls les fichiers \.xlsx/i)).toBeInTheDocument()
    expect(importButton()).toBeDisabled()
    expect(calls.count).toBe(0)
  })

  it('refuse un fichier de plus de 2 Mo, sans appel', async () => {
    const calls = mockImportFormations()
    renderImport()
    const big = new File([new Uint8Array(MAX_IMPORT_BYTES + 1)], 'gros.xlsx')
    await chooseFile(big)
    expect(await screen.findByText(/dépasse la taille maximale/i)).toBeInTheDocument()
    expect(importButton()).toBeDisabled()
    expect(calls.count).toBe(0)
  })

  it('lie le message du fichier refusé au champ', async () => {
    renderImport()
    const input = await chooseFile(xlsx('formations.csv'))
    const message = await screen.findByText(/seuls les fichiers \.xlsx/i)
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input.getAttribute('aria-describedby')).toContain(message.id)
  })
})

describe('FormationImportPage — envoi', () => {
  it('envoie le fichier en multipart et désactive le bouton pendant l’envoi', async () => {
    const calls = mockImportFormations({ count: 1 })
    renderImport()
    await chooseFile()
    const click = userEvent.click(importButton())
    await screen.findByText('liste des formations')
    await click
    expect(calls.count).toBe(1)
    expect(calls.contentType).toMatch(/^multipart\/form-data/)
    expect(calls.body).toContain('name="file"; filename="formations.xlsx"')
  })

  it('désactive « Importer » pendant l’envoi', async () => {
    const { delay, http, HttpResponse } = await import('msw')
    const { server } = await import('../../../test/msw/server')
    const { API_URL } = await import('../../../test/session')
    server.use(
      http.post(`${API_URL}/formations/import`, async () => {
        await delay(150)
        return HttpResponse.json([], { status: 201 })
      }),
    )
    renderImport()
    await chooseFile()
    await userEvent.click(importButton())
    expect(importButton()).toBeDisabled()
    await screen.findByText('liste des formations')
  })

  it('redirige vers la liste avec « 3 formations importées »', async () => {
    mockImportFormations({ count: 3 })
    renderImport()
    await chooseFile()
    await userEvent.click(importButton())
    expect(await screen.findByText('3 formations importées')).toBeInTheDocument()
    expect(screen.getByText('bandeau formations-imported 3')).toBeInTheDocument()
  })

  it('annonce « 1 formation importée » au singulier', async () => {
    mockImportFormations({ count: 1 })
    renderImport()
    await chooseFile()
    await userEvent.click(importButton())
    expect(await screen.findByText('1 formation importée')).toBeInTheDocument()
  })
})

describe('FormationImportPage — erreurs du fichier (400)', () => {
  const MESSAGE =
    'ligne 3, colonne categorie : "X" introuvable | ligne 5, colonne dateDebut : date invalide (attendu AAAA-MM-JJ)'

  async function importWithBadFile(message = MESSAGE) {
    const calls = mockImportFormations({ errorStatus: 400, errorMessage: message })
    renderImport()
    await chooseFile()
    await userEvent.click(importButton())
    return calls
  }

  it('affiche un tableau Ligne / Colonne / Problème, annoncé, sans quitter la page', async () => {
    await importWithBadFile()
    expect(await screen.findByRole('alert')).toHaveTextContent(/2 erreurs/i)
    const table = screen.getByRole('table', { name: /erreurs du fichier/i })
    expect(within(table).getAllByRole('columnheader').map((th) => th.textContent)).toEqual([
      'Ligne',
      'Colonne',
      'Problème',
    ])
    const rows = within(table).getAllByRole('row').slice(1)
    expect(within(rows[0]).getAllByRole('cell').map((td) => td.textContent)).toEqual(['3', 'categorie', '"X" introuvable'])
    expect(within(rows[1]).getAllByRole('cell').map((td) => td.textContent)).toEqual([
      '5',
      'dateDebut',
      'date invalide (attendu AAAA-MM-JJ)',
    ])
    expect(screen.queryByText('liste des formations')).not.toBeInTheDocument()
  })

  it('affiche telle quelle toute entrée non reconnue, dans une liste', async () => {
    await importWithBadFile("ligne 2, colonne intitule : valeur manquante | ... et d'autres erreurs (limite de 50 atteinte)")
    const list = await screen.findByRole('list', { name: /autres erreurs/i })
    expect(within(list).getByText("... et d'autres erreurs (limite de 50 atteinte)")).toBeInTheDocument()
    expect(screen.getByRole('table', { name: /erreurs du fichier/i })).toBeInTheDocument()
  })

  it('n’affiche pas de tableau quand aucune entrée n’est reconnue', async () => {
    await importWithBadFile('Format invalide, seuls les fichiers .xlsx sont acceptés')
    const list = await screen.findByRole('list', { name: /autres erreurs/i })
    expect(within(list).getByText('Format invalide, seuls les fichiers .xlsx sont acceptés')).toBeInTheDocument()
    expect(screen.queryByRole('table', { name: /erreurs du fichier/i })).not.toBeInTheDocument()
  })

  it('affiche un message générique si le back n’en donne pas', async () => {
    mockImportFormations({ errorStatus: 400, errorMessage: '' })
    renderImport()
    await chooseFile()
    await userEvent.click(importButton())
    expect(await screen.findByRole('list', { name: /autres erreurs/i })).toHaveTextContent(/une erreur est survenue/i)
  })

  it('efface les erreurs quand on choisit un autre fichier, et permet un nouvel essai', async () => {
    await importWithBadFile()
    await screen.findByRole('table', { name: /erreurs du fichier/i })
    await chooseFile(xlsx('corrige.xlsx'))
    expect(screen.queryByRole('table', { name: /erreurs du fichier/i })).not.toBeInTheDocument()
    expect(importButton()).toBeEnabled()
  })

  it('n’affiche pas les valeurs du back comme du HTML', async () => {
    await importWithBadFile('ligne 2, colonne intitule : <img src=x onerror=alert(1)> invalide')
    expect(await screen.findByText(/<img src=x onerror=alert\(1\)> invalide/)).toBeInTheDocument()
    expect(document.querySelector('img')).toBeNull()
  })
})

describe('FormationImportPage — autres erreurs', () => {
  it('affiche le 403 en bandeau annoncé et garde le fichier', async () => {
    mockImportFormations({ errorStatus: 403, errorMessage: 'Accès refusé' })
    renderImport()
    await chooseFile()
    await userEvent.click(importButton())
    expect(await screen.findByRole('alert')).toHaveTextContent('Accès refusé')
    expect(screen.getByText(/formations\.xlsx/)).toBeInTheDocument()
    expect(importButton()).toBeEnabled()
  })

  it('affiche l’erreur réseau en bandeau annoncé et permet un nouvel essai', async () => {
    mockImportFormations({ networkError: true })
    renderImport()
    await chooseFile()
    await userEvent.click(importButton())
    expect(await screen.findByRole('alert')).toHaveTextContent(/injoignable/i)
    expect(importButton()).toBeEnabled()
  })
})

describe('FormationImportPage — accessibilité', () => {
  it('n’a aucune violation (page seule)', async () => {
    const { container } = renderImport()
    await screen.findByRole('heading', { level: 1, name: 'Importer des formations' })
    expect(await axe(container)).toHaveNoViolations()
  })

  it('n’a aucune violation avec l’aide ouverte', async () => {
    const { container } = renderImport()
    await userEvent.click(await screen.findByRole('button', { name: /aide/i }))
    await screen.findByRole('table', { name: /colonnes attendues/i })
    expect(await axe(container)).toHaveNoViolations()
  })

  it('n’a aucune violation avec le tableau d’erreurs et la liste des autres entrées', async () => {
    mockImportFormations({
      errorStatus: 400,
      errorMessage: "ligne 3, colonne categorie : \"X\" introuvable | ... et d'autres erreurs (limite de 50 atteinte)",
    })
    const { container } = renderImport()
    await chooseFile()
    await userEvent.click(importButton())
    await screen.findByRole('table', { name: /erreurs du fichier/i })
    expect(await axe(container)).toHaveNoViolations()
  })
})
