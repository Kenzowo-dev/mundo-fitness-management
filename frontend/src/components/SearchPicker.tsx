import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Search, X } from 'lucide'
import MorphIcon from './MorphIcon'
import '@/styles/components/Input.css'
import '@/styles/components/SearchPicker.css'

export interface SearchPickerItemView {
  /** Contenido del círculo de la izquierda (iniciales, icono…). */
  avatar: ReactNode
  title: string
  subtitle?: string
  tag?: { text: string; tone: 'success' | 'warning' | 'neutral' } | null
}

interface SearchPickerProps<T> {
  /** id del input; la etiqueta apunta a él. */
  inputId: string
  label: string
  placeholder: string
  helperText: string
  /** Título de la lista cuando no se ha escrito nada (ej: "Socios"). */
  listHeading: string
  /** Nombre accesible de la lista y del botón para cambiar (ej: "socio"). */
  itemNoun: string
  selected: T | null
  onSelect: (item: T | null) => void
  /** Resultados para el texto actual (los calcula el componente padre). */
  items: T[]
  getKey: (item: T) => string | number
  view: (item: T) => SearchPickerItemView
  term: string
  onTermChange: (term: string) => void
  /** Se avisa al abrir/cerrar la lista (p. ej. para cargar datos solo al abrir). */
  onOpenChange?: (open: boolean) => void
  loading?: boolean
  isError?: boolean
  emptyText: (term: string) => string
  error?: string
}

/**
 * Campo con lupa que despliega una lista para elegir un elemento.
 * Al hacer clic muestra la lista; al escribir, el padre filtra `items`.
 * Teclado: ↑/↓ para moverse, Enter para elegir, Esc para cerrar.
 */
export default function SearchPicker<T>({
  inputId,
  label,
  placeholder,
  helperText,
  listHeading,
  itemNoun,
  selected,
  onSelect,
  items,
  getKey,
  view,
  term,
  onTermChange,
  onOpenChange,
  loading = false,
  isError = false,
  emptyText,
  error,
}: SearchPickerProps<T>) {
  const listboxId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpenState] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const setIsOpen = (open: boolean) => {
    setIsOpenState(open)
    onOpenChange?.(open)
  }

  const choose = (item: T) => {
    onSelect(item)
    onTermChange('')
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
      setActiveIndex((i) => Math.min(i + 1, Math.max(items.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      // Evita que Enter envíe el formulario mientras se elige
      e.preventDefault()
      if (isOpen && items[activeIndex]) choose(items[activeIndex])
    } else if (e.key === 'Escape' && isOpen) {
      // No cierra el modal: solo la lista
      e.stopPropagation()
      setIsOpen(false)
    }
  }

  const errorId = error ? `${inputId}-error` : undefined
  const trimmed = term.trim()
  const selectedView = selected ? view(selected) : null
  const optionId = (item: T) => `${listboxId}-${getKey(item)}`
  const activeOptionId = isOpen && items[activeIndex] ? optionId(items[activeIndex]) : undefined

  // Con ↑/↓ la lista se desliza sola para que la opción marcada siempre se vea
  useEffect(() => {
    if (activeOptionId) document.getElementById(activeOptionId)?.scrollIntoView?.({ block: 'nearest' })
  }, [activeOptionId])

  return (
    <div className={`form-field search-picker ${error ? 'form-field-error' : ''}`}>
      <label htmlFor={inputId} className="form-field-label">
        {label}
        <span className="form-field-required" aria-hidden="true">*</span>
      </label>

      {selected && selectedView ? (
        <div className="search-picker-selected" id={inputId} tabIndex={-1}>
          <span className="search-picker-avatar" aria-hidden="true">{selectedView.avatar}</span>
          <span className="search-picker-text">
            <strong>{selectedView.title}</strong>
            {selectedView.subtitle && <span>{selectedView.subtitle}</span>}
          </span>
          <button type="button" className="search-picker-clear" onClick={clearSelection} aria-label={`Cambiar ${itemNoun} seleccionado`}>
            <MorphIcon icon={X} size={16} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div>
          <div className="search-picker-field">
            <span className="search-picker-icon" aria-hidden="true">
              <MorphIcon icon={Search} size={18} />
            </span>
            <input
              ref={inputRef}
              id={inputId}
              type="search"
              className={`input input-md search-picker-input ${error ? 'input-error' : ''}`}
              placeholder={placeholder}
              autoComplete="off"
              role="combobox"
              aria-expanded={isOpen}
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={activeOptionId}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={errorId}
              value={term}
              onChange={(e) => { onTermChange(e.target.value); setIsOpen(true); setActiveIndex(0) }}
              onFocus={() => setIsOpen(true)}
              onBlur={() => setTimeout(() => setIsOpen(false), 120)}
              onKeyDown={handleKeyDown}
            />
          </div>

          {isOpen && (
            <ul className="search-picker-results" id={listboxId} role="listbox" aria-label={`Resultados de ${itemNoun}`}>
              {!trimmed && items.length > 0 && (
                <li className="search-picker-heading" role="presentation">{listHeading}</li>
              )}
              {loading && items.length === 0 ? (
                <li className="search-picker-status" role="presentation">Buscando…</li>
              ) : isError ? (
                <li className="search-picker-status" role="presentation">No se pudo buscar. Intenta de nuevo.</li>
              ) : items.length === 0 ? (
                <li className="search-picker-status" role="presentation">{emptyText(trimmed)}</li>
              ) : (
                items.map((item, index) => {
                  const v = view(item)
                  return (
                    <li
                      key={getKey(item)}
                      id={optionId(item)}
                      role="option"
                      aria-selected={index === activeIndex}
                      className={`search-picker-option ${index === activeIndex ? 'is-active' : ''}`}
                      onMouseDown={(e) => { e.preventDefault(); choose(item) }}
                      onMouseEnter={() => setActiveIndex(index)}
                    >
                      <span className="search-picker-avatar" aria-hidden="true">{v.avatar}</span>
                      <span className="search-picker-text">
                        <strong>{v.title}</strong>
                        {v.subtitle && <span>{v.subtitle}</span>}
                      </span>
                      {v.tag && <span className={`search-picker-tag is-${v.tag.tone}`}>{v.tag.text}</span>}
                    </li>
                  )
                })
              )}
            </ul>
          )}
        </div>
      )}

      {!selected && !error && <p className="form-field-helper-text">{helperText}</p>}
      {error && (
        <p id={errorId} className="form-field-error-message" aria-live="polite">{error}</p>
      )}
    </div>
  )
}
