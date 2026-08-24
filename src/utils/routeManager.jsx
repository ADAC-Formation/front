import { useContext } from "react";
import { Navigate } from "react-router";
import { UserContext } from "../context/User/UserContext";

const routeManager = () => {
  const { user, isLogged, loading } = useContext(UserContext);

  if (loading) return <div>Loading...</div>;

  if (!isLogged) {
    return <Navigate to="/login" replace />;
  }

  switch (user?.role) {
    case "ADMIN":
      return <Navigate to="/admin/proyectos" />;
    case "EMPLOYEE":
      return <Navigate to="/voluntario/proyectos" />;
    case "ONG":
      return <Navigate to="/ongs/proyectos" />;
    default:
      return <Navigate to="/login" />;
  }
};

export default routeManager;