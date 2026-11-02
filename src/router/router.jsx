import { createBrowserRouter } from "react-router";
import { lazyPage } from "./lazyPage";
import Root from "./Root";
import RouteError from "./RouteError";
import SessionLoader from "../features/auth/guards/SessionLoader";
import RequireAuth from "../features/auth/guards/RequireAuth";
import RequireRole from "../features/auth/guards/RequireRole";
import PublicOnly from "../features/auth/guards/PublicOnly";
import { MANAGEMENT_ROLES, ROLES } from "../utils/roles";

// Exportées pour pouvoir être testées avec un routeur en mémoire.
export const routes = [
  {
    path: "/",
    element: <Root />,
    // Premier affichage pendant le téléchargement des pages ; erreurs de route (chargement raté, adresse inconnue).
    HydrateFallback: SessionLoader,
    ErrorBoundary: RouteError,
    children: [
      // Publiques : connexion (réservée aux visiteurs), activation, mot de passe oublié.
      {
        element: <PublicOnly />,
        children: [{ path: "login", ...lazyPage(() => import("../components/Pages/LoginPage/LoginPage")) }],
      },
      { path: "activation", ...lazyPage(() => import("../features/auth/pages/ActivationPage")) },
      { path: "mot-de-passe-oublie", ...lazyPage(() => import("../features/auth/pages/ForgotPasswordPage")) },
      { path: "reinitialisation", ...lazyPage(() => import("../features/auth/pages/ResetPasswordPage")) },

      // Tout le reste exige une session (D9).
      {
        element: <RequireAuth />,
        children: [
          { index: true, ...lazyPage(() => import("../components/Pages/Home/HomeRoute")) },
          { path: "formations", ...lazyPage(() => import("../components/Pages/FormationsPage/FormationsPage")) },
          { path: "formations/:formationId", ...lazyPage(() => import("../components/Pages/FormationDetails/FormationDetails")) },
          { path: "plan-du-site", ...lazyPage(() => import("../components/Pages/SiteMapPage/SiteMapPage")) },
          { path: "profile", ...lazyPage(() => import("../components/Pages/Stagiaire/ProfilePage/ProfilePage")) },
          { path: "notifications", ...lazyPage(() => import("../features/notifications/pages/NotificationsPage")) },
          { path: "messages", ...lazyPage(() => import("../components/Pages/Stagiaire/Messages/MessagesPage")) },
          // Cible d'une notification de message (entityId = autre participant, N1) : même coque
          // vide en attendant feature/messagerie, qui la remplacera.
          { path: "messages/:userId", ...lazyPage(() => import("../components/Pages/Stagiaire/Messages/MessagesPage")) },

          // Gestion : chargée de formation et formateurs.
          {
            element: <RequireRole roles={MANAGEMENT_ROLES} />,
            children: [
              { path: "admin/gestion", ...lazyPage(() => import("../components/Pages/ManagementMenu/ManagementMenu")) },
              { path: "admin/formations", ...lazyPage(() => import("../components/Pages/FormationsPage/FormationsPage")) },
              // Comptes : consultation pour les deux rôles de gestion (D54).
              { path: "admin/formateurs", ...lazyPage(() => import("../features/accounts/pages/AccountListPage"), { kind: "formateurs" }) },
              { path: "admin/formateurs/:id", ...lazyPage(() => import("../features/accounts/pages/AccountDetailPage"), { kind: "formateurs" }) },
              { path: "admin/stagiaires", ...lazyPage(() => import("../features/accounts/pages/AccountListPage"), { kind: "stagiaires" }) },
              { path: "admin/stagiaires/:id", ...lazyPage(() => import("../features/accounts/pages/AccountDetailPage"), { kind: "stagiaires" }) },
            ],
          },

          // Création de formation et catégories : chargée de formation seulement.
          {
            element: <RequireRole roles={[ROLES.SUPER_ADMIN]} />,
            children: [
              { path: "formations/creer", ...lazyPage(() => import("../components/Pages/CreateFormationPage/CreateFormationPage")) },
              { path: "formations/categories", ...lazyPage(() => import("../components/Pages/Categories/CategoryManagement")) },
              // Comptes : création et modification (D54). « nouveau » est déclaré avant « :id ».
              { path: "admin/formateurs/nouveau", ...lazyPage(() => import("../features/accounts/pages/AccountFormPage"), { kind: "formateurs" }) },
              { path: "admin/formateurs/:id/modifier", ...lazyPage(() => import("../features/accounts/pages/AccountFormPage"), { kind: "formateurs" }) },
              { path: "admin/stagiaires/nouveau", ...lazyPage(() => import("../features/accounts/pages/AccountFormPage"), { kind: "stagiaires" }) },
              { path: "admin/stagiaires/:id/modifier", ...lazyPage(() => import("../features/accounts/pages/AccountFormPage"), { kind: "stagiaires" }) },
            ],
          },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
