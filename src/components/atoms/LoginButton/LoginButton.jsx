import { LogIn, LogOut } from "lucide-react";
import { useNavigate } from "react-router";
import { useThemeContext } from "../../../context/ThemeProvider";
import styles from "./LoginButton.module.css";

export function LoginButton() {
  const { isAuthenticated, toggleAuth } = useThemeContext();
  const navigate = useNavigate();

  const handleClick = () => {
    if (isAuthenticated) {
      toggleAuth();
    } else {
      navigate("/login");
    }
  };

  return (
    <button onClick={handleClick} className={styles.button}>
      {isAuthenticated ? <LogOut size={16} /> : <LogIn size={16} />}

      <span className={styles.label}>
        {isAuthenticated ? "Se déconnecter" : "Se connecter"}
      </span>
    </button>
  );
}