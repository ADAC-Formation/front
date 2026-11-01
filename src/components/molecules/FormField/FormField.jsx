import FormInput from "../../atoms/FormInput/FormInput";
import Alert from "../../atoms/Alert/Alert";
import styles from "./FormField.module.css";

// `as` : "input" (défaut), "select" (avec ses <option> en enfants) ou "textarea".
// `...inputProps` (onChange, onBlur, autoComplete, value, defaultValue…) et `ref` sont transmis
// au champ : compatible avec `register` de React Hook Form comme avec un champ contrôlé.
const FormField = ({
  as,
  label,
  type = "text",
  name,
  placeholder,
  required = false,
  error,
  ref,
  ...inputProps
}) => {
  const errorId = `${name}-error`;

  return (
    <div className={styles.field}>
      <label htmlFor={name} className={styles.label}>
        {label}
      </label>

      <FormInput
        as={as}
        id={name}
        ref={ref}
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />

      {error && (
        <Alert variant="error" id={errorId}>
          {error}
        </Alert>
      )}
    </div>
  );
};

export default FormField;
