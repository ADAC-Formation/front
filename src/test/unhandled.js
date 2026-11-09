// Requêtes réseau non déclarées vues depuis le dernier test. `setup.js` les lit après chaque test et le fait
// échouer ; un test qui en provoque une exprès (vérifier qu'un mock refuse un appel) les acquitte ici.
export const unhandledRequests = []

export const acknowledgeUnhandledRequests = () => unhandledRequests.splice(0)
