import { screen } from '@testing-library/react'
import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'react-router'
import { http, HttpResponse } from 'msw'
import { renderWithProviders } from './render'
import { server } from './msw/server'
import apiClient from '../api/Axiosclient'

function Probe() {
  const { pathname } = useLocation()
  const { data } = useQuery({
    queryKey: ['ping'],
    queryFn: async () => (await apiClient.get('/ping')).data,
  })
  return (
    <p>
      {pathname} {data?.message}
    </p>
  )
}

describe('renderWithProviders', () => {
  it('fournit le routeur, TanStack Query et le thème', async () => {
    server.use(http.get('http://localhost:8080/api/ping', () => HttpResponse.json({ message: 'pong' })))
    renderWithProviders(<Probe />, { route: '/formations' })
    expect(await screen.findByText('/formations pong')).toBeInTheDocument()
  })
})
