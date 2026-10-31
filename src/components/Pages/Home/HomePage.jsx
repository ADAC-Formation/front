import TileGroup from "../../molecules/TileGroup/TileGroup";
import style from "./HomePage.module.css";
import { BookOpen, MonitorCog } from "lucide-react";
import { ROLES } from "../../../utils/roles";

const HomePage = ({ role }) => {
  const isStagiaire = role === ROLES.STAGIAIRE;

  const label = isStagiaire ? "Formations" : "Gestion";
  const icon = isStagiaire ? <BookOpen /> : <MonitorCog />;
  const path = isStagiaire ? "/formations" : "/admin/gestion";

  return (
    <div className={style.homePage}>
      <TileGroup label={label} icon={icon} largeTilePath={path} />
    </div>
  );
};

export default HomePage;
