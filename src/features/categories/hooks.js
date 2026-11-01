import { useQuery } from '@tanstack/react-query'
import { listCategories } from './api'

export function useCategories({ active = false } = {}) {
  return useQuery({
    queryKey: ['categories', 'list', active ? 'active' : 'all'],
    queryFn: () => listCategories({ active }),
  })
}
