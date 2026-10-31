import { useForm } from "react-hook-form";

import FormField from "../../molecules/FormField/FormField";
import FormButton from "../../atoms/FormButton/FormButton";
import TextLink from "../../atoms/TextLink/TextLink";
import Alert from "../../atoms/Alert/Alert";
import { validateEmail, validateRequired } from "../../../utils/validation";

import styles from "./LoginForm.module.css";

// `error` : ApiError de la dernière tentative (message du back affiché en ligne, D12).
const LoginForm = ({
  onSubmit,
  error = null,
  isSubmitting = false,
  forgotPasswordPath = "/mot-de-passe-oublie",
  activationPath = "/activation",
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { email: "", password: "" } });

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      {error && (
        <Alert variant="error">
          {error.message}
          {error.status === 403 && (
            <>
              {" "}
              <TextLink to={activationPath}>Activer mon compte</TextLink>
            </>
          )}
        </Alert>
      )}

      <FormField
        label="Adresse e-mail"
        type="email"
        autoComplete="username"
        error={errors.email?.message}
        {...register("email", { validate: (value) => validateEmail(value) ?? true })}
      />

      <FormField
        label="Mot de passe"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password", {
          validate: (value) => validateRequired(value, "Le mot de passe") ?? true,
        })}
      />

      <TextLink to={forgotPasswordPath}>
        Mot de passe oublié / Activer mon compte
      </TextLink>

      <FormButton type="submit" disabled={isSubmitting}>
        SE CONNECTER
      </FormButton>

      <p className={styles.noAccount}>
        Pas de compte ? Contactez votre administrateur
      </p>
    </form>
  );
};

export default LoginForm;
