import { useNavigate } from "react-router";

const roles = [
  { label: "Admin", path: "/admin" },
  { label: "Formateur", path: "/formateur" },
  { label: "Stagiaire", path: "/stagiaire" },
];

const RoleSwitcher = () => {
  const navigate = useNavigate();

  const switchRole = (role) => {
    localStorage.setItem("dev-role", role.label);
    navigate(role.path);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        left: "10px",
        zIndex: 9999,
        display: "flex",
        gap: "5px",
        padding: "5px",
        background: "#222",
        borderRadius: "6px",
      }}
    >
      {roles.map((role) => (
        <button
          key={role.label}
          onClick={() => switchRole(role)}
          style={{
            padding: "6px 10px",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {role.label}
        </button>
      ))}
    </div>
  );
};

export default RoleSwitcher;