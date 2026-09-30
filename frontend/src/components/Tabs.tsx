import type { ReactNode } from 'react'
import { useRef, useState } from 'react'
import '@/styles/components/Tabs.css'

interface TabItem {
  id: string
  label: string
  count?: number
  disabled?: boolean
}

interface TabsProps {
  /** Lista de pestañas */
  tabs: TabItem[]
  /** Pestaña activa controlada */
  activeTab?: string
  /** Pestaña activa no controlada (default) */
  defaultActiveTab?: string
  /** Callback al cambiar pestaña */
  onChange?: (tabId: string) => void
  /** Label para aria-label del tablist */
  ariaLabel: string
  /** Clase CSS adicional */
  className?: string
}

/**
 * Tabs — Componente de pestañas accesible con ARIA roles.
 * Soporta modo controlado y no controlado.
 */
export default function Tabs({
  tabs,
  activeTab: controlledActiveTab,
  defaultActiveTab,
  onChange,
  ariaLabel,
  className = '',
}: TabsProps) {
  const isControlled = controlledActiveTab !== undefined
  const [uncontrolledActiveTab, setUncontrolledActiveTab] = useState(defaultActiveTab || tabs[0]?.id || '')
  const activeTab = isControlled ? controlledActiveTab : uncontrolledActiveTab
  const tabRefs = useRef(new Map<string, HTMLButtonElement>())

  const handleTabClick = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId)
    if (tab?.disabled) return
    if (!isControlled) setUncontrolledActiveTab(tabId)
    onChange?.(tabId)
  }

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    const enabledTabs = tabs.map((tab, index) => ({ tab, index })).filter(({ tab }) => !tab.disabled)
    if (enabledTabs.length === 0) return

    const currentEnabledIndex = enabledTabs.findIndex(({ index }) => index === currentIndex)
    let targetIndex: number | undefined
    if (event.key === 'ArrowRight') targetIndex = (currentEnabledIndex + 1) % enabledTabs.length
    else if (event.key === 'ArrowLeft') targetIndex = (currentEnabledIndex - 1 + enabledTabs.length) % enabledTabs.length
    else if (event.key === 'Home') targetIndex = 0
    else if (event.key === 'End') targetIndex = enabledTabs.length - 1
    else return

    event.preventDefault()
    const nextTab = enabledTabs[targetIndex].tab
    tabRefs.current.get(nextTab.id)?.focus()
    handleTabClick(nextTab.id)
  }

  return (
    <div className={`tabs ${className}`} role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          ref={(node) => { if (node) tabRefs.current.set(tab.id, node); else tabRefs.current.delete(tab.id) }}
          role="tab"
          id={`tab-${tab.id}`}
          aria-selected={activeTab === tab.id}
          aria-controls={`panel-${tab.id}`}
          aria-disabled={tab.disabled}
          className={`tab ${activeTab === tab.id ? 'tab-active' : ''} ${tab.disabled ? 'tab-disabled' : ''}`}
          onClick={() => handleTabClick(tab.id)}
          disabled={tab.disabled}
          tabIndex={activeTab === tab.id ? 0 : -1}
          onKeyDown={(event) => handleTabKeyDown(event, index)}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="tab-count" aria-hidden="true">({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  )
}

interface TabPanelProps {
  /** ID del panel (debe coincidir con tab.id) */
  id: string
  /** Pestaña activa */
  activeTab: string
  /** Contenido del panel */
  children: ReactNode
  /** Clase CSS adicional */
  className?: string
}

/**
 * TabPanel — Panel de contenido de una pestaña.
 */
export function TabPanel({ id, activeTab, children, className = '' }: TabPanelProps) {
  const isActive = activeTab === id

  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      hidden={!isActive}
      className={`tab-panel ${className}`}
    >
      {isActive && children}
    </div>
  )
}
