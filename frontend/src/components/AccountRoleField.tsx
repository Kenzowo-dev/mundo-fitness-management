import FormField from './FormField'
import type { AssignableRole, User } from '../types/api'

interface AccountRoleFieldProps {
  /** El socio tiene una cuenta de acceso vinculada (client.userId). */
  hasAccount: boolean
  account?: User
  loading: boolean
  loadError: boolean
  /** Rol elegido en el formulario (se guarda al pulsar "Guardar cambios"). */
  value: AssignableRole | ''
  onChange: (role: AssignableRole) => void
  /** ID de la cuenta del administrador que está editando. */
  currentUserId?: number
}

const ROLE_OPTIONS = [
  { value: 'member', label: 'Socio' },
  { value: 'receptionist', label: 'Recepcionista' },
]

const ROLE_LABELS: Record<string, string> = { member: 'Socio', receptionist: 'Recepcionista', admin: 'Administrador' }

/**
 * "Rol de la cuenta" en la ficha del socio. Solo se muestra al administrador
 * (lo decide la página); el backend vuelve a comprobar que quien cambia el rol es admin.
 */
export default function AccountRoleField({
  hasAccount,
  account,
  loading,
  loadError,
  value,
  onChange,
  currentUserId,
}: AccountRoleFieldProps) {
  const info = (text: string) => (
    <FormField label="Rol de la cuenta" type="text" id="edit-account-role" value={text} disabled helperText="Solo el administrador puede cambiar roles." />
  )

  if (!hasAccount) return info('Sin cuenta de acceso')
  if (loading) return info('Cargando…')
  if (loadError || !account) return info('No se pudo cargar la cuenta')
  if (account.role === 'admin') return info(`${ROLE_LABELS.admin} (no se puede cambiar)`)
  // El backend devuelve el id como texto ("3"); se compara como número
  if (currentUserId !== undefined && Number(account.id) === Number(currentUserId)) return info(`${ROLE_LABELS[account.role] ?? account.role} (tu propia cuenta)`)

  const changed = value !== '' && value !== account.role

  return (
    <FormField
      label="Rol de la cuenta"
      type="select"
      id="edit-account-role"
      value={value || account.role}
      onChange={(next) => onChange(next as AssignableRole)}
      options={ROLE_OPTIONS}
      helperText={changed
        ? `Al guardar pasará de ${ROLE_LABELS[account.role]} a ${ROLE_LABELS[value]} y deberá volver a iniciar sesión.`
        : `Cuenta: ${account.email}. Solo el administrador puede cambiar roles.`}
    />
  )
}
