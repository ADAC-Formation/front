import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { router } from "./router/router"
import { ThemeProvider } from './context/ThemeProvider'
import { createQueryClient } from './api/queryClient'
import './index.css'

// Ancien sélecteur de rôle simulé (supprimé) : on nettoie la clé qu'il laissait dans le navigateur.
try {
  localStorage.removeItem('dev-role')
} catch {
  // stockage indisponible : sans importance
}

const queryClient = createQueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RouterProvider router={router}/>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
