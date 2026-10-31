import TileGroup from "../../molecules/TileGroup/TileGroup";
import { PageShell } from "../../../templates/PageShell/PageShell";
import { BookOpen, MonitorCog } from "lucide-react";
import { ROLES } from "../../../utils/roles";

const HomePage = ({ role }) => {
  const isStagiaire = role === ROLES.STAGIAIRE;

  const label = isStagiaire ? "Formations" : "Gestion";
  const icon = isStagiaire ? <BookOpen /> : <MonitorCog />;
  const path = isStagiaire ? "/formations" : "/admin/gestion";

  return (
    <PageShell center>
      <TileGroup label={label} icon={icon} largeTilePath={path} />
    </PageShell>
  );
};

export default HomePage;
