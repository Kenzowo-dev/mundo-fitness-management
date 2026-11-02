import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide'
import { api } from '../api/client'
import type { Client } from '../types/api'
import MorphIcon from './MorphIcon'
import Alert from './Alert'
import Button from './Button'
import FormField from './FormField'
import Skeleton from './Skeleton'
import '@/styles/components/ClientSearchPicker.css'

interface ClientSearchPickerProps {
  /** Prefijo para los ids de los campos, para poder usarlo en varios formularios. */
  id: string
  selectedClient: Client | null
  onSelect: (client: Client | null) => void
}

/**
 * Busca socios por nombre o DNI mientras se escribe y deja elegir uno de los resultados.
 * Una vez elegido, muestra el socio con un botón para cambiarlo.
 */
export default function ClientSearchPicker({ id, selectedClient, onSelect }: ClientSearchPickerProps) {
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')

  // Espera una pausa corta al escribir para no consultar en cada tecla.
  useEffect(() => {
    if (selectedClient) return
    const timer = setTimeout(() => setSearch(input.trim()), 300)
    return () => clearTimeout(timer)
  }, [input, selectedClient])

  const searchQuery = useQuery({
    queryKey: ['client-search', search],
    queryFn: () => api.getClients(1, 20, { search }),
    enabled: search.length > 0,
    retry: false,
  })
  const results = searchQuery.data?.data ?? []
  const showResults = search.length > 0 && !searchQuery.isFetching && !searchQuery.isError

  const submitSearch = () => {
    setSearch(input.trim())
    onSelect(null)
  }

  const clearSelection = () => {
    setInput('')
    setSearch('')
    onSelect(null)
  }

  if (selectedClient) {
    return (
      <div className="client-picker-selected">
        <div>
          <span className="client-picker-selected-label">Socio</span>
          <strong>{selectedClient.firstName} {selectedClient.lastName}</strong>
          <span className="client-picker-selected-dni">DNI {selectedClient.dni}</span>
        </div>
        <Button type="button" variant="secondary" onClick={clearSelection}>Cambiar socio</Button>
      </div>
    )
  }

  return (
    <div className="client-picker">
      <div className="client-picker-search">
        <FormField
          label="Buscar socio por nombre o DNI"
          type="search"
          id={`${id}-client-search`}
          value={input}
          onChange={setInput}
          placeholder="Escribe un nombre o DNI"
          required
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              submitSearch()
            }
          }}
        />
        <Button type="button" variant="secondary" aria-label="Buscar socio" onClick={submitSearch}>
          <MorphIcon icon={Search} size={18} aria-hidden="true" />
        </Button>
      </div>
      {searchQuery.isFetching && <div className="client-picker-field-skeleton" aria-busy="true"><span>Resultados de búsqueda</span><Skeleton height={44} ariaLabel="Buscando socio" /></div>}
      {searchQuery.isError && <div className="client-picker-error"><Alert type="error" title="No se pudo buscar al socio" message={searchQuery.error instanceof Error ? searchQuery.error.message : 'Inténtalo de nuevo.'} /><Button variant="secondary" onClick={() => void searchQuery.refetch()}>Reintentar</Button></div>}
      {showResults && results.length === 0 && <Alert type="info" message="No se encontraron socios con ese nombre o DNI." />}
      {showResults && results.length > 0 && (
        <ul className="client-picker-results" aria-label="Resultados de búsqueda de socios">
          {results.map((client) => (
            <li key={client.id}>
              <button type="button" className="client-picker-result" onClick={() => onSelect(client)}>
                <strong>{client.firstName} {client.lastName}</strong>
                <span>DNI {client.dni}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
