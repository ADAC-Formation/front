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

INSERT INTO users (email, password_hash, nom, prenom, role, is_active)
VALUES
  ('chargee.dev@adac.test',   '$2a$10$GNu4YG9mcNUt8C3x0NZ3YO3gcqvxdIrx9Aug.EwvvVtktvWD3raXG', 'Dev', 'Chargée', 'SUPER_ADMIN', TRUE),
  ('formateur.dev@adac.test', '$2a$10$GNu4YG9mcNUt8C3x0NZ3YO3gcqvxdIrx9Aug.EwvvVtktvWD3raXG', 'Dev', 'Formateur', 'ADMIN', TRUE),
  ('stagiaire.dev@adac.test', '$2a$10$GNu4YG9mcNUt8C3x0NZ3YO3gcqvxdIrx9Aug.EwvvVtktvWD3raXG', 'Dev', 'Stagiaire', 'STAGIAIRE', TRUE),
  ('inactif.dev@adac.test',   '$2a$10$GNu4YG9mcNUt8C3x0NZ3YO3gcqvxdIrx9Aug.EwvvVtktvWD3raXG', 'Dev', 'Inactif', 'STAGIAIRE', FALSE)
ON CONFLICT (email) DO NOTHING;
