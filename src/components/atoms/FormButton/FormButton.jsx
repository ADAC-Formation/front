import styles from "./FormButton.module.css";

const FormButton = ({
  children,
  type = "button",
  onClick,
  disabled = false,
}) => {
  return (
    <button
      className={styles.button}
      type={type}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default FormButton;