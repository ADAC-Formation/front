import React from 'react'
import { Outlet } from "react-router";
import { SiteHeader } from '../components/organisms/Header/Header';
import Logo from '../components/atoms/Logo/Logo';
import RoleSwitcher from '../components/organisms/RoleSwitcher/RoleSwitcher';

const Layout = () => {
  return (
    <>  
        <RoleSwitcher />
        <Logo/>
        <SiteHeader/>
        <main>
            <Outlet />
        </main>
        
    </>
  )
}

export default Layout