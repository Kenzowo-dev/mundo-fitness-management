import { useState } from 'react'
import { Eye, Pencil, Search, UserRoundPlus } from 'lucide'
import { MorphIcon } from 'morphicons/react'
import { useClients, useCreateClient, useUpdateClient } from '../../hooks/useApi'
import type { Client, CreateClientData } from '../../types/api.js'
import ClientFormFields, { type ClientFormErrors, type ClientFormValues } from '../../components/ClientFormFields'
import StatusBadge from '../../components/StatusBadge.tsx'
import Button from '../../components/Button'
import FormField from '../../components/FormField'
import Modal from '../../components/Modal'
import Alert from '../../components/Alert'
import PageHeader from '../../components/PageHeader'
import Pagination from '../../components/Pagination'
import TableContainer from '../../components/TableContainer'
import '../../styles/dashboard/ClientsPage.css'

const createEmptyClientForm = (): CreateClientData => ({
  dni: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  birthDate: '',
  gender: '',
  address: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  medicalConditions: '',
  notes: '',
})

function cleanFormValues<T extends object>(values: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(values).flatMap(([key, value]) => {
      if (typeof value === 'string') {
        const trimmed = value.trim()
        return trimmed ? [[key, trimmed]] : []
      }
      return value === undefined ? [] : [[key, value]]
    }),
  ) as Partial<T>
}

function serializeClientUpdate(values: Partial<Client>): Partial<Client> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) continue
    if (typeof value !== 'string') {
      result[key] = value
      continue
    }
    const trimmed = value.trim()
    if (key !== 'birthDate' || trimmed) result[key] = trimmed
  }
  return result as Partial<Client>
}

function validateClientForm(values: ClientFormValues): ClientFormErrors {
  const errors: ClientFormErrors = {}
  const dni = values.dni?.trim() ?? ''
  const firstName = values.firstName?.trim() ?? ''
  const lastName = values.lastName?.trim() ?? ''
  const email = values.email?.trim() ?? ''

  if (!/^\d{8}$/.test(dni)) errors.dni = 'Ingresa un DNI de 8 dígitos.'
  if (!firstName) errors.firstName = 'Ingresa los nombres del socio.'
  if (!lastName) errors.lastName = 'Ingresa los apellidos del socio.'
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Ingresa un correo electrónico válido.'
  }

  return errors
}

