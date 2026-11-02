import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCategory, listCategories, setCategoryActive, updateCategory } from './api'

export function useCategories({ active = false } = {}) {
  return useQuery({
    queryKey: ['categories', 'list', active ? 'active' : 'all'],
    queryFn: () => listCategories({ active }),
  })
}

// Après une écriture, tout ce qui montre une catégorie est rechargé depuis le back (jamais d'état
// optimiste) : les deux listes de catégories (`['categories']`) et les formations (`['formations']`),
// qui embarquent leur catégorie : nom et couleur changent partout.
function useRefreshCategories() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['categories'] }),
      queryClient.invalidateQueries({ queryKey: ['formations'] }),
    ])
}

export function useCreateCategory() {
  const refresh = useRefreshCategories()
  return useMutation({ mutationFn: createCategory, onSuccess: refresh })
}

export function useUpdateCategory(id) {
  const refresh = useRefreshCategories()
  return useMutation({ mutationFn: (body) => updateCategory(id, body), onSuccess: refresh })
}

export function useSetCategoryActive() {
  const refresh = useRefreshCategories()
  return useMutation({ mutationFn: ({ id, active }) => setCategoryActive(id, active), onSuccess: refresh })
}
