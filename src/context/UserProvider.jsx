import { useState } from "react";
import { UserContext } from "./UserContext";
import UserService from "../../services/UserService";

// TODO (change « auth ») : à remplacer par un UserProvider basé sur GET /auth/me.
// Reste d'un autre projet, non monté. Aucune donnée personnelle dans le stockage
// du navigateur (D31) : la session vit uniquement dans le cookie HttpOnly du back.
const UserProvider = ({ children }) => {
  const [isLogged, setIsLogged] = useState(false);
  const [user, setUser] = useState(null);
  const loading = false;

  const logout = () => {
    setUser(null);
    setIsLogged(false);
  };

  const login = async (credentials) => {
    const userData = await UserService.login(credentials);

    if (!userData || !userData.profileData) {
      throw new Error("Respuesta del servidor inválida");
    }

    const loggedUser = {
      role: userData.role,
      name:
        userData.role === "ONG"
          ? userData.profileData?.organizationName
          : userData.profileData?.firstName,
    };

    setUser(loggedUser);
    setIsLogged(true);

    return loggedUser;
  };

  return (
    <UserContext.Provider
      value={{ isLogged, setIsLogged, login, logout, user, loading }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
