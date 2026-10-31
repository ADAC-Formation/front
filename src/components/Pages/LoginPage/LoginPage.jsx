import LoginForm from "../../organisms/LoginForm/LoginForm";
import { NoticeBanner } from "../../../features/auth/notices";
import { useLogin } from "../../../features/auth/hooks";
import styles from "./LoginPage.module.css";

const LoginPage = () => {
  const { mutate, error, isPending } = useLogin();

  return (
    // <div> et non <main> : le Layout fournit déjà le <main> de la page.
    <div className={styles.loginPage}>
      <div className={styles.content}>
        <h1 className={styles.title}>Connexion</h1>
        <NoticeBanner />
        <LoginForm onSubmit={mutate} error={error} isSubmitting={isPending} />
      </div>
    </div>
  );
};

export default LoginPage;
