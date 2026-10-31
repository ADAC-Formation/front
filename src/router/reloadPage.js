// Recharge l'application. Isolé dans un module pour pouvoir être remplacé dans les tests (jsdom).
export const reloadPage = () => window.location.reload()
