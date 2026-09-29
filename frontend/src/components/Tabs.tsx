import type { ReactNode } from 'react'
import { useState } from 'react'
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

  const handleTabClick = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId)
    if (tab?.disabled) return
    if (!isControlled) setUncontrolledActiveTab(tabId)
    onChange?.(tabId)
  }

  return (
    <div className={`tabs ${className}`} role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          id={`tab-${tab.id}`}
          aria-selected={activeTab === tab.id}
          aria-controls={`panel-${tab.id}`}
          aria-disabled={tab.disabled}
          className={`tab ${activeTab === tab.id ? 'tab-active' : ''} ${tab.disabled ? 'tab-disabled' : ''}`}
          onClick={() => handleTabClick(tab.id)}
          disabled={tab.disabled}
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