import { useState } from "react";

import FormField from "../../molecules/FormField/FormField";
import FormButton from "../../atoms/FormButton/FormButton";
import TextLink from "../../atoms/TextLink/TextLink";

import styles from "./LoginForm.module.css";

const LoginForm = ({
  onSubmit,
  forgotPasswordPath = "/forgot-password",
}) => {
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit?.(formData);
  };

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
    >
      <FormField
        label="Identifiant"
        name="identifier"
        value={formData.identifier}
        onChange={handleChange}
        required
      />

      <FormField
        label="Mot de passe"
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        required
      />

      <TextLink to={forgotPasswordPath}>
        identifiants oubliés ?
      </TextLink>

      <FormButton type="submit">
        SE CONNECTER
      </FormButton>
    </form>
  );
};

export default LoginForm;