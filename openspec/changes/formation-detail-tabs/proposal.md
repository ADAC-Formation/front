# Proposal

## Why

Le détail d'une formation empile tout dans une seule carte : informations, inscrits (avec leurs fichiers en ligne), documents de la formation, « Mes documents ». Dès quelques inscrits, la page devient longue et la chargée de formation ne voit pas d'un coup d'œil qui a envoyé quoi. Manon a proposé (croquis du 2026-11-23) de garder les informations en haut et de ranger le reste dans des onglets, avec un compte « X/Y documents reçus » par stagiaire.

## What Changes

Côté **front seulement** : aucun changement du back ni de `tech.md`. Les appels restent ceux d'aujourd'hui.

- Bloc d'informations inchangé en haut (catégorie, intitulé, badge « Archivée », description, dates, modalité, formateur, nombre d'inscrits pour la gestion) avec « Modifier » et « Archiver » juste dessous (chargée de formation, formation active).
- Sous ce bloc, une barre d'onglets accessible (motif WAI-ARIA *tabs*, flèches au clavier) :
  - **Chargée de formation et formateur** : « Liste stagiaires » (ouvert par défaut), « Documents stagiaires », « Documents ADAC ».
  - **Stagiaire** : « Documents ADAC » (ouvert par défaut), « Mes documents ».
- **Liste stagiaires** : une ligne par inscrit (nom, e-mail, « X/Y documents reçus »). Y = nombre de types de documents à envoyer pour la formation, X = types pour lesquels ce stagiaire a déposé au moins un fichier (rattachement par nom de fichier, G33). Sans aucun type : « N documents envoyés ». « Inscrire des stagiaires » et « Désinscrire » sont ici (chargée de formation, formation active, J1–J8). La coche « Documents envoyés » et les liens en ligne de G17 disparaissent de cette liste.
- **Documents stagiaires** : un bloc par inscrit avec, pour chaque type, l'état écrit (« Reçu » / « Manquant ») avec une icône, les liens de téléchargement, puis « Autres documents » (fichiers hors créneau).
- **Documents ADAC** : la section « Documents de la formation » d'aujourd'hui (liste, dépôt, suppression), renommée en onglet.
- **Mes documents** : la section du stagiaire d'aujourd'hui (créneaux, dépôt libre), déplacée dans un onglet.
- Nouvelle décision **G34** (documents) : sur la page de la formation, le résumé de G29 est dans « Liste stagiaires » et le détail est dans l'onglet « Documents stagiaires » au lieu d'un dépliant. G29 reste valable pour le profil d'un stagiaire, qui ne change pas.

Hors périmètre : profil d'un stagiaire et section « Documents » du profil (G17/G29 inchangés) ; états « En retard » et « Non applicable » (tranche 2 du catalogue, G25/G28) ; types sensibles (G24) ; onglet dans l'URL (pas de route ni de paramètre) ; tableau de bord du suivi (G26) ; tout changement du back.

Tickets du back : TICKET-024 (détail des formations) et TICKET-027 (documents de la formation), lignes « front ».

## Capabilities

### New Capabilities
- `formation-detail-layout` : organisation du détail d'une formation (bloc d'informations, onglets selon le rôle, accessibilité des onglets).
- `inscrit-documents-progress` : suivi des documents reçus par inscrit sur une formation (compte « X/Y » dans la liste, détail par type dans « Documents stagiaires »).

### Modified Capabilities
- `formation-browsing` : « Stagiaires inscrits » devient l'onglet « Liste stagiaires » avec le compte de documents ; le détail n'affiche plus les inscrits dans une section à part.
- `formation-inscriptions` : « Inscrire des stagiaires » et « Désinscrire » sont proposés dans l'onglet « Liste stagiaires » au lieu de la section « Stagiaires inscrits ».

## Impact

- `src/features/formations/pages/FormationDetailPage.jsx` (découpage en onglets), `FormationPages.module.css`.
- Nouveau composant d'onglets partagé dans `src/components/molecules/Tabs/` (aucun n'existe aujourd'hui).
- `src/features/documents/` : nouveaux composants pour le compte et pour le détail par inscrit, réutilisant `useDocuments`, `useFormationDocumentTypes` et `splitBySlot` ; `SentDocuments` reste utilisé par le profil.
- Appels : un `GET /documents?inscriptionId=` par inscrit (comme aujourd'hui) et un `GET /formations/{id}/document-types`, partagés en cache entre les deux onglets.
- Tests : `FormationDetailPage.test.jsx` (sélecteurs des sections), nouveaux tests du composant d'onglets et des composants de documents, check jest-axe.
- Docs : `docs/decisions/decisions-documents.md` (G34), `docs/dev/etat-front.md`, `CLAUDE.md` si un nouveau mock est requis.
