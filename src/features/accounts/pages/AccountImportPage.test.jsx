import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AccountImportPage from './AccountImportPage'
import { ACCOUNT_IMPORT_COLUMNS } from '../importAccountColumns'
import { downloadAccountTemplate } from '../importAccountTemplate'
import { MAX_IMPORT_BYTES } from '../../formations/importFile'
import { renderWithProviders } from '../../../test/render'
import { mockSession } from '../../../test/session'
import { FORMATEURS, STAGIAIRES, mockImportAccounts } from '../../../test/accounts'

// Import de comptes par fichier Excel (NOTES-09, TICKET-051 du back) : ligne par ligne, le back renvoie
// les comptes créés et les erreurs des lignes refusées.

// La génération du .xlsx est mockée ici (testée dans importAccountTemplate.test.js).
vi.mock('../importAccountTemplate', () => ({ downloadAccountTemplate: vi.fn().mockResolvedValue(undefined) }))

const ROW_ERRORS = [
  { ligne: 3, colonne: 'email', message: 'e-mail déjà utilisé' },
  { ligne: 4, colonne: 'role', message: 'valeur invalide "Directeur" (attendu Formateur ou Stagiaire)' },
]

function renderImport() {
  mockSession('SUPER_ADMIN')
  return renderWithProviders(<AccountImportPage />, { route: '/admin/comptes/importer', withSession: true })
}

const xlsx = (name = 'comptes.xlsx', content = 'contenu') =>
  new File([content], name, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

// `applyAccept: false` : le test doit pouvoir déposer un fichier que l'attribut accept écarterait.
async function chooseFile(file = xlsx()) {
  await userEvent.setup({ applyAccept: false }).upload(await screen.findByLabelText(/fichier excel/i), file)
}

const importButton = () => screen.getByRole('button', { name: 'Importer' })

beforeEach(() => {
  vi.mocked(downloadAccountTemplate).mockClear()
})

describe('AccountImportPage', () => {
  it('présente la page, un retour vers Gestion et un bouton Importer inactif sans fichier', async () => {
    renderImport()
    expect(await screen.findByRole('heading', { level: 1, name: 'Importer des comptes' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Retour' })).toHaveAttribute('href', '/admin/gestion')
    expect(importButton()).toBeDisabled()
  })

  it('décrit les colonnes attendues dans l’aide', async () => {
    renderImport()
    await userEvent.click(await screen.findByRole('button', { name: 'Aide sur le format du fichier' }))
    const table = screen.getByRole('table', { name: 'Colonnes attendues' })
    for (const column of ACCOUNT_IMPORT_COLUMNS) {
      expect(within(table).getByText(column.key)).toBeInTheDocument()
    }
  })

  it('télécharge le modèle', async () => {
    renderImport()
    await userEvent.click(await screen.findByRole('button', { name: 'Télécharger le modèle' }))
    expect(downloadAccountTemplate).toHaveBeenCalledTimes(1)
  })

  it('refuse un fichier qui n’est pas un .xlsx, sans appel', async () => {
    const calls = mockImportAccounts()
    renderImport()
    await chooseFile(xlsx('comptes.csv'))
    expect(screen.getByText('Seuls les fichiers .xlsx sont acceptés.')).toBeInTheDocument()
    expect(importButton()).toBeDisabled()
    expect(calls.count).toBe(0)
  })

  it('refuse un fichier de plus de 2 Mo', async () => {
    renderImport()
    await chooseFile(xlsx('gros.xlsx', 'x'.repeat(MAX_IMPORT_BYTES + 1)))
    expect(screen.getByText('Le fichier dépasse la taille maximale de 2 Mo.')).toBeInTheDocument()
    expect(importButton()).toBeDisabled()
  })

  it('envoie le fichier, annonce les comptes créés et liste les lignes refusées', async () => {
    const calls = mockImportAccounts({ created: [FORMATEURS[0], STAGIAIRES[0]], errors: ROW_ERRORS })
    renderImport()
    await chooseFile()
    await userEvent.click(importButton())

    expect(await screen.findByText('2 comptes créés. Chacun reçoit un e-mail d’activation.')).toBeInTheDocument()
    expect(calls.count).toBe(1)
    expect(calls.contentType).toMatch(/^multipart\/form-data/)
    expect(calls.body).toContain('filename="comptes.xlsx"')

    expect(
      screen.getByText('2 lignes n’ont pas été importées : corrigez-les puis importez-les à nouveau.'),
    ).toBeInTheDocument()
    const table = screen.getByRole('table', { name: 'Lignes non importées' })
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows.map((row) => within(row).getAllByRole('cell').map((cell) => cell.textContent))).toEqual([
      ['3', 'email', 'e-mail déjà utilisé'],
      ['4', 'role', 'valeur invalide "Directeur" (attendu Formateur ou Stagiaire)'],
    ])
  })

  it('n’affiche pas de tableau quand toutes les lignes sont importées', async () => {
    mockImportAccounts({ created: [FORMATEURS[0]] })
    renderImport()
    await chooseFile()
    await userEvent.click(importButton())
    expect(await screen.findByText('1 compte créé. Il reçoit un e-mail d’activation.')).toBeInTheDocument()
    expect(screen.queryByRole('table', { name: 'Lignes non importées' })).not.toBeInTheDocument()
  })

  it('dit clairement qu’aucun compte n’a été créé quand toutes les lignes sont refusées', async () => {
    mockImportAccounts({ errors: [ROW_ERRORS[0]] })
    renderImport()
    await chooseFile()
    await userEvent.click(importButton())
    expect(await screen.findByText('Aucun compte n’a été créé.')).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Lignes non importées' })).toBeInTheDocument()
  })

  it('affiche le refus du fichier entier par le back (400)', async () => {
    mockImportAccounts({ errorStatus: 400, errorMessage: 'Fichier trop volumineux (max 200 lignes)' })
    renderImport()
    await chooseFile()
    await userEvent.click(importButton())
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Le fichier n’a pas été importé : Fichier trop volumineux (max 200 lignes). Aucun compte n’a été créé.',
    )
  })

  it('rend un message du back contenant du HTML en texte', async () => {
    mockImportAccounts({ errors: [{ ligne: 2, colonne: 'nom', message: '<img src=x onerror=alert(1)>' }] })
    const { container } = renderImport()
    await chooseFile()
    await userEvent.click(importButton())
    expect(await screen.findByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
  })

  it('n’a aucune violation jest-axe, résultat affiché', async () => {
    mockImportAccounts({ created: [FORMATEURS[0]], errors: ROW_ERRORS })
    const { container } = renderImport()
    await chooseFile()
    await userEvent.click(importButton())
    await screen.findByRole('table', { name: 'Lignes non importées' })
    expect(await axe(container)).toHaveNoViolations()
  })
})
