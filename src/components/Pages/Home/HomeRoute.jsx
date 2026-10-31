import HomePage from "./HomePage";
import { useCurrentUser } from "../../../features/auth/hooks";

// Tableau de bord de la route "/" : le rôle vient de GET /auth/me (sous RequireAuth, l'utilisateur existe).
const HomeRoute = () => {
  const { user } = useCurrentUser();

  return <HomePage role={user?.role} />;
};

export default HomeRoute;
