import { useSyncExternalStore } from 'react'

// Ordinateur : seul cas où l'en-tête est fixé et se replie en bulle (D67). En dessous, il défile avec la page.
export const DESKTOP_QUERY = '(min-width: 1024px)'

// Défilement au-delà duquel les icônes se rassemblent dans la bulle : environ la hauteur de la rangée.
export const COLLAPSE_AFTER_PX = 80

const subscribeToScroll = (onChange) => {
  window.addEventListener('scroll', onChange, { passive: true })
  return () => window.removeEventListener('scroll', onChange)
}

// Booléen plutôt que la position : le composant ne se rend qu'au franchissement du seuil.
const isScrolledPast = () => window.scrollY > COLLAPSE_AFTER_PX

// matchMedia peut manquer (jsdom, très vieux navigateurs) : on se comporte alors comme sur téléphone.
const subscribeToDesktop = (onChange) => {
  const list = window.matchMedia?.(DESKTOP_QUERY)
  list?.addEventListener('change', onChange)
  return () => list?.removeEventListener('change', onChange)
}

const isDesktopNow = () => window.matchMedia?.(DESKTOP_QUERY).matches ?? false

// Vrai quand l'en-tête doit se replier : sur ordinateur, une fois la page défilée.
export function useHeaderCollapse() {
  const isDesktop = useSyncExternalStore(subscribeToDesktop, isDesktopNow)
  const isScrolled = useSyncExternalStore(subscribeToScroll, isScrolledPast)
  return isDesktop && isScrolled
}
