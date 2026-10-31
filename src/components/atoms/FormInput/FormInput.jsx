import styles from "./FormInput.module.css";

// `ref` est une prop ordinaire en React 19 : elle permet à React Hook Form (register) de piloter le champ.
const FormInput = ({
  type = "text",
  placeholder = "",
  required = false,
  ref,
  ...props
}) => {
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
