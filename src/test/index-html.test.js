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

  it('déclare la langue française (WCAG 3.1.1, D15)', () => {
    expect(html).toMatch(/<html[^>]*\slang="fr"/)
  })

  it('ne charge aucune ressource d’un tiers : polices auto-hébergées (D2, D31)', () => {
    expect(html).not.toMatch(/googleapis|gstatic|https?:\/\/(?!localhost)/)
  })

  it('charge les polices du thème depuis les paquets @fontsource (Syne et Plus Jakarta Sans)', () => {
    const fonts = readFileSync(path.join(process.cwd(), 'src/fonts.css'), 'utf8')
    expect(fonts).toContain('@fontsource-variable/syne')
    expect(fonts).toContain('@fontsource-variable/plus-jakarta-sans')
    const index = readFileSync(path.join(process.cwd(), 'src/index.css'), 'utf8')
    expect(index).toMatch(/--font-display:\s*"Syne Variable"/)
    expect(index).toMatch(/--font-sans:\s*"Plus Jakarta Sans Variable"/)
  })
})
