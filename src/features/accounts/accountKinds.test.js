import { ACCOUNT_STATUS, accountStatus, accountStatusLabels } from './accountKinds'

// Le back distingue enfin les deux « inactifs » avec `activated` (Q8.3, tech.md § UserResponse) :
// `isActive: false` + `activated: false` = jamais activé ; `isActive: false` + `activated: true` = suspendu.
describe('accountStatus', () => {
  it('un compte actif est « actif », qu\'il ait ou non le champ activated', () => {
    expect(accountStatus({ isActive: true, activated: true })).toBe(ACCOUNT_STATUS.ACTIVE)
    expect(accountStatus({ isActive: true })).toBe(ACCOUNT_STATUS.ACTIVE)
  })

  it('un compte inactif déjà activé est suspendu', () => {
    expect(accountStatus({ isActive: false, activated: true })).toBe(ACCOUNT_STATUS.SUSPENDED)
  })

  it('un compte inactif jamais activé est « jamais activé »', () => {
    expect(accountStatus({ isActive: false, activated: false })).toBe(ACCOUNT_STATUS.NEVER_ACTIVATED)
  })

  it('un compte inactif sans le champ activated (réponse d\'un ancien back) est suspendu', () => {
    expect(accountStatus({ isActive: false })).toBe(ACCOUNT_STATUS.SUSPENDED)
  })

  it('porte un libellé français par statut', () => {
    expect(accountStatusLabels[ACCOUNT_STATUS.ACTIVE]).toBe('Actif')
    expect(accountStatusLabels[ACCOUNT_STATUS.SUSPENDED]).toBe('Suspendu')
    expect(accountStatusLabels[ACCOUNT_STATUS.NEVER_ACTIVATED]).toBe('Jamais activé')
  })
})
