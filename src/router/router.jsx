import { createBrowserRouter } from "react-router";
import Layout from "../Layout/Layout";
import ProfilePage from "../components/Pages/Stagiaire/ProfilePage/ProfilePage";
import NotifPage from "../components/Pages/Stagiaire/NotifPage/NotifPage";
import MessagesPage from "../components/Pages/Stagiaire/Messages/MessagesPage";
import FormationsPage from "../components/Pages/Stagiaire/Formations/FormationsPage";
// import HomePageAdmin from "../components/Pages/Admin/Home/HomePageAdmin";
// import HomePageStagiaire from "../components/Pages/Stagiaire/Home/HomePageStagiaire";
// import HomePageFormateur from "../components/Pages/Formateur/Home/HomePageFormateur";
import HomePage from "../components/Pages/Home/HomePage";
import LoginPage from "../components/Pages/LoginPage/LoginPage";
import ManagementMenu from "../components/Pages/Admin/ManagementMenu/ManagementMenu";

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