import { useEffect, useState } from 'react'
import { MessageSquareWarning } from 'lucide-react'
import { IconButton } from '../../../components/atoms/IconButton/IconButton'
import { ROLES } from '../../../utils/roles'
import { useCurrentUser } from '../../auth/hooks'
import FeedbackDialog from './FeedbackDialog'
import styles from './FeedbackButton.module.css'

// Rôles qui peuvent envoyer un retour (U1) ; le back l'impose aussi (403 pour un stagiaire).
const ALLOWED_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN]
const THANKS = 'Merci, votre retour a bien été envoyé.'
const THANKS_DURATION_MS = 6000

// Bouton « Envoyer un retour » de l'en-tête (D-1) : rien tant que la session n'est pas connue,
// ni pour un stagiaire ou un visiteur. La région `role="status"` vit ici, pas dans la boîte, pour
// que le remerciement survive à sa fermeture ; le focus revient au bouton (useModalFocus).
export function FeedbackButton() {
  const { user } = useCurrentUser()
  const [isOpen, setIsOpen] = useState(false)
  const [thanks, setThanks] = useState('')

  useEffect(() => {
    if (!thanks) return undefined
    const timer = setTimeout(() => setThanks(''), THANKS_DURATION_MS)
    return () => clearTimeout(timer)
  }, [thanks])

  if (!user || !ALLOWED_ROLES.includes(user.role)) return null

  const handleSent = () => {
    setIsOpen(false)
    setThanks(THANKS)
  }

  return (
    <div className={styles.wrapper}>
      <IconButton type="button" aria-label="Envoyer un retour" aria-haspopup="dialog" onClick={() => setIsOpen(true)}>
        <MessageSquareWarning aria-hidden="true" />
      </IconButton>
      <p role="status" className={thanks ? styles.thanks : styles.empty}>
        {thanks}
      </p>
      {isOpen && <FeedbackDialog onSent={handleSent} onCancel={() => setIsOpen(false)} />}
    </div>
  )
}
