import TileGroup from "../../molecules/TileGroup/TileGroup";
import style from "./HomePage.module.css";
import { BookOpen, MonitorCog } from "lucide-react";

const HomePage = ({ role }) => {
  const isStagiaire = role === "STAGIAIRE";

  const label = isStagiaire ? "Formations" : "Gestion";
  const icon = isStagiaire ? <BookOpen /> : <MonitorCog />;
  const path = isStagiaire ? "/stagiaire/formations" : "/admin/gestion";

  return (
    <div className={style.homePage}>
      <TileGroup label={label} icon={icon} largeTilePath={path} />
    </div>
  );
};

export default HomePage;