import { http, HttpResponse } from 'msw'

// Gestionnaires MSW par défaut : vides, sauf un seul. Chaque test déclare ses propres gestionnaires
// (server.use) pour rester explicite.
//
// Exception : GET /api/messages répond une liste vide. La tuile « Messages » de l'accueil (pastille
// « non lus ») la demande en arrière-plan à chaque rendu de l'accueil ; sous charge, cette requête
// part parfois après la fin du test qui a affiché l'accueil et ferait échouer le test suivant
// (appel non déclaré). Un test qui vérifie la pastille ou la liste déclare `mockConversations()`.
export const handlers = [
  http.get('http://localhost:8080/api/messages', () => HttpResponse.json([])),
]
