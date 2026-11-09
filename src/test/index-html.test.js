import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const html = readFileSync(path.join(process.cwd(), 'index.html'), 'utf8')

describe('index.html', () => {
  it('pointe l’icône d’onglet vers un fichier qui existe dans public/ (D63)', () => {
    const icon = html.match(/<link[^>]*rel="icon"[^>]*>/)?.[0]
    expect(icon, 'balise <link rel="icon">').toBeDefined()
    const href = icon.match(/href="([^"]+)"/)?.[1]
    expect(href, 'href de l’icône').toBeDefined()
    expect(existsSync(path.join(process.cwd(), 'public', href.replace(/^\//, ''))), `public${href}`).toBe(true)
  })

  it('déclare le type de l’icône conforme à son extension', () => {
    const icon = html.match(/<link[^>]*rel="icon"[^>]*>/)[0]
    const href = icon.match(/href="([^"]+)"/)[1]
    const type = icon.match(/type="([^"]+)"/)?.[1]
    expect(type).toBe(href.endsWith('.png') ? 'image/png' : 'image/svg+xml')
  })
})
