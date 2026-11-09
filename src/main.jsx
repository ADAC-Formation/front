import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { router } from "./router/router"
import { ThemeProvider } from './context/ThemeProvider'
import { createQueryClient } from './api/queryClient'
import { prefetchSession } from './features/auth/hooks'
import './index.css'
import { applyDesignVariant } from './design/designVariant'

// Ancien sélecteur de rôle simulé (supprimé) : on nettoie la clé qu'il laissait dans le navigateur.
try {
  localStorage.removeItem('dev-role')
} catch {
  // stockage indisponible : sans importance
}

// Design alternatif « site de l'ADAC » : seulement avec ?design=site (réunions de comparaison).
applyDesignVariant()

const queryClient = createQueryClient()
// La session part en parallèle du chargement de la page (pas d'attente : les gardes lisent le cache).
prefetchSession(queryClient)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RouterProvider router={router}/>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
