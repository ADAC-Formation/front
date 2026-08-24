import { useContext } from "react";
import { Navigate, Outlet } from "react-router";
import { UserContext } from "../context/User/UserContext";

const ProtectedRoute = ({ allowedRoles }) => {
  const { isLogged, user } = useContext(UserContext);

  if (!isLogged) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;