import styles from "./FormInput.module.css";

const FormInput = ({
  type = "text",
  name,
  value,
  onChange,
  placeholder = "",
  required = false,
  ...props
}) => {
  return (
    <input
      className={styles.input}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      {...props}
    />
  );
};

export default FormInput;