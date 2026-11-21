-- ⚠️  DÉVELOPPEMENT LOCAL UNIQUEMENT — NE JAMAIS EXÉCUTER EN PRODUCTION (D20).
-- Le back ne crée aucun SUPER_ADMIN (les migrations Flyway V1–V5 ne créent aucun utilisateur).
-- Ce script insère des comptes fictifs, tous avec le mot de passe de développement : DevAdmin2026
-- (BCrypt, coût 10). Il est rejouable : un e-mail déjà présent n'est pas modifié.
--
-- Comptes :
--   chargee.dev@adac.test     SUPER_ADMIN  (Chargée de formation) — actif
--   formateur.dev@adac.test   ADMIN        (Formateur)            — actif
--   stagiaire.dev@adac.test   STAGIAIRE    (Stagiaire)            — actif
--   inactif.dev@adac.test     STAGIAIRE    — NON activé (is_active = false) : sert à tester le 403 « Compte non activé »
--
-- Jeu de test élargi (messagerie, listes, filtres) : 4 formateurs et 8 stagiaires ACTIFS en plus, deux formations
-- (une par nouveau formateur) et des inscriptions croisées. Mot de passe identique : DevAdmin2026.
--   formateurs : claire.dev, hugo.dev, nadia.dev, tom.dev (@adac.test)
--   stagiaires : lea.dev, omar.dev, sofia.dev, yanis.dev, ines.dev, karim.dev, manon.dev, paul.dev (@adac.test)

INSERT INTO users (email, password_hash, nom, prenom, role, is_active)
VALUES
  ('chargee.dev@adac.test',   '$2a$10$GNu4YG9mcNUt8C3x0NZ3YO3gcqvxdIrx9Aug.EwvvVtktvWD3raXG', 'Dev', 'Chargée', 'SUPER_ADMIN', TRUE),
  ('formateur.dev@adac.test', '$2a$10$GNu4YG9mcNUt8C3x0NZ3YO3gcqvxdIrx9Aug.EwvvVtktvWD3raXG', 'Dev', 'Formateur', 'ADMIN', TRUE),
  ('stagiaire.dev@adac.test', '$2a$10$GNu4YG9mcNUt8C3x0NZ3YO3gcqvxdIrx9Aug.EwvvVtktvWD3raXG', 'Dev', 'Stagiaire', 'STAGIAIRE', TRUE),
  ('inactif.dev@adac.test',   '$2a$10$GNu4YG9mcNUt8C3x0NZ3YO3gcqvxdIrx9Aug.EwvvVtktvWD3raXG', 'Dev', 'Inactif', 'STAGIAIRE', FALSE)
ON CONFLICT (email) DO NOTHING;

-- Jeu élargi : comptes actifs.
INSERT INTO users (email, password_hash, nom, prenom, role, is_active)
SELECT v.email, '$2a$10$GNu4YG9mcNUt8C3x0NZ3YO3gcqvxdIrx9Aug.EwvvVtktvWD3raXG', v.nom, v.prenom, v.role, TRUE
FROM (VALUES
  ('claire.dev@adac.test', 'Bernard',  'Claire', 'ADMIN'),
  ('hugo.dev@adac.test',   'Lefèvre',  'Hugo',   'ADMIN'),
  ('nadia.dev@adac.test',  'Haddad',   'Nadia',  'ADMIN'),
  ('tom.dev@adac.test',    'Girard',   'Tom',    'ADMIN'),
  ('lea.dev@adac.test',    'Petit',    'Léa',    'STAGIAIRE'),
  ('omar.dev@adac.test',   'Benali',   'Omar',   'STAGIAIRE'),
  ('sofia.dev@adac.test',  'Rossi',    'Sofia',  'STAGIAIRE'),
  ('yanis.dev@adac.test',  'Moreau',   'Yanis',  'STAGIAIRE'),
  ('ines.dev@adac.test',   'Lambert',  'Inès',   'STAGIAIRE'),
  ('karim.dev@adac.test',  'Diallo',   'Karim',  'STAGIAIRE'),
  ('manon.dev@adac.test',  'Roux',     'Manon',  'STAGIAIRE'),
  ('paul.dev@adac.test',   'Fontaine', 'Paul',   'STAGIAIRE')
) AS v(email, nom, prenom, role)
ON CONFLICT (email) DO NOTHING;

-- Deux formations actives, une par nouveau formateur (catégorie : la première existante).
INSERT INTO formations (intitule, description, date_debut, date_fin, modalite, status, formateur_id, created_by, category_id)
SELECT v.intitule, v.description, v.date_debut::date, v.date_fin::date, v.modalite, 'ACTIVE',
       (SELECT id FROM users WHERE email = v.formateur_email),
       (SELECT id FROM users WHERE email = 'chargee.dev@adac.test'),
       (SELECT MIN(id) FROM categories)
