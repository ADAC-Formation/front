import React from 'react'
import logo from '../../../assets/Logo-Blanc.png'
import style from "./Logo.module.css"

const Logo = () => {
        
    return (
    <img src={logo} alt='Logo' className={style.logo} />
    )

}

export default Logo
