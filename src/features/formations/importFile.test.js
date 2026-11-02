import { describe, expect, it } from 'vitest'
import { checkImportFile, MAX_IMPORT_BYTES } from './importFile'

const fileOf = (name, size = 10) => ({ name, size })

describe('checkImportFile', () => {
  it('accepte un fichier .xlsx', () => {
    expect(checkImportFile(fileOf('formations.xlsx'))).toBeNull()
  })

  it('accepte l’extension en majuscules', () => {
    expect(checkImportFile(fileOf('FORMATIONS.XLSX'))).toBeNull()
  })

  it('refuse une autre extension avec un message sur le format', () => {
    expect(checkImportFile(fileOf('formations.csv'))).toMatch(/\.xlsx/)
    expect(checkImportFile(fileOf('formations.xls'))).toMatch(/\.xlsx/)
    expect(checkImportFile(fileOf('formations'))).toMatch(/\.xlsx/)
  })

  it('refuse un nom qui contient .xlsx sans le finir', () => {
    expect(checkImportFile(fileOf('formations.xlsx.txt'))).toMatch(/\.xlsx/)
  })

  it('limite la taille à 2 Mo', () => {
    expect(MAX_IMPORT_BYTES).toBe(2 * 1024 * 1024)
  })

  it('accepte exactement 2 Mo', () => {
    expect(checkImportFile(fileOf('f.xlsx', MAX_IMPORT_BYTES))).toBeNull()
  })

  it('refuse 2 Mo + 1 octet avec un message sur la taille', () => {
    expect(checkImportFile(fileOf('f.xlsx', MAX_IMPORT_BYTES + 1))).toMatch(/2 Mo/)
  })

  it('donne deux messages distincts pour le format et la taille', () => {
    expect(checkImportFile(fileOf('f.csv'))).not.toBe(checkImportFile(fileOf('f.xlsx', MAX_IMPORT_BYTES + 1)))
  })

  it('ne renvoie rien sans fichier', () => {
    expect(checkImportFile(null)).toBeNull()
    expect(checkImportFile(undefined)).toBeNull()
  })
})
