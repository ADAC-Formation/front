import { Outlet } from "react-router";
import { SiteHeader } from '../components/organisms/Header/Header';
import Logo from '../components/atoms/Logo/Logo';
import styles from "./Layout.module.css"

const Layout = () => {
  return (
    <div className={styles.layout}>
        <Logo/>
        <SiteHeader/>
        <main>
            <Outlet />
        </main>
    </div>
  )
}

export default Layout
