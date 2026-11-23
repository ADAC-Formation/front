import ConfirmDialog from '../../../components/molecules/ConfirmDialog/ConfirmDialog'
import { useDocuments } from '../../documents/hooks'
import { useUnenrollStagiaire } from '../hooks'
import { unenrollTitle, unenrollWarning } from '../inscriptionOutcome'

// Confirmation de « Désinscrire » (J6) : nomme le stagiaire et la formation et annonce la suppression
// définitive de ses documents sur cette formation. Leur nombre est lu dans le cache seulement (la page
// les a déjà chargés, ex. `SentDocuments`) : `enabled: false`, aucun appel de plus ; inconnu, la phrase
// reste générale. Une erreur du back reste affichée dans la boîte ; `onClose` après succès ou annulation.
const UnenrollDialog = ({ formation, stagiaire, inscriptionId, onClose }) => {
  const unenroll = useUnenrollStagiaire()
  const { data: documents } = useDocuments({ inscriptionId }, { enabled: false })

  const confirm = () => {
    unenroll.reset()
    unenroll.mutate({ formationId: formation.id, stagiaireId: stagiaire.id }, { onSuccess: onClose })
  }

  return (
    <ConfirmDialog
      title={unenrollTitle(`${stagiaire.prenom} ${stagiaire.nom}`, formation.intitule)}
      confirmLabel="Désinscrire"
      onConfirm={confirm}
      onCancel={onClose}
      disabled={unenroll.isPending}
      error={unenroll.error?.message}
    >
      {unenrollWarning(documents?.length)}
    </ConfirmDialog>
  )
}

export default UnenrollDialog
