import { http, HttpResponse } from 'msw'

// Gestionnaires MSW par défaut : vides, sauf deux. Chaque test déclare ses propres gestionnaires
// (server.use) pour rester explicite.
//
// Exception 1 : GET /api/messages répond une liste vide. La tuile « Messages » de l'accueil (pastille
// « non lus ») la demande en arrière-plan à chaque rendu de l'accueil ; sous charge, cette requête
// part parfois après la fin du test qui a affiché l'accueil et ferait échouer le test suivant
// (appel non déclaré). Un test qui vérifie la pastille ou la liste déclare `mockConversations()`.
//
// Exception 2 : GET /api/messages/recipients répond une liste vide. `useRecipients` l'appelle pour le formateur
// et le stagiaire (Q14, H19) chaque fois que le sélecteur de destinataires ou le bouton « Envoyer un message »
// d'un compte est rendu : des dizaines de tests de pages y passent sans s'en préoccuper. Un test qui vérifie la
// chargée de formation trouvée par cet appel déclare `mockRecipients()` (`src/test/messages.js`).
export const handlers = [
  http.get('http://localhost:8080/api/messages', () => HttpResponse.json([])),
  http.get('http://localhost:8080/api/messages/recipients', () => HttpResponse.json([])),
]
