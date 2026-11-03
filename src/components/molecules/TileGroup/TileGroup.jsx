import Tile from '../../atoms/Tile/Tile'
import { MessageSquare, Bell, User} from "lucide-react";
import { useUnreadCount } from "../../../features/messagerie/hooks";
import { unreadLabel } from "../../../features/messagerie/unread";
import style from "./TileGroup.module.css"

const TileGroup = ({label, icon, largeTilePath}) => {
  const unread = useUnreadCount()

  return (
    <div className={style.host}>
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
        badge={unread}
        badgeLabel={unreadLabel(unread)}
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
    </div>
  )
}

export default TileGroup