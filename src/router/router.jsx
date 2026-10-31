import { createBrowserRouter } from "react-router";
import CreateFormationPage from "../components/Pages/CreateFormationPage/CreateFormationPage";
import ProfilePage from "../components/Pages/Stagiaire/ProfilePage/ProfilePage";
import NotifPage from "../components/Pages/Stagiaire/NotifPage/NotifPage";
import MessagesPage from "../components/Pages/Stagiaire/Messages/MessagesPage";
import HomeRoute from "../components/Pages/Home/HomeRoute";
import LoginPage from "../components/Pages/LoginPage/LoginPage";
import ManagementMenu from "../components/Pages/ManagementMenu/ManagementMenu";
import FormationsPage from "../components/Pages/FormationsPage/FormationsPage";
import FormationDetails from "../components/Pages/FormationDetails/FormationDetails";
import CategoryManagement from "../components/Pages/Categories/CategoryManagement";
import Root from "./Root";
import RequireAuth from "../features/auth/guards/RequireAuth";
import RequireRole from "../features/auth/guards/RequireRole";
import PublicOnly from "../features/auth/guards/PublicOnly";
import ActivationPage from "../features/auth/pages/ActivationPage";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "../features/auth/pages/ResetPasswordPage";
import AccountListPage from "../features/accounts/pages/AccountListPage";
import AccountDetailPage from "../features/accounts/pages/AccountDetailPage";
import AccountFormPage from "../features/accounts/pages/AccountFormPage";
import { MANAGEMENT_ROLES, ROLES } from "../utils/roles";

// Exportées pour pouvoir être testées avec un routeur en mémoire.
export const routes = [
  {
    path: "/",
    element: <Root />,
    children: [
      // Publiques : connexion (réservée aux visiteurs), activation, mot de passe oublié.
      {
        element: <PublicOnly />,
        children: [{ path: "login", element: <LoginPage /> }],
      },
      { path: "activation", element: <ActivationPage /> },
      { path: "mot-de-passe-oublie", element: <ForgotPasswordPage /> },
      { path: "reinitialisation", element: <ResetPasswordPage /> },

      // Tout le reste exige une session (D9).
      {
        element: <RequireAuth />,
        children: [
          { index: true, element: <HomeRoute /> },
          { path: "formations", element: <FormationsPage /> },
          { path: "formations/:formationId", element: <FormationDetails /> },
          { path: "profile", element: <ProfilePage /> },
          { path: "notifications", element: <NotifPage /> },
          { path: "messages", element: <MessagesPage /> },

          // Gestion : chargée de formation et formateurs.
          {
            element: <RequireRole roles={MANAGEMENT_ROLES} />,
            children: [
              { path: "admin/gestion", element: <ManagementMenu /> },
              { path: "admin/formations", element: <FormationsPage /> },
              // Comptes : consultation pour les deux rôles de gestion (D54).
              { path: "admin/formateurs", element: <AccountListPage kind="formateurs" /> },
              { path: "admin/formateurs/:id", element: <AccountDetailPage kind="formateurs" /> },
              { path: "admin/stagiaires", element: <AccountListPage kind="stagiaires" /> },
              { path: "admin/stagiaires/:id", element: <AccountDetailPage kind="stagiaires" /> },
            ],
          },

          // Création de formation et catégories : chargée de formation seulement.
          {
            element: <RequireRole roles={[ROLES.SUPER_ADMIN]} />,
            children: [
              { path: "formations/creer", element: <CreateFormationPage /> },
              { path: "formations/categories", element: <CategoryManagement /> },
              // Comptes : création et modification (D54). « nouveau » est déclaré avant « :id ».
              { path: "admin/formateurs/nouveau", element: <AccountFormPage kind="formateurs" /> },
              { path: "admin/formateurs/:id/modifier", element: <AccountFormPage kind="formateurs" /> },
              { path: "admin/stagiaires/nouveau", element: <AccountFormPage kind="stagiaires" /> },
              { path: "admin/stagiaires/:id/modifier", element: <AccountFormPage kind="stagiaires" /> },
            ],
          },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
