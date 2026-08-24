import { useState, useEffect } from "react";
import { UserContext } from "./UserContext";
import UserService from "../../services/UserService";


const UserProvider = ({ children }) => {
  const [isLogged, setIsLogged] = useState(false);
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

    useEffect(() => {
      const savedUser = localStorage.getItem("userData");

      if (savedUser) {
        setUser(JSON.parse(savedUser));
        setIsLogged(true);
      }

      setLoading(false);
    }, []);


  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    setUser(null);
    setIsLogged(false);
  };

  useEffect(() => {
  const savedUser = localStorage.getItem("userData");

  if (savedUser) {
    setUser(JSON.parse(savedUser));
    setIsLogged(true);
  }
}, []);

  const login = async (credentials) => {
    try {
      console.log("Intentando login...");

      const userData = await UserService.login(credentials);

      console.log("FULL RESPONSE:", userData);

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

      localStorage.setItem("userData", JSON.stringify(loggedUser));

      setUser(loggedUser);
      setIsLogged(true);

      return loggedUser;

    } catch (error) {
      console.error("Error en login:", error);
      throw error;
    }
  };

  return (
    <UserContext.Provider
      value={{ isLogged, setIsLogged, login, logout, user, loading}}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;