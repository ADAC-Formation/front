# Spec Delta

## Purpose

La page « Gestion » passe de Formations, Formateurs, Stagiaires à Formations, Documents, Profils (G32). Les exigences de lisibilité des tuiles de `page-layout` ne changent pas.

## ADDED Requirements

### Requirement: Page Gestion en trois tuiles
Le système SHALL afficher sur `/admin/gestion` trois tuiles : **Formations** (créer une formation, consulter les formations ; « Gérer les catégories » pour la chargée), **Documents** (chargée de formation seulement : « Créer un type de document », « Consulter les types existants »), **Profils**. Le formateur SHALL voir deux tuiles (Formations, Profils) et aucune action de création.

#### Scenario: Chargée de formation
- **WHEN** la chargée ouvre Gestion
- **THEN** elle voit Formations, Documents et Profils ; Profils montre les sections Formateurs et Stagiaires avec leurs deux liens

#### Scenario: Formateur
- **WHEN** un formateur ouvre Gestion
- **THEN** il voit Formations et Profils, sans « Créer… » ni « Gérer les catégories », et aucune tuile Documents

### Requirement: Tuile Profils en deux sections
La tuile **Profils** SHALL regrouper deux sections, « Formateurs » et « Stagiaires », chacune avec « Créer un nouveau profil » (chargée seulement) et « Consulter profils existants », vers `/admin/formateurs[/nouveau]` et `/admin/stagiaires[/nouveau]` (routes inchangées).

#### Scenario: Sections de Profils
- **WHEN** la chargée ouvre Gestion
- **THEN** Profils montre « Formateurs » et « Stagiaires », chacune avec « Créer un nouveau profil » et « Consulter profils existants »

#### Scenario: Libellés lisibles
- **WHEN** Gestion est affichée à 320 px et à 150 % de taille de texte
- **THEN** tous les libellés, y compris ceux des deux sections de « Profils », restent lisibles en entier et la page n'a pas de défilement horizontal
