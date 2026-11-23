// « Léa » → « lea » : minuscules et accents retirés, pour une recherche sans casse ni accents.
export const normalize = (text) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
