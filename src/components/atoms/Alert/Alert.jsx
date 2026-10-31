import styles from "./Alert.module.css";

// Message annoncé aux technologies d'assistance. `children` est rendu en texte
// (jamais en HTML) : les messages du back ne doivent pas ouvrir de faille XSS.
const Alert = ({ variant = "error", id, children }) => {
  const role = variant === "error" ? "alert" : "status";

  return (
    <p id={id} role={role} className={`${styles.alert} ${styles[variant]}`}>
      {children}
    </p>
  );
};

export default Alert;
