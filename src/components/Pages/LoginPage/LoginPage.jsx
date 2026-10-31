import LoginForm from "../../organisms/LoginForm/LoginForm";
import { NoticeBanner } from "../../../features/auth/notices";
import { useLogin } from "../../../features/auth/hooks";
import { PageShell } from "../../../templates/PageShell/PageShell";
import styles from "./LoginPage.module.css";

const LoginPage = () => {
  const { mutate, error, isPending } = useLogin();

  return (
    <PageShell center>
      <div className={styles.content}>
        <h1 className={styles.title}>Connexion</h1>
        <NoticeBanner />
        <LoginForm onSubmit={mutate} error={error} isSubmitting={isPending} />
      </div>
    </PageShell>
  );
};

export default LoginPage;
