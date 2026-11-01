import styles from "./FormInput.module.css";

// Champ de saisie : `<input>` par défaut, ou `<select>` / `<textarea>` via `as`. Les `children`
// d'un `<select>` sont ses `<option>`. `ref` est une prop ordinaire en React 19 : elle permet à
// React Hook Form (register) de piloter le champ.
const FormInput = ({
  as = "input",
  type = "text",
  placeholder = "",
  required = false,
  ref,
  children,
  ...props
}) => {
  if (as === "select") {
    return (
      <select ref={ref} className={styles.input} required={required} {...props}>
        {children}
      </select>
    );
  }

  if (as === "textarea") {
    return (
      <textarea
        ref={ref}
        className={`${styles.input} ${styles.textarea}`}
        placeholder={placeholder}
        required={required}
        {...props}
      />
    );
  }

  return (
    <input
      ref={ref}
      className={styles.input}
      type={type}
      placeholder={placeholder}
      required={required}
      {...props}
    />
  );
};

export default FormInput;
