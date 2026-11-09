import axios from "axios";
import { ApiError } from "./ApiError";

// Contrat API (back docs/tech.md) : auth par cookie HttpOnly `jwt`.
// Pas d'en-tête Authorization, aucun jeton en JS ni en localStorage.
// VITE_API_URL est injectée au build (voir .env.example).
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// 401 (D12) : le client n'importe pas le routeur. Le futur UserProvider enregistre ici
// un handler qui vide la session et navigue vers /login (« session expirée »),
// sans rechargement dur.
let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

// Routes pour lesquelles un 401 est un résultat normal, pas une session expirée.
const SESSION_EXEMPT_PATHS = ["/auth/login", "/auth/me", "/users/me/password"];

function isSessionExempt(config) {
  const path = config?.url ?? "";
  return SESSION_EXEMPT_PATHS.some((exempt) => path.endsWith(exempt));
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }
    const apiError = ApiError.fromAxios(error);
    if (apiError.status === 401 && !isSessionExempt(error.config)) {
      unauthorizedHandler?.(apiError);
    }
    return Promise.reject(apiError);
  },
);

export default apiClient;