function formatDate(value?: string) {
  if (!value) return 'Sin fecha'
  const date = new Date(`${value.slice(0, 10)}T12:00:00`)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

function fullName(client: Client) {
  return `${client.firstName} ${client.lastName}`.trim()
}

export default function ClientsPage() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [apiErrorDismissed, setApiErrorDismissed] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [viewClient, setViewClient] = useState<Client | null>(null)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [createForm, setCreateForm] = useState<CreateClientData>(createEmptyClientForm)
  const [editForm, setEditForm] = useState<Partial<Client>>({})
  const [createErrors, setCreateErrors] = useState<ClientFormErrors>({})
  const [editErrors, setEditErrors] = useState<ClientFormErrors>({})
  const [createError, setCreateError] = useState<string | null>(null)
  const [editError, setEditError] = useState<string | null>(null)

  const { data, isLoading, isFetching, error: apiError, refetch } = useClients(page, 20, {
    search: appliedSearch || undefined,
    status: statusFilter || undefined,
  })
  const createClientMutation = useCreateClient()
  const updateClientMutation = useUpdateClient()

  const clients = data?.data ?? []
  const total = data?.pagination.total ?? 0
  const totalPages = data?.pagination.totalPages ?? 0
  const filtersAreActive = Boolean(appliedSearch || statusFilter)
  const hasFilterValues = Boolean(searchInput || appliedSearch || statusFilter)

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(1)
    setAppliedSearch(searchInput.trim())
    setApiErrorDismissed(false)
  }

  const changeStatusFilter = (value: string) => {
    setPage(1)
    setStatusFilter(value)
    setApiErrorDismissed(false)
  }

  const clearFilters = () => {
    setSearchInput('')
    setAppliedSearch('')
    setStatusFilter('')
    setPage(1)
    setApiErrorDismissed(false)
  }

  const openCreate = () => {
    setCreateForm(createEmptyClientForm())
    setCreateErrors({})
    setCreateError(null)
    setIsCreateOpen(true)
  }

  const handleCreateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const errors = validateClientForm(createForm)
    setCreateErrors(errors)
    setCreateError(null)

    const firstError = Object.keys(errors)[0]
    if (firstError) {
      document.getElementById(`create-${firstError === 'firstName' ? 'name' : firstError === 'lastName' ? 'lastname' : firstError}`)?.focus()
      return
    }

    try {
      await createClientMutation.mutateAsync(cleanFormValues(createForm) as CreateClientData)
      setIsCreateOpen(false)
      setCreateForm(createEmptyClientForm())
      setCreateErrors({})
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'No se pudo registrar al socio.')
    }
  }

  const openEdit = (client: Client) => {
    setEditClient(client)
    setEditForm({
      dni: client.dni,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email ?? '',
      phone: client.phone ?? '',
      birthDate: client.birthDate?.slice(0, 10) ?? '',
      gender: client.gender ?? '',
      address: client.address ?? '',
      emergencyContactName: client.emergencyContactName ?? '',
      emergencyContactPhone: client.emergencyContactPhone ?? '',
      medicalConditions: client.medicalConditions ?? '',
      notes: client.notes ?? '',
      status: client.status,
    })
    setEditErrors({})
    setEditError(null)
  }

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editClient) return

    const errors = validateClientForm(editForm)
    setEditErrors(errors)
    setEditError(null)
    const firstError = Object.keys(errors)[0]
    if (firstError) {
      document.getElementById(`edit-${firstError === 'firstName' ? 'name' : firstError === 'lastName' ? 'lastname' : firstError}`)?.focus()
      return
    }

    try {
      await updateClientMutation.mutateAsync({
        id: editClient.id,
        data: serializeClientUpdate(editForm),
      })
      setEditClient(null)
      setEditForm({})
      setEditErrors({})
    } catch (error) {
      setEditError(error instanceof Error ? error.message : 'No se pudieron guardar los cambios del socio.')
    }
  }

  const updateCreateField = (field: keyof ClientFormValues, value: string) => {
    setCreateForm((current) => ({ ...current, [field]: value }))
    setCreateErrors((current) => ({ ...current, [field]: undefined }))
  }

  const updateEditField = (field: keyof ClientFormValues, value: string) => {
    setEditForm((current) => ({ ...current, [field]: value }))
    setEditErrors((current) => ({ ...current, [field]: undefined }))
  }

  const closeEdit = () => {
    if (updateClientMutation.isPending) return
    setEditClient(null)
    setEditForm({})
    setEditErrors({})
    setEditError(null)
  }

  return (
    <div className="clients-page">
      <PageHeader
        title="Socios"
        description="Busca sus datos de contacto, revisa su estado y mantén su ficha al día."
        actions={[{
          label: 'Registrar socio',
          onClick: openCreate,
          ariaLabel: 'Registrar nuevo socio',
          icon: <MorphIcon icon={UserRoundPlus} size={18} reducedMotion="user" aria-hidden="true" />,
        }]}
      />

      <section className="clients-workspace" aria-label="Listado de socios">
        <form onSubmit={submitSearch} className="clients-toolbar" role="search" aria-label="Buscar y filtrar socios">
          <div className="clients-search-input">
            <FormField
              label="Buscar socio"
              type="search"
              id="client-search"
              name="search"
              placeholder="Nombre, DNI o correo"
              value={searchInput}
              onChange={setSearchInput}
              autoComplete="off"
            />
          </div>
          <div className="clients-filter-input">
            <FormField
              label="Estado del socio"
              type="select"
              id="client-status"
              name="status"
              value={statusFilter}
              onChange={changeStatusFilter}
              options={[
                { value: '', label: 'Todos los estados' },
                { value: 'active', label: 'Activo' },
                { value: 'inactive', label: 'Inactivo' },
                { value: 'suspended', label: 'Suspendido' },
              ]}
            />
          </div>
          <Button type="submit" variant="primary" loading={isFetching && !isLoading}>
            <MorphIcon icon={Search} size={16} reducedMotion="user" aria-hidden="true" />
            Buscar
          </Button>
          {hasFilterValues && (
            <Button type="button" variant="secondary" onClick={clearFilters} aria-label="Limpiar filtros de búsqueda">
              Limpiar
            </Button>
          )}
        </form>

        {apiError && !apiErrorDismissed && (
          <Alert
            type="error"
            title="No se pudo cargar la lista de socios"
            message={apiError.message}
            dismissible
            onDismiss={() => setApiErrorDismissed(true)}
          />
        )}

        <div className="clients-list-summary" role="status" aria-live="polite" aria-atomic="true">
          <span>{total === 1 ? '1 socio' : `${total} socios`}</span>
          {isFetching && !isLoading && <span className="clients-refreshing">Actualizando…</span>}
        </div>

        <TableContainer
          className="clients-table-container"
          tableClassName="clients-table"
          data={clients}
          loading={isLoading}
          aria-busy={isFetching}
          columns={[
            {
              key: 'dni',
              header: 'Socio',
              className: 'clients-person-cell',
              render: (client) => (
                <div className="clients-person">
                  <span className="clients-avatar" aria-hidden="true">
                    {client.firstName?.[0]}{client.lastName?.[0]}
                  </span>
                  <span className="clients-person-copy">
                    <strong>{fullName(client)}</strong>
                    <span>DNI {client.dni}</span>
                  </span>
                </div>
              ),
            },
            {
              key: 'email',
              header: 'Contacto',
              render: (client) => (
                <div className="clients-contact">
                  {client.email ? <a href={`mailto:${client.email}`}>{client.email}</a> : <span>Sin correo</span>}
                  {client.phone ? <a href={`tel:${client.phone}`}>{client.phone}</a> : <span>Sin teléfono</span>}
                </div>
              ),
            },
            { key: 'status', header: 'Estado', render: (client) => <StatusBadge status={client.status} /> },
            { key: 'joinedAt', header: 'Desde', render: (client) => formatDate(client.joinedAt) },
            {
              key: 'actions',
              header: 'Acciones',
              className: 'clients-actions-cell',
              render: (client) => (
                <div className="action-buttons" role="group" aria-label={`Acciones para ${fullName(client)}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Ver ficha de ${fullName(client)}`}
                    onClick={() => setViewClient(client)}
                  >
                    <MorphIcon icon={Eye} size={18} reducedMotion="user" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Editar ${fullName(client)}`}
                    onClick={() => openEdit(client)}
                  >
                    <MorphIcon icon={Pencil} size={18} reducedMotion="user" aria-hidden="true" />
                  </Button>
                </div>
              ),
            },
          ]}
          rowKey="id"
          emptyState={{
            title: apiError
              ? 'No se muestran los registros'
              : filtersAreActive ? 'No hay socios con esos filtros' : 'Aún no hay socios registrados',
            description: apiError
              ? 'La lista no está disponible por un error de conexión. Vuelve a intentarlo.'
              : filtersAreActive
              ? 'Prueba con otro nombre, DNI, correo o estado.'
              : 'Registra al primer socio para comenzar a gestionar sus membresías.',
            action: apiError
              ? { label: 'Volver a intentar', onClick: () => { void refetch() }, variant: 'secondary' }
              : filtersAreActive
              ? { label: 'Limpiar filtros', onClick: clearFilters, variant: 'secondary' }
              : { label: 'Registrar primer socio', onClick: openCreate },
          }}
        />

        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            onPageChange={setPage}
          />
        )}
      </section>

      <Modal
        open={isCreateOpen}
        onClose={() => !createClientMutation.isPending && setIsCreateOpen(false)}
        title="Registrar socio"
        size="lg"
        className="client-form-modal"
        footer={(
          <>
            <Button type="button" variant="secondary" disabled={createClientMutation.isPending} onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button type="submit" form="create-client-form" variant="primary" loading={createClientMutation.isPending}>Registrar socio</Button>
          </>
        )}
      >
        <form id="create-client-form" className="client-form" noValidate onSubmit={handleCreateSubmit}>
          <p className="client-form-intro">Los campos con * son necesarios para guardar la ficha.</p>
          {createError && <Alert type="error" title="No se pudo registrar al socio" message={createError} />}
          {Object.keys(createErrors).length > 0 && (
            <Alert type="error" title="Revisa los datos" message="Corrige los campos señalados para poder registrar al socio." />
          )}
          <ClientFormFields
            idPrefix="create"
            values={createForm}
            errors={createErrors}
            onChange={updateCreateField}
          />
        </form>
      </Modal>

      <Modal
        open={Boolean(viewClient)}
        onClose={() => setViewClient(null)}
        title={viewClient ? `Ficha del socio: ${fullName(viewClient)}` : 'Ficha del socio'}
        size="md"
      >
        {viewClient && (
          <dl className="client-profile-details">
            <div><dt>DNI</dt><dd>{viewClient.dni}</dd></div>
            <div><dt>Correo electrónico</dt><dd>{viewClient.email || 'Sin correo registrado'}</dd></div>
            <div><dt>Teléfono</dt><dd>{viewClient.phone || 'Sin teléfono registrado'}</dd></div>
            <div><dt>Estado del socio</dt><dd><StatusBadge status={viewClient.status} /></dd></div>
            <div><dt>Fecha de registro</dt><dd>{formatDate(viewClient.joinedAt)}</dd></div>
            {viewClient.birthDate && <div><dt>Fecha de nacimiento</dt><dd>{formatDate(viewClient.birthDate)}</dd></div>}
            {viewClient.gender && <div><dt>Género</dt><dd>{viewClient.gender}</dd></div>}
            {viewClient.address && <div><dt>Dirección</dt><dd>{viewClient.address}</dd></div>}
            {viewClient.emergencyContactName && <div><dt>Contacto de emergencia</dt><dd>{viewClient.emergencyContactName}</dd></div>}
            {viewClient.emergencyContactPhone && <div><dt>Teléfono de emergencia</dt><dd>{viewClient.emergencyContactPhone}</dd></div>}
            {viewClient.medicalConditions && <div><dt>Información médica relevante</dt><dd>{viewClient.medicalConditions}</dd></div>}
            {viewClient.notes && <div><dt>Notas internas</dt><dd>{viewClient.notes}</dd></div>}
          </dl>
        )}
      </Modal>

      <Modal
        open={Boolean(editClient)}
        onClose={closeEdit}
        title={editClient ? `Editar ficha de ${fullName(editClient)}` : 'Editar ficha del socio'}
        size="lg"
        className="client-form-modal"
        footer={(
          <>
            <Button type="button" variant="secondary" disabled={updateClientMutation.isPending} onClick={closeEdit}>Cancelar</Button>
            <Button type="submit" form="edit-client-form" variant="primary" loading={updateClientMutation.isPending}>Guardar cambios</Button>
          </>
        )}
      >
        {editClient && (
          <form id="edit-client-form" className="client-form" noValidate onSubmit={handleEditSubmit}>
            <p className="client-form-intro">Los campos con * son necesarios. Puedes cambiar el estado del socio aquí.</p>
            {editError && <Alert type="error" title="No se pudieron guardar los cambios" message={editError} />}
            {Object.keys(editErrors).length > 0 && (
              <Alert type="error" title="Revisa los datos" message="Corrige los campos señalados antes de guardar." />
            )}
            <ClientFormFields
              idPrefix="edit"
              values={editForm}
              errors={editErrors}
              onChange={updateEditField}
              includeStatus
            />
          </form>
        )}
      </Modal>
    </div>
  )
}
