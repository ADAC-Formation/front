import { Shield, GraduationCap, User } from "lucide-react";

export const roles = {
  ADMIN: {
    label: "Administrateur",
    icon: Shield,
    homePath: "/admin",
  },

  FORMATEUR: {
    label: "Formateur",
    icon: GraduationCap,
    homePath: "/formateur",
  },

  STAGIAIRE: {
    label: "Stagiaire",
    icon: User,
    homePath: "/stagiaire",
  },
};