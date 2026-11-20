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
