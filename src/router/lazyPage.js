import { createElement } from 'react'

// Route chargée à la demande : `load` est un `() => import('…')` dont l'export par défaut est la page.
// `props` (facultatif) est transmis à la page, comme `<Page kind="formateurs" />` avant le découpage.
// Le routeur attend la promesse avant d'afficher la route ; un échec de chargement part vers `errorElement`.
export const lazyPage = (load, props) => ({
  lazy: async () => {
    const { default: Page } = await load()
    return { Component: props ? () => createElement(Page, props) : Page }
  },
})
