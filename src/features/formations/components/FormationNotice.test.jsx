import { screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import FormationNotice from './FormationNotice'

const renderNotice = (state) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/formations', state }]}>
      <FormationNotice />
    </MemoryRouter>,
  )

describe('FormationNotice', () => {
  it('annonce le nombre de formations importées au pluriel', () => {
    renderNotice({ notice: 'formations-imported', count: 4 })
    expect(screen.getByRole('status')).toHaveTextContent('4 formations importées')
  })

  it('annonce une formation importée au singulier', () => {
    renderNotice({ notice: 'formations-imported', count: 1 })
    expect(screen.getByRole('status')).toHaveTextContent('1 formation importée')
  })

  it('garde les bandeaux existants', () => {
    renderNotice({ notice: 'formation-created' })
    expect(screen.getByRole('status')).toHaveTextContent('Formation créée')
  })

  it('n’affiche rien sans bandeau', () => {
    renderNotice(undefined)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
