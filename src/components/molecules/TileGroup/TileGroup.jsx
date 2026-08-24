import React from 'react'
import Tile from '../../atoms/Tile/Tile'
import { BookOpen, MessageSquare, Bell, User} from "lucide-react";
import style from "./TileGroup.module.css"

const TileGroup = ({label, icon, largeTilePath}) => {
  return (
    <div className={style.group}>

      <div className={style.largeTile}>
        <Tile
        to={largeTilePath}
        size="large"
        color="var(--color-red)"
        icon={icon}
        label={label}
        labelVariant="hero"
        />
      </div>
        
        <Tile
        to="/messages"
        size="small"
        color="var(--color-pink)"
        icon={<MessageSquare />}
        label="Messages"
        />

        <Tile
        to="/notifications"
        size="small"
        color="var(--color-orange)"
        icon={<Bell />}
        label="Notifications"
        />

        <Tile
        to="/profile"
        size="small"
        color="var(--color-yellow)"
        icon={<User />}
        label="Profile"
        />

    </div>
  )
}

export default TileGroup