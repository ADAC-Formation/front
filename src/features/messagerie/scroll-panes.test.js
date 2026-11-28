// NOTES-19 : en deux volets, la liste des conversations défile seule, à la même hauteur que le fil.
import { describe, expect, it } from 'vitest'
import { cssSheets, stripComments } from '../../test/css-sheets'

const css = (file) => stripComments(cssSheets[`src/features/messagerie/${file}`])
const declarations = (body) => Object.fromEntries([...body.matchAll(/([\w-]+)\s*:\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()]))

// Corps de `.list` dans la requête de conteneur des deux volets (48rem, comme MessagesPage).
const listInTwoPanes = () => {
  const block = css('components/ConversationList.module.css').match(/@container\s*\(min-width:\s*48rem\)\s*\{([\s\S]*?)\n\}/)?.[1]
  return block?.match(/\.list\s*\{([^}]*)\}/)?.[1]
}

describe('Liste des conversations en deux volets', () => {
  it('défile seule (overflow-y: auto)', () => {
    expect(declarations(listInTwoPanes() ?? '')['overflow-y']).toBe('auto')
  })

  it('a la même hauteur maximale que le fil', () => {
    const thread = css('components/Thread.module.css').match(/\.list\s*\{([^}]*)\}/)[1]
    expect(declarations(listInTwoPanes() ?? '')['max-height']).toBe(declarations(thread)['max-height'])
  })

  it('ne limite pas la hauteur hors des deux volets (mobile : la page défile)', () => {
    const outside = css('components/ConversationList.module.css').replace(/@container[\s\S]*?\n\}/g, '')
    const list = outside.match(/\.list\s*\{([^}]*)\}/)[1]
    expect(declarations(list)['max-height']).toBeUndefined()
  })
})

// NOTES-18 : les destinataires de « Nouvelle conversation » défilent dans le panneau, à toutes les largeurs (H23).
describe('Liste des destinataires de la nouvelle conversation', () => {
  const recipientList = () => declarations(css('components/NewConversation.module.css').match(/\.list\s*\{([^}]*)\}/)[1])

  it('défile seule (overflow-y: auto)', () => {
    expect(recipientList()['overflow-y']).toBe('auto')
  })

  it('a la même hauteur maximale que le fil, sans requête de conteneur', () => {
    const thread = css('components/Thread.module.css').match(/\.list\s*\{([^}]*)\}/)[1]
    expect(recipientList()['max-height']).toBe(declarations(thread)['max-height'])
  })
})
