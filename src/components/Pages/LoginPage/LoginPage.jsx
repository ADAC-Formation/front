import LoginForm from "../../organisms/LoginForm/LoginForm";
import styles from "./LoginPage.module.css";

const LoginPage = () => {
  const handleLogin = (formData) => {
    console.log(formData);
  };

  return (
    <main className={styles.loginPage}>
      <LoginForm onSubmit={handleLogin} />
    </main>
  );
};

export default LoginPage;