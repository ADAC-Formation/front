import { createBrowserRouter } from "react-router";

import ProfilePage from "../components/Pages/Stagiaire/ProfilePage/ProfilePage";
import NotifPage from "../components/Pages/Stagiaire/NotifPage/NotifPage";
import MessagesPage from "../components/Pages/Stagiaire/Messages/MessagesPage";
import HomePage from "../components/Pages/Home/HomePage";
import LoginPage from "../components/Pages/LoginPage/LoginPage";
import ManagementMenu from "../components/Pages/ManagementMenu/ManagementMenu";
import FormationsPage from "../components/Pages/FormationsPage/FormationsPage";
import FormationDetails from "../components/Pages/FormationDetails/FormationDetails";
import Layout from "../Layout/layout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },

      {
        path: "/admin",
        element: <HomePage role="ADMIN" />,
      },

      {
        path: "/admin/gestion",
        element: <ManagementMenu />,
      },
      {
        path: "/admin/formations",
        element: <FormationsPage />,
      },
      {
        path: "/formations/:formationId",
        element: <FormationDetails />,
      },
      {
        path: "/formateur",
        element: <HomePage role="FORMATEUR" />,
      },

      {
        path: "/stagiaire",
        element: <HomePage role="STAGIAIRE" />,
      },

      {
        path: "formations",
        element: <FormationsPage />,
      },

      {
        path: "profile",
        element: <ProfilePage />,
      },

      {
        path: "notifications",
        element: <NotifPage />,
      },

      {
        path: "messages",
        element: <MessagesPage />,
      },
    ],
  },
]);