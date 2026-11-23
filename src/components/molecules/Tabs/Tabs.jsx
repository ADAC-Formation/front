import { useId, useRef, useState } from 'react'
import styles from './Tabs.module.css'

// Onglets au motif WAI-ARIA « tabs » (activation immédiate) : un seul onglet atteignable par Tab,
// ←/→ en boucle, Début/Fin. Tous les panneaux restent montés (les inactifs en `hidden`) : l'état
// d'un panneau (liste ouverte, avis, confirmation) survit à un changement d'onglet.
// `tabs` : [{ id, label, panel }] ; `label` nomme la liste d'onglets.
const Tabs = ({ label, tabs, defaultTabId, className }) => {
  const baseId = useId()
  const [selectedId, setSelectedId] = useState(defaultTabId ?? tabs[0]?.id)
  const tabRefs = useRef(new Map())

  const tabIdOf = (id) => `${baseId}-tab-${id}`
  const panelIdOf = (id) => `${baseId}-panel-${id}`

  const select = (index) => {
    const tab = tabs[(index + tabs.length) % tabs.length]
    setSelectedId(tab.id)
    tabRefs.current.get(tab.id)?.focus()
  }

  const handleKeyDown = (event, index) => {
    const moves = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: tabs.length - 1,
    }
    if (!(event.key in moves)) return
    event.preventDefault()
    select(moves[event.key])
  }

  return (
    <div className={className}>
      <div role="tablist" aria-label={label} className={styles.tablist}>
        {tabs.map((tab, index) => {
          const selected = tab.id === selectedId
          return (
            <button
              key={tab.id}
              ref={(node) => {
                if (node) tabRefs.current.set(tab.id, node)
                else tabRefs.current.delete(tab.id)
              }}
              type="button"
              role="tab"
              id={tabIdOf(tab.id)}
              aria-selected={selected}
              aria-controls={panelIdOf(tab.id)}
              tabIndex={selected ? 0 : -1}
              className={styles.tab}
              onClick={() => setSelectedId(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={panelIdOf(tab.id)}
          aria-labelledby={tabIdOf(tab.id)}
          hidden={tab.id !== selectedId}
          tabIndex={0}
          className={styles.panel}
        >
          {tab.panel}
        </div>
      ))}
    </div>
  )
}

export default Tabs
