import { useEffect, useState } from 'react'
import SearchPicker from './SearchPicker'
import { useClients } from '../hooks/useApi'
import type { Client } from '../types/api'
import { sanitizeSearchTerm } from '../utils/fieldValidation'

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
 * Busca en el servidor, así funciona aunque el gimnasio tenga miles de socios.
 */
export default function ClientSearchPicker({
  id,
  label = 'Socio',
  selectedClient,
  onSelect,
  renderTag,
  error,
}: ClientSearchPickerProps) {
  const [term, setTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)

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

  return (
    <SearchPicker<Client>
      inputId={`${id}-client`}
      label={label}
      placeholder="Buscar por nombre o DNI"
      helperText="Elige de la lista o escribe el nombre o DNI para filtrar."
      listHeading="Socios"
      itemNoun="socio"
      selected={selectedClient}
      onSelect={onSelect}
      items={data?.data ?? []}
      getKey={(client) => client.id}
      view={(client) => ({
        avatar: `${client.firstName?.[0] ?? ''}${client.lastName?.[0] ?? ''}`,
        title: `${client.firstName} ${client.lastName}`,
        subtitle: `DNI ${client.dni}`,
        tag: renderTag?.(client),
      })}
      term={term}
      onTermChange={(value) => {
        const clean = sanitizeSearchTerm(value)
        setTerm(clean)
        if (!clean) setDebouncedTerm('')
      }}
      onOpenChange={setIsOpen}
      loading={isFetching || term.trim() !== debouncedTerm}
      isError={isError}
      emptyText={(t) => (t ? `Ningún socio coincide con “${t}”.` : 'Aún no hay socios registrados.')}
      error={error}
    />
  )
}
