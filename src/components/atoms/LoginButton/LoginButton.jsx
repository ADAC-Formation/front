import { LogIn, LogOut } from "lucide-react";
import { useNavigate } from "react-router";
import { useCurrentUser, useLogout } from "../../../features/auth/hooks";
import styles from "./LoginButton.module.css";

export function LoginButton() {
  const { user, isLoading } = useCurrentUser();
  const { mutate: logout, isPending } = useLogout();
  const navigate = useNavigate();

  // Tant que la session n'est pas connue, on n'affiche pas un état qui pourrait être faux.
  if (isLoading) return null;

  const isAuthenticated = Boolean(user);

  const handleClick = () => {
    if (isAuthenticated) {
      logout();
    } else {
      navigate("/login");
    }
  };

  return (
    <button onClick={handleClick} className={styles.button} disabled={isPending}>
      {isAuthenticated ? <LogOut size={16} /> : <LogIn size={16} />}

      <span className={styles.label}>
        {isAuthenticated ? "Se déconnecter" : "Se connecter"}
      </span>
    </button>
  );
}
