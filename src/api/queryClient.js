import { QueryClient } from '@tanstack/react-query'

// Erreurs d'autorisation / de ressource : réessayer ne change rien (D12).
const NO_RETRY_STATUSES = [401, 403, 404]
const MAX_RETRIES = 1

function shouldRetry(failureCount, error) {
  if (NO_RETRY_STATUSES.includes(error?.status)) return false
  return failureCount < MAX_RETRIES
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: shouldRetry } },
  })
}
