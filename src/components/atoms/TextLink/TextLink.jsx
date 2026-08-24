import { Link } from "react-router";
import styles from "./TextLink.module.css";

const TextLink = ({
  to,
  children,
  onClick,
}) => {
  return (
    <Link
      to={to}
      className={styles.link}
      onClick={onClick}
    >
      {children}
    </Link>
  );
};

export default TextLink;