# Spec Delta

## REMOVED Requirements

### Requirement: Emplacement des documents
**Reason**: la section « Documents » n'est plus un emplacement réservé : elle liste, télécharge, dépose et supprime les documents (capacité `formation-documents`, TICKET-027).
**Migration**: voir la capacité `formation-documents` ; le détail d'une formation appelle désormais `GET /documents?formationId=`.
