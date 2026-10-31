import { ROLES, roleLabels, MANAGEMENT_ROLES } from './roles'

describe('roles', () => {
  it('reprend exactement les rôles du back', () => {
    expect(Object.keys(ROLES).sort()).toEqual(['ADMIN', 'STAGIAIRE', 'SUPER_ADMIN'])
  })

  it('affiche les libellés de rôle de D33', () => {
    expect(roleLabels.SUPER_ADMIN).toBe('Chargée de formation')
    expect(roleLabels.ADMIN).toBe('Formateur')
    expect(roleLabels.STAGIAIRE).toBe('Stagiaire')
  })

  it('la gestion est réservée à la chargée de formation et aux formateurs', () => {
    expect(MANAGEMENT_ROLES).toEqual(['SUPER_ADMIN', 'ADMIN'])
  })
})