FROM (VALUES
  ('Gestion du stress (dev)',            'Jeu de test local.', '2027-01-12', '2027-01-14', 'PRESENTIEL', 'claire.dev@adac.test'),
  ('Communication bienveillante (dev)',  'Jeu de test local.', '2027-02-02', '2027-02-04', 'VISIO',      'hugo.dev@adac.test')
) AS v(intitule, description, date_debut, date_fin, modalite, formateur_email)
WHERE NOT EXISTS (SELECT 1 FROM formations f WHERE f.intitule = v.intitule);

-- Inscriptions croisées (certains stagiaires dans les deux formations, d'autres dans une seule, deux dans aucune).
INSERT INTO inscriptions (stagiaire_id, formation_id)
SELECT (SELECT id FROM users WHERE email = v.stagiaire_email),
       (SELECT id FROM formations WHERE intitule = v.intitule)
FROM (VALUES
  ('lea.dev@adac.test',   'Gestion du stress (dev)'),
  ('omar.dev@adac.test',  'Gestion du stress (dev)'),
  ('sofia.dev@adac.test', 'Gestion du stress (dev)'),
  ('yanis.dev@adac.test', 'Gestion du stress (dev)'),
  ('sofia.dev@adac.test', 'Communication bienveillante (dev)'),
  ('ines.dev@adac.test',  'Communication bienveillante (dev)'),
  ('karim.dev@adac.test', 'Communication bienveillante (dev)'),
  ('stagiaire.dev@adac.test', 'Communication bienveillante (dev)')
) AS v(stagiaire_email, intitule)
ON CONFLICT (stagiaire_id, formation_id) DO NOTHING;

-- Types de document FICTIFS (docs/adac/documents-obligatoires-factices.md, 2026-11-20) : liste inventée par
-- l'équipe, pas fournie par l'ADAC. Jamais une migration, jamais en production. Rejouable : un nom déjà présent
-- (casse ignorée, index uk_document_types_nom_upper) n'est pas modifié. Le catalogue se tient ensuite depuis
-- Gestion > Documents.
-- « Selon la situation » (A3) n'existe pas dans le modèle : ces pièces sont seedées « facultatif ».
-- Les catégories fictives « Secourisme » et « Numérique » n'existent pas dans le back : le certificat médical
-- est lié à « Mieux-être au travail » et la photo à « Spécial BCP » pour avoir des types liés à une catégorie.
INSERT INTO document_types (nom, aide, is_required, is_sensitive, applies_to_all, deadline_days, deadline_anchor, allowed_formats)
VALUES
  ('Pièce d''identité (recto-verso)',   'Carte d''identité ou passeport en cours de validité.',     TRUE,  TRUE,  TRUE,  7,    'BEFORE_START', NULL),
  ('Fiche d''inscription signée',        'Modèle fourni par l''ADAC.',                                 TRUE,  FALSE, TRUE,  7,    'BEFORE_START', 'pdf'),
  ('Justificatif de prise en charge',    'Employeur, OPCO ou autre financeur. Absent si vous financez vous-même.', FALSE, TRUE,  TRUE,  7,    'BEFORE_START', NULL),
  ('Attestation de situation de handicap', 'Pour adapter la formation à vos besoins.',               FALSE, TRUE,  TRUE,  7,    'BEFORE_START', NULL),
  ('CV à jour',                          NULL,                                                        FALSE, FALSE, TRUE,  NULL, NULL,           'pdf,docx'),
  ('Évaluation de la formation à chaud', 'À remplir à la fin de la formation.',                      TRUE,  FALSE, TRUE,  15,   'AFTER_END',    NULL),
  ('Certificat médical d''aptitude',     NULL,                                                        TRUE,  FALSE, FALSE, 7,    'BEFORE_START', 'pdf,jpg,jpeg,png'),
  ('Photo d''identité numérique',        'Pour l''attestation.',                                      FALSE, FALSE, FALSE, NULL, NULL,           'jpg,jpeg,png'),
  ('Liste d''émargement signée',         NULL,                                                        TRUE,  FALSE, FALSE, 0,    'AFTER_END',    NULL),
  ('Courrier d''accord de l''employeur', NULL,                                                        TRUE,  FALSE, FALSE, 7,    'BEFORE_START', NULL)
ON CONFLICT (UPPER(nom)) DO NOTHING;

INSERT INTO document_type_categories (document_type_id, category_id)
SELECT dt.id, c.id
FROM (VALUES
  ('Certificat médical d''aptitude',     'Mieux-être au travail'),
  ('Photo d''identité numérique',        'Spécial BCP'),
  ('Liste d''émargement signée',         'Formation en intra'),
  ('Courrier d''accord de l''employeur', 'Formation en intra')
) AS v(type_nom, category_nom)
JOIN document_types dt ON UPPER(dt.nom) = UPPER(v.type_nom)
JOIN categories c ON c.nom = v.category_nom
ON CONFLICT (document_type_id, category_id) DO NOTHING;
