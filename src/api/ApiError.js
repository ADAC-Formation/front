// Erreur normalisée de l'API (D12). Format du back (tech.md) : {status, message, details[]}.
// `message` et `details` sont du texte : ne jamais les injecter comme HTML.
export const GENERIC_ERROR_MESSAGE = "Une erreur est survenue. Veuillez réessayer."
export const NETWORK_ERROR_MESSAGE =
  "Le serveur est injoignable. Vérifiez votre connexion et réessayez."

export class ApiError extends Error {
  constructor({ status, message, details = [], isNetworkError = false }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
    this.isNetworkError = isNetworkError
  }

  // Construit une ApiError à partir d'une erreur axios.
  static fromAxios(axiosError) {
    const response = axiosError.response
    if (!response) {
      return new ApiError({ message: NETWORK_ERROR_MESSAGE, isNetworkError: true })
    }
    const body = response.data
    const isStandardBody = body !== null && typeof body === 'object'
    const message =
      isStandardBody && typeof body.message === 'string' && body.message
        ? body.message
        : GENERIC_ERROR_MESSAGE
    const details =
      isStandardBody && Array.isArray(body.details)
        ? body.details.filter((detail) => typeof detail === 'string')
        : []
    return new ApiError({ status: response.status, message, details })
  }
}
