import { forwardRef } from "react";
import styles from "./IconButton.module.css";

export const IconButton = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <button ref={ref} className={[styles.button, className].filter(Boolean).join(" ")} {...props}>
      {children}
    </button>
  );
});
IconButton.displayName = "IconButton";