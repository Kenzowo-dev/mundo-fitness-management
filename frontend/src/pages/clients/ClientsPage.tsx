import { useState, useCallback } from 'react'
import { useClients, useCreateClient, useUpdateClient } from '../../hooks/useApi'
import type { Client, CreateClientData } from '../../types/api.js'
import StatusBadge from '../../components/StatusBadge.tsx'
import Button from '../../components/Button'
import FormField from '../../components/FormField'
import Modal from '../../components/Modal'
import Alert from '../../components/Alert'
import PageHeader from '../../components/PageHeader'
import Pagination from '../../components/Pagination'
import TableContainer from '../../components/TableContainer'
import '../../styles/dashboard/ClientsPage.css'

export default function ClientsPage() {
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [viewClient, setViewClient] = useState<Client | null>(null)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [createForm, setCreateForm] = useState<CreateClientData>({
    dni: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: 'masculino',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    notes: '',
  })
  const [editForm, setEditForm] = useState<Partial<Client>>({})

  const { data, isLoading, error: apiError, refetch } = useClients(pagination.page, pagination.limit, {
    search: search || undefined,
    status: statusFilter || undefined,
  })

  const createClientMutation = useCreateClient()
  const updateClientMutation = useUpdateClient()

  const clients = data?.data ?? []
  const total = data?.pagination.total ?? 0
  const totalPages = data?.pagination.totalPages ?? 0

  const fetchClients = useCallback(() => {
    refetch()
  }, [refetch])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchClients()
  }

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.dni || !createForm.firstName || !createForm.lastName) {
      setError('Por favor complete los campos obligatorios: DNI, Nombre y Apellido.')
      return
    }

    try {
      setError(null)
      const clientData = Object.fromEntries(
        Object.entries(createForm).filter(([, value]) => value !== '' && value !== undefined),
      ) as CreateClientData
      await createClientMutation.mutateAsync(clientData)
      setIsCreateOpen(false)
      setCreateForm({
        dni: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        birthDate: '',
        gender: 'masculino',
        address: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        notes: '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar cliente')
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editClient) return
    if (!editForm.dni || !editForm.firstName || !editForm.lastName) {
      setError('Por favor complete los campos obligatorios: DNI, Nombre y Apellido.')
      return
    }

    try {
      setError(null)
      const clientData = Object.fromEntries(
        Object.entries(editForm).filter(([, value]) => value !== '' && value !== undefined),
      ) as Partial<Client>
      await updateClientMutation.mutateAsync({ id: editClient.id, data: clientData })
      setEditClient(null)
      setEditForm({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar cliente')
    }
  }

  const openEditModal = (client: Client) => {
    setEditClient(client)
    setEditForm({
      dni: client.dni,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email || '',
      phone: client.phone || '',
      birthDate: client.birthDate || '',
      gender: client.gender || 'masculino',
      address: client.address || '',
      emergencyContactName: client.emergencyContactName || '',
      emergencyContactPhone: client.emergencyContactPhone || '',
      notes: client.notes || '',
      status: client.status,
    })
  }

  if (apiError && !error) {
    setError(apiError instanceof Error ? apiError.message : 'Error al cargar clientes')
  }

  return (
    <div className="clients-page">
      <PageHeader
        title="Gestión de Clientes"
        actions={[
          {
            label: 'Nuevo Cliente',
            onClick: () => setIsCreateOpen(true),
            ariaLabel: 'Registrar nuevo cliente',
          },
        ]}
      />

      <form onSubmit={handleSearch} className="search-form" role="search" aria-label="Buscar clientes">
        <FormField
          label="Buscar clientes"
          type="text"
          id="client-search"
          placeholder="Buscar por nombre, DNI, email..."
          value={search}
          onChange={(value) => setSearch(value)}
        />
        <FormField
          label="Filtrar por estado"
          type="select"
          id="client-status"
          value={statusFilter}
          onChange={(value) => setStatusFilter(value)}
          options={[
            { value: '', label: 'Todos los estados' },
            { value: 'active', label: 'Activo' },
            { value: 'inactive', label: 'Inactivo' },
            { value: 'suspended', label: 'Suspendido' },
          ]}
        />
        <Button type="submit" variant="primary">Buscar</Button>
        {(search || statusFilter) && (
          <Button type="button" variant="secondary" onClick={clearFilters} aria-label="Limpiar filtros de búsqueda">
            Limpiar
          </Button>
        )}
      </form>

      {error && (
        <Alert type="error" message={error} dismissible onDismiss={() => setError(null)} />
      )}

      <TableContainer
        data={clients}
        loading={isLoading}
        columns={[
          { key: 'dni', header: 'DNI', render: (client) => <strong>{client.dni}</strong> },
          { key: 'firstName', header: 'Nombre', render: (client) => `${client.firstName} ${client.lastName}` },
          { key: 'email', header: 'Email', render: (client) => client.email || '-' },
          { key: 'phone', header: 'Teléfono', render: (client) => client.phone || '-' },
          { key: 'status', header: 'Estado', render: (client) => <StatusBadge status={client.status} /> },
          { key: 'createdAt', header: 'Fecha registro', render: (client) => new Date(client.createdAt).toLocaleDateString() },
          { key: 'actions', header: 'Acciones', render: (client) => (
            <div className="action-buttons">
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Ver detalle de ${client.firstName}`}
                onClick={() => setViewClient(client)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Editar ${client.firstName}`}
                onClick={() => openEditModal(client)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </Button>
            </div>
          )},
        ]}
        rowKey="id"
        emptyState={{
          icon: <span aria-hidden="true">👥</span>,
          title: 'No se encontraron clientes',
          description: search || statusFilter ? 'Intenta con otros filtros' : 'Registra el primer cliente',
          action: search || statusFilter ? { label: 'Limpiar filtros', onClick: clearFilters } : { label: 'Registrar primer cliente', onClick: () => setIsCreateOpen(true) },
        }}
      />

      {totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={totalPages}
          totalItems={total}
          onPageChange={(page) => setPagination(prev => ({ ...prev, page: page }))}
        />
      )}

      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Registrar Nuevo Cliente"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button variant="primary" disabled={createClientMutation.isPending} onClick={handleCreateSubmit}>
              {createClientMutation.isPending ? 'Guardando...' : 'Registrar Cliente'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit}>
          <div className="form-grid-2">
            <FormField
              label="DNI / Documento *"
              type="text"
              id="create-dni"
              name="dni"
              value={createForm.dni}
              onChange={(value) => setCreateForm({ ...createForm, dni: value })}
              placeholder="Ej: 71234567"
              required
            />
            <FormField
              label="Género"
              type="select"
              id="create-gender"
              name="gender"
              value={createForm.gender}
              onChange={(value) => setCreateForm({ ...createForm, gender: value })}
              options={[
                { value: 'masculino', label: 'Masculino' },
                { value: 'femenino', label: 'Femenino' },
                { value: 'otro', label: 'Otro' },
              ]}
            />
          </div>
          <div className="form-grid-2">
            <FormField
              label="Nombres *"
              type="text"
              id="create-name"
              name="firstName"
              value={createForm.firstName}
              onChange={(value) => setCreateForm({ ...createForm, firstName: value })}
              placeholder="Ej: Juan"
              required
            />
            <FormField
              label="Apellidos *"
              type="text"
              id="create-lastname"
              name="lastName"
              value={createForm.lastName}
              onChange={(value) => setCreateForm({ ...createForm, lastName: value })}
              placeholder="Ej: Pérez"
              required
            />
          </div>
          <div className="form-grid-2">
            <FormField
              label="Correo Electrónico"
              type="email"
              id="create-email"
              name="email"
              value={createForm.email}
              onChange={(value) => setCreateForm({ ...createForm, email: value })}
              placeholder="socio@correo.com"
            />
            <FormField
              label="Teléfono / WhatsApp"
              type="tel"
              id="create-phone"
              name="phone"
              value={createForm.phone}
              onChange={(value) => setCreateForm({ ...createForm, phone: value })}
              placeholder="+51987654321"
            />
          </div>
          <FormField
            label="Dirección"
            type="text"
            id="create-address"
            name="address"
            value={createForm.address}
            onChange={(value) => setCreateForm({ ...createForm, address: value })}
            placeholder="Av. Las Camelias 450"
          />
        </form>
      </Modal>

      <Modal
        open={!!viewClient}
        onClose={() => setViewClient(null)}
        title={`Ficha del Socio: ${viewClient?.firstName} ${viewClient?.lastName}`}
        size="md"
      >
        {viewClient && (
          <div className="modal-body">
            <p><strong>DNI:</strong> {viewClient.dni}</p>
            <p><strong>Email:</strong> {viewClient.email || 'No registrado'}</p>
            <p><strong>Teléfono:</strong> {viewClient.phone || 'No registrado'}</p>
            <p><strong>Género:</strong> {viewClient.gender || 'No especificado'}</p>
            <p><strong>Dirección:</strong> {viewClient.address || 'No registrada'}</p>
            <p><strong>Estado:</strong> <StatusBadge status={viewClient.status} /></p>
            <p><strong>Fecha de Ingreso:</strong> {viewClient.joinedAt}</p>
          </div>
        )}
      </Modal>

      <Modal
        open={!!editClient}
        onClose={() => { setEditClient(null); setEditForm({}); }}
        title={`Editar Cliente: ${editClient?.firstName} ${editClient?.lastName}`}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setEditClient(null); setEditForm({}); }}>Cancelar</Button>
            <Button variant="primary" disabled={updateClientMutation.isPending} onClick={handleEditSubmit}>
              {updateClientMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </>
        }
      >
        {editClient && (
          <form onSubmit={handleEditSubmit}>
            <div className="form-grid-2">
              <FormField
                label="DNI / Documento *"
                type="text"
                id="edit-dni"
                name="dni"
                value={editForm.dni || ''}
                onChange={(value) => setEditForm({ ...editForm, dni: value })}
                placeholder="Ej: 71234567"
                required
              />
              <FormField
                label="Género"
                type="select"
                id="edit-gender"
                name="gender"
                value={editForm.gender || 'masculino'}
                onChange={(value) => setEditForm({ ...editForm, gender: value })}
                options={[
                  { value: 'masculino', label: 'Masculino' },
                  { value: 'femenino', label: 'Femenino' },
                  { value: 'otro', label: 'Otro' },
                ]}
              />
            </div>
            <div className="form-grid-2">
              <FormField
                label="Nombres *"
                type="text"
                id="edit-name"
                name="firstName"
                value={editForm.firstName || ''}
                onChange={(value) => setEditForm({ ...editForm, firstName: value })}
                placeholder="Ej: Juan"
                required
              />
              <FormField
                label="Apellidos *"
                type="text"
                id="edit-lastname"
                name="lastName"
                value={editForm.lastName || ''}
                onChange={(value) => setEditForm({ ...editForm, lastName: value })}
                placeholder="Ej: Pérez"
                required
              />
            </div>
            <div className="form-grid-2">
              <FormField
                label="Correo Electrónico"
                type="email"
                id="edit-email"
                name="email"
                value={editForm.email || ''}
                onChange={(value) => setEditForm({ ...editForm, email: value })}
                placeholder="socio@correo.com"
              />
              <FormField
                label="Teléfono / WhatsApp"
                type="tel"
                id="edit-phone"
                name="phone"
                value={editForm.phone || ''}
                onChange={(value) => setEditForm({ ...editForm, phone: value })}
                placeholder="+51987654321"
              />
            </div>
            <FormField
              label="Dirección"
              type="text"
              id="edit-address"
              name="address"
              value={editForm.address || ''}
              onChange={(value) => setEditForm({ ...editForm, address: value })}
              placeholder="Av. Las Camelias 450"
            />
          </form>
        )}
      </Modal>
    </div>
  )
}
