import React from 'react'
import { Outlet } from "react-router";
import { SiteHeader } from '../components/organisms/Header/Header';
import Logo from '../components/atoms/Logo/Logo';
import styles from "./layout.module.css"
import RoleSwitcher from '../components/organisms/RoleSwitcher/RoleSwitcher';

const Layout = () => {
  return (
    <div className={styles.layout}>  
        <RoleSwitcher />
        <Logo/>
        <SiteHeader/>
        <main>
            <Outlet />
        </main>
        
    </div>
  )
}

export default Layout