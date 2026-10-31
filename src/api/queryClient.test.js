import { createQueryClient } from './queryClient'
import { ApiError } from './ApiError'

describe('queryClient', () => {
  const retry = createQueryClient().getDefaultOptions().queries.retry

  it.each([401, 403, 404])('ne réessaie pas après une erreur %i', (status) => {
    expect(retry(0, new ApiError({ status, message: 'x' }))).toBe(false)
  })

  it('réessaie une fois une erreur serveur, puis abandonne', () => {
    const error = new ApiError({ status: 500, message: 'x' })
    expect(retry(0, error)).toBe(true)
    expect(retry(1, error)).toBe(false)
  })
})
