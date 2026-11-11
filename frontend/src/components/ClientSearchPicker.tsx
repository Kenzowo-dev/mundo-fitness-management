import { useEffect, useId, useRef, useState } from 'react'
import { Search, X } from 'lucide'
import MorphIcon from './MorphIcon'
import { useClients } from '../hooks/useApi'
import type { Client } from '../types/api'
import '@/styles/components/ClientSearchPicker.css'

interface ClientSearchPickerProps {
  /** Prefijo para los ids del campo (ej: "checkin" → "checkin-client"). */
  id: string
  label?: string
  selectedClient: Client | null
  onSelect: (client: Client | null) => void
  /** Etiqueta opcional junto a cada resultado, p. ej. el estado de su membresía. */
  renderTag?: (client: Client) => { text: string; tone: 'success' | 'warning' } | null
  error?: string
}

const MAX_RESULTS = 8
const DEBOUNCE_MS = 250

/**
 * Buscador de socios por nombre o DNI con lupa.
 * Busca en el servidor (no depende de tener todos los socios cargados) y
 * se puede usar solo con teclado: ↑/↓ para moverse, Enter para elegir, Esc para cerrar.
 */
export default function ClientSearchPicker({
  id,
  label = 'Socio',
  selectedClient,
  onSelect,
  renderTag,
  error,
}: ClientSearchPickerProps) {
  const inputId = `${id}-client`
  const listboxId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [term, setTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(term.trim()), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [term])

  // Sin texto se listan los primeros socios; al escribir, se filtran por nombre o DNI.
  const { data, isFetching, isError } = useClients(
    1,
    MAX_RESULTS,
    debouncedTerm ? { search: debouncedTerm } : undefined,
    { enabled: isOpen },
  )
  const results: Client[] = data?.data ?? []
  const isTyping = term.trim() !== debouncedTerm
  const showList = isOpen

  const choose = (client: Client) => {
    onSelect(client)
    setTerm('')
    setDebouncedTerm('')
    setIsOpen(false)
  }

  const clearSelection = () => {
    onSelect(null)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIsOpen(true)
      setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      // Evita que Enter envíe el formulario mientras se elige un socio
      e.preventDefault()
      if (showList && results[activeIndex]) choose(results[activeIndex])
    } else if (e.key === 'Escape' && isOpen) {
      e.stopPropagation()
      setIsOpen(false)
    }
  }

  const errorId = error ? `${inputId}-error` : undefined

  return (
    <div className={`form-field client-search ${error ? 'form-field-error' : ''}`}>
      <label htmlFor={inputId} className="form-field-label">
        {label}
        <span className="form-field-required" aria-hidden="true">*</span>
      </label>

      {selectedClient ? (
        <div className="client-search-selected" id={inputId} tabIndex={-1}>
          <span className="client-search-avatar" aria-hidden="true">
            {selectedClient.firstName?.[0]}{selectedClient.lastName?.[0]}
          </span>
          <span className="client-search-selected-text">
            <strong>{selectedClient.firstName} {selectedClient.lastName}</strong>
            <span>DNI {selectedClient.dni}</span>
          </span>
          <button type="button" className="client-search-clear" onClick={clearSelection} aria-label="Cambiar socio seleccionado">
            <MorphIcon icon={X} size={16} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="client-search-box">
          <div className="client-search-field">
            <span className="client-search-icon" aria-hidden="true">
              <MorphIcon icon={Search} size={18} />
            </span>
            <input
              ref={inputRef}
              id={inputId}
              type="search"
              className={`input input-md client-search-input ${error ? 'input-error' : ''}`}
              placeholder="Buscar por nombre o DNI"
              autoComplete="off"
              role="combobox"
              aria-expanded={showList}
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={showList && results[activeIndex] ? `${listboxId}-${results[activeIndex].id}` : undefined}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={errorId}
              value={term}
              onChange={(e) => { setTerm(e.target.value); setIsOpen(true); setActiveIndex(0) }}
              onFocus={() => setIsOpen(true)}
              onBlur={() => setTimeout(() => setIsOpen(false), 120)}
              onKeyDown={handleKeyDown}
            />
          </div>

          {showList && (
            <ul className="client-search-results" id={listboxId} role="listbox" aria-label="Resultados de socios">
              {!term.trim() && results.length > 0 && (
                <li className="client-search-heading" role="presentation">Socios</li>
              )}
              {(isTyping || isFetching) && results.length === 0 ? (
                <li className="client-search-status" role="presentation">Buscando…</li>
              ) : isError ? (
                <li className="client-search-status" role="presentation">No se pudo buscar. Intenta de nuevo.</li>
              ) : results.length === 0 ? (
                <li className="client-search-status" role="presentation">
                  {term.trim() ? `Ningún socio coincide con “${term.trim()}”.` : 'Aún no hay socios registrados.'}
                </li>
              ) : (
                results.map((client, index) => {
                  const tag = renderTag?.(client)
                  return (
                    <li
                      key={client.id}
                      id={`${listboxId}-${client.id}`}
                      role="option"
                      aria-selected={index === activeIndex}
                      className={`client-search-option ${index === activeIndex ? 'is-active' : ''}`}
                      onMouseDown={(e) => { e.preventDefault(); choose(client) }}
                      onMouseEnter={() => setActiveIndex(index)}
                    >
                      <span className="client-search-avatar" aria-hidden="true">
                        {client.firstName?.[0]}{client.lastName?.[0]}
                      </span>
                      <span className="client-search-option-text">
                        <strong>{client.firstName} {client.lastName}</strong>
                        <span>DNI {client.dni}</span>
                      </span>
                      {tag && <span className={`client-search-tag is-${tag.tone}`}>{tag.text}</span>}
                    </li>
                  )
                })
              )}
            </ul>
          )}
        </div>
      )}

      {!selectedClient && !error && (
        <p className="form-field-helper-text">Elige de la lista o escribe el nombre o DNI para filtrar.</p>
      )}
      {error && (
        <p id={errorId} className="form-field-error-message" aria-live="polite">{error}</p>
      )}
    </div>
  )
}
