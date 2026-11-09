import { Outlet, useNavigation } from "react-router";
import { SiteHeader } from '../components/organisms/Header/Header';
import { SiteFooter } from '../components/organisms/Footer/Footer';
import Logo from '../components/atoms/Logo/Logo';
import styles from "./Layout.module.css"

// Région annoncée aux lecteurs d'écran pendant le téléchargement d'une page : le routeur garde
// l'ancienne page affichée tant que la nouvelle n'est pas arrivée. Présente en permanence, pour que
// l'ajout du texte soit annoncé de façon fiable.
const NavigationStatus = () => {
  const { state } = useNavigation();
  return (
    <div role="status" className={styles.srOnly}>
      {state === "loading" ? "Chargement de la page…" : ""}
    </div>
  );
};

const Layout = () => {
  return (
    <div className={styles.layout}>
        <Logo/>
        <SiteHeader/>
        <NavigationStatus />
        <main>
            <Outlet />
        </main>
        <SiteFooter />
    </div>
  )
}

export default Layout
