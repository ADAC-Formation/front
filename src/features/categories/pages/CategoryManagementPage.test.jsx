import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import CategoryManagementPage from './CategoryManagementPage'
import { renderWithProviders } from '../../../test/render'
import { mockCategories, mockCategoryApi } from '../../../test/categories'

// Faux back à état (test/categories.js) : secours (1, active), numérique (2, active),
// ancienne catégorie (3, désactivée).
let view // dernier rendu : jest-axe contrôle son conteneur (comme les autres pages), pas tout le <body>

const renderPage = (options) => {
  const api = mockCategoryApi(undefined, options)
  view = renderWithProviders(<CategoryManagementPage />, { route: '/formations/categories' })
  return api
}

const row = (name) => screen.getByText(name).closest('li')
const button = (name) => screen.getByRole('button', { name })
const dialog = (name) => screen.getByRole('dialog', { name })

async function renderLoaded(options) {
  const api = renderPage(options)
  await screen.findByText('Secourisme')
  return api
}

describe('CategoryManagementPage — liste', () => {
  it('affiche le titre et un lien Retour vers les formations', async () => {
    await renderLoaded()
    expect(screen.getByRole('heading', { level: 1, name: 'Catégories' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /retour/i })).toHaveAttribute('href', '/formations')
  })

  it('liste toutes les catégories, actives et désactivées, avec leur état écrit', async () => {
    await renderLoaded()
    expect(within(row('Secourisme')).getByText('Active')).toBeInTheDocument()
    expect(within(row('Numérique')).getByText('Active')).toBeInTheDocument()
    expect(within(row('Ancienne catégorie')).getByText('Désactivée')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('annonce le total au pluriel', async () => {
    await renderLoaded()
    expect(screen.getByText('3 catégories')).toBeInTheDocument()
  })

  it('affiche une pastille de la couleur de chaque catégorie, masquée aux lecteurs d’écran', async () => {
    await renderLoaded()
    const dot = within(row('Secourisme')).getByTestId('category-dot')
    expect(dot).toHaveStyle({ backgroundColor: '#D62828' })
    expect(dot).toHaveAttribute('aria-hidden', 'true')
  })

  it('annonce le chargement', () => {
    renderPage()
    expect(screen.getByRole('status')).toHaveTextContent(/chargement/i)
  })

  it('indique qu’il n’y a aucune catégorie', async () => {
    mockCategories([])
    renderWithProviders(<CategoryManagementPage />, { route: '/formations/categories' })
    expect(await screen.findByText(/aucune catégorie/i)).toBeInTheDocument()
  })

  it('affiche l’erreur avec « Réessayer » qui relance l’appel', async () => {
    mockCategories(undefined, { errorStatus: 500 })
    renderWithProviders(<CategoryManagementPage />, { route: '/formations/categories' })
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    mockCategories()
    await userEvent.click(button('Réessayer'))
    expect(await screen.findByText('Secourisme')).toBeInTheDocument()
  })

  it('ne propose aucune suppression', async () => {
    await renderLoaded()
    expect(screen.queryByText(/supprimer/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /supprimer/i })).not.toBeInTheDocument()
  })

  it('donne à chaque bouton le nom de sa catégorie', async () => {
    await renderLoaded()
    expect(button('Modifier Secourisme')).toBeInTheDocument()
    expect(button('Désactiver Secourisme')).toBeInTheDocument()
    expect(button('Réactiver Ancienne catégorie')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Réactiver Secourisme' })).not.toBeInTheDocument()
  })
})

describe('CategoryManagementPage — création', () => {
  it('crée une catégorie, ferme la boîte, la liste et annonce « Catégorie créée »', async () => {
    const api = await renderLoaded()
    await userEvent.click(button('Créer une catégorie'))
    await userEvent.type(screen.getByLabelText('Nom'), '  Gestion du stress ')
    await userEvent.click(within(dialog('Créer une catégorie')).getByRole('button', { name: 'Créer' }))
    expect(await screen.findByText('Gestion du stress')).toBeInTheDocument()
    expect(api.calls.created).toEqual([{ nom: 'Gestion du stress', couleur: '#12427C' }])
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Catégorie créée')
    expect(screen.getByText('4 catégories')).toBeInTheDocument()
  })

  it('refuse un nom vide sans appel', async () => {
    const api = await renderLoaded()
    await userEvent.click(button('Créer une catégorie'))
    await userEvent.click(within(dialog('Créer une catégorie')).getByRole('button', { name: 'Créer' }))
    expect(await screen.findByText('Le nom est obligatoire.')).toBeInTheDocument()
    expect(api.calls.created).toHaveLength(0)
  })

  it('affiche le 409 dans la boîte, qui reste ouverte avec la saisie', async () => {
    const api = await renderLoaded({ errors: { create: { status: 409, message: 'Cette catégorie existe déjà' } } })
    await userEvent.click(button('Créer une catégorie'))
    await userEvent.type(screen.getByLabelText('Nom'), 'Secourisme')
    await userEvent.click(within(dialog('Créer une catégorie')).getByRole('button', { name: 'Créer' }))
    expect(await within(dialog('Créer une catégorie')).findByText('Cette catégorie existe déjà')).toBeInTheDocument()
    expect(screen.getByLabelText('Nom')).toHaveValue('Secourisme')
    expect(api.calls.created).toHaveLength(1)
    expect(within(dialog('Créer une catégorie')).getByRole('button', { name: 'Créer' })).toBeEnabled()
  })

  it('annonce l’erreur réseau dans la boîte, qui reste ouverte', async () => {
    await renderLoaded({ errors: { create: 'network' } })
    await userEvent.click(button('Créer une catégorie'))
    await userEvent.type(screen.getByLabelText('Nom'), 'Nouvelle')
    await userEvent.click(within(dialog('Créer une catégorie')).getByRole('button', { name: 'Créer' }))
    expect(await within(dialog('Créer une catégorie')).findByText(/injoignable/i)).toBeInTheDocument()
  })

  it('annule sans appel et rend le focus au bouton « Créer une catégorie »', async () => {
    const api = await renderLoaded()
    await userEvent.click(button('Créer une catégorie'))
    await userEvent.click(within(dialog('Créer une catégorie')).getByRole('button', { name: 'Annuler' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(api.calls.created).toHaveLength(0)
    expect(button('Créer une catégorie')).toHaveFocus()
  })

  it('efface l’erreur du back quand on rouvre la boîte', async () => {
    await renderLoaded({ errors: { create: { status: 409, message: 'Cette catégorie existe déjà' } } })
    await userEvent.click(button('Créer une catégorie'))
    await userEvent.type(screen.getByLabelText('Nom'), 'Secourisme')
    await userEvent.click(within(dialog('Créer une catégorie')).getByRole('button', { name: 'Créer' }))
    await screen.findByText('Cette catégorie existe déjà')
    await userEvent.click(within(dialog('Créer une catégorie')).getByRole('button', { name: 'Annuler' }))
    await userEvent.click(button('Créer une catégorie'))
    expect(screen.queryByText('Cette catégorie existe déjà')).not.toBeInTheDocument()
  })
})

describe('CategoryManagementPage — modification', () => {
  it('modifie le nom : PUT avec les deux champs, liste à jour, « Catégorie mise à jour »', async () => {
    const api = await renderLoaded()
    await userEvent.click(button('Modifier Secourisme'))
    const box = dialog('Modifier la catégorie')
    expect(within(box).getByLabelText('Nom')).toHaveValue('Secourisme')
    expect(within(box).getByLabelText('Couleur (hexadécimal)')).toHaveValue('#D62828')
    await userEvent.clear(within(box).getByLabelText('Nom'))
    await userEvent.type(within(box).getByLabelText('Nom'), 'Secours')
    await userEvent.click(within(box).getByRole('button', { name: 'Enregistrer' }))
    expect(await screen.findByText('Secours')).toBeInTheDocument()
    expect(api.calls.updated).toEqual([{ id: 1, nom: 'Secours', couleur: '#D62828' }])
    expect(screen.queryByText('Secourisme')).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Catégorie mise à jour')
  })

  it('modifie la couleur', async () => {
    const api = await renderLoaded()
    await userEvent.click(button('Modifier Numérique'))
    const hex = screen.getByLabelText('Couleur (hexadécimal)')
    await userEvent.clear(hex)
    await userEvent.type(hex, '#00ff00')
    await userEvent.click(within(dialog('Modifier la catégorie')).getByRole('button', { name: 'Enregistrer' }))
    await waitFor(() => expect(api.calls.updated).toHaveLength(1))
    expect(api.calls.updated[0]).toEqual({ id: 2, nom: 'Numérique', couleur: '#00FF00' })
    await waitFor(() => expect(within(row('Numérique')).getByTestId('category-dot')).toHaveStyle({ backgroundColor: '#00FF00' }))
  })

  it('permet de modifier une catégorie désactivée', async () => {
    await renderLoaded()
    await userEvent.click(button('Modifier Ancienne catégorie'))
    expect(screen.getByLabelText('Nom')).toHaveValue('Ancienne catégorie')
  })

  it('ferme la boîte sans appel quand rien n’a changé', async () => {
    const api = await renderLoaded()
    await userEvent.click(button('Modifier Secourisme'))
    await userEvent.click(within(dialog('Modifier la catégorie')).getByRole('button', { name: 'Enregistrer' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(api.calls.updated).toHaveLength(0)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('affiche le 409 dans la boîte, qui reste ouverte', async () => {
    await renderLoaded({ errors: { update: { status: 409, message: 'Nom déjà utilisé' } } })
    await userEvent.click(button('Modifier Secourisme'))
    await userEvent.clear(screen.getByLabelText('Nom'))
    await userEvent.type(screen.getByLabelText('Nom'), 'Numérique')
    await userEvent.click(within(dialog('Modifier la catégorie')).getByRole('button', { name: 'Enregistrer' }))
    expect(await within(dialog('Modifier la catégorie')).findByText('Nom déjà utilisé')).toBeInTheDocument()
    expect(screen.getByLabelText('Nom')).toHaveValue('Numérique')
  })

  it('annonce le 404 dans la boîte et recharge la liste', async () => {
    const api = await renderLoaded({ errors: { update: { status: 404, message: 'Catégorie introuvable' } } })
    const listCallsBefore = api.calls.list
    await userEvent.click(button('Modifier Secourisme'))
    await userEvent.clear(screen.getByLabelText('Nom'))
    await userEvent.type(screen.getByLabelText('Nom'), 'Secours')
    await userEvent.click(within(dialog('Modifier la catégorie')).getByRole('button', { name: 'Enregistrer' }))
    expect(await within(dialog('Modifier la catégorie')).findByText('Catégorie introuvable')).toBeInTheDocument()
    await waitFor(() => expect(api.calls.list).toBeGreaterThan(listCallsBefore))
  })

  it('rend le focus au bouton « Modifier » d’origine à la fermeture', async () => {
    await renderLoaded()
    await userEvent.click(button('Modifier Secourisme'))
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(button('Modifier Secourisme')).toHaveFocus()
  })
})

describe('CategoryManagementPage — désactivation', () => {
  it('demande confirmation en nommant la catégorie et en expliquant l’effet', async () => {
    await renderLoaded()
    await userEvent.click(button('Désactiver Secourisme'))
    const box = screen.getByRole('dialog', { name: /secourisme/i })
    expect(box).toHaveTextContent(/n.apparaîtra plus dans le choix de catégorie/i)
    expect(box).toHaveTextContent(/formations qui la portent déjà/i)
  })

  it('désactive après confirmation : PATCH, état « Désactivée », « Catégorie désactivée »', async () => {
    const api = await renderLoaded()
    await userEvent.click(button('Désactiver Secourisme'))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Désactiver' }))
    await waitFor(() => expect(within(row('Secourisme')).getByText('Désactivée')).toBeInTheDocument())
    expect(api.calls.deactivated).toEqual([1])
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Catégorie désactivée')
    expect(button('Réactiver Secourisme')).toBeInTheDocument()
  })

  it('n’appelle rien quand on annule', async () => {
    const api = await renderLoaded()
    await userEvent.click(button('Désactiver Secourisme'))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Annuler' }))
    expect(api.calls.deactivated).toHaveLength(0)
    expect(within(row('Secourisme')).getByText('Active')).toBeInTheDocument()
  })

  it('n’appelle rien avec Échap', async () => {
    const api = await renderLoaded()
    await userEvent.click(button('Désactiver Secourisme'))
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(api.calls.deactivated).toHaveLength(0)
  })

  it('annonce l’échec sur la page et ferme la confirmation', async () => {
    await renderLoaded({ errors: { deactivate: { status: 500, message: 'Erreur serveur' } } })
    await userEvent.click(button('Désactiver Secourisme'))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Désactiver' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Erreur serveur')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(within(row('Secourisme')).getByText('Active')).toBeInTheDocument()
  })
})

describe('CategoryManagementPage — réactivation', () => {
  it('réactive immédiatement : PATCH, état « Active », « Catégorie réactivée »', async () => {
    const api = await renderLoaded()
    await userEvent.click(button('Réactiver Ancienne catégorie'))
    await waitFor(() => expect(within(row('Ancienne catégorie')).getByText('Active')).toBeInTheDocument())
    expect(api.calls.activated).toEqual([3])
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Catégorie réactivée')
  })

  it('annonce l’échec sur la page sans changer l’état', async () => {
    await renderLoaded({ errors: { activate: { status: 500, message: 'Erreur serveur' } } })
    await userEvent.click(button('Réactiver Ancienne catégorie'))
    expect(await screen.findByRole('alert')).toHaveTextContent('Erreur serveur')
    expect(within(row('Ancienne catégorie')).getByText('Désactivée')).toBeInTheDocument()
  })

  it('remplace le message de succès précédent par le nouveau', async () => {
    await renderLoaded()
    await userEvent.click(button('Réactiver Ancienne catégorie'))
    await screen.findByText('Catégorie réactivée')
    await userEvent.click(button('Modifier Secourisme'))
    await userEvent.click(within(dialog('Modifier la catégorie')).getByRole('button', { name: 'Annuler' }))
    await userEvent.click(button('Désactiver Numérique'))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Désactiver' }))
    await screen.findByText('Catégorie désactivée')
    expect(screen.queryByText('Catégorie réactivée')).not.toBeInTheDocument()
  })
})

describe('CategoryManagementPage — accessibilité', () => {
  it('n’a aucune violation (page seule)', async () => {
    await renderLoaded()
    expect(await axe(view.container)).toHaveNoViolations()
  })

  it('n’a aucune violation avec la boîte de création ouverte', async () => {
    await renderLoaded()
    await userEvent.click(button('Créer une catégorie'))
    expect(await axe(view.container)).toHaveNoViolations()
  })

  it('n’a aucune violation avec une erreur de champ affichée', async () => {
    await renderLoaded()
    await userEvent.click(button('Créer une catégorie'))
    await userEvent.click(within(dialog('Créer une catégorie')).getByRole('button', { name: 'Créer' }))
    await screen.findByText('Le nom est obligatoire.')
    expect(await axe(view.container)).toHaveNoViolations()
  })

  it('n’a aucune violation avec la confirmation de désactivation ouverte', async () => {
    await renderLoaded()
    await userEvent.click(button('Désactiver Secourisme'))
    expect(await axe(view.container)).toHaveNoViolations()
  })
})
