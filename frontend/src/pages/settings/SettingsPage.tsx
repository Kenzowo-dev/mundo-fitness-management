import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/useAuth'
import { useChangePassword, useUpdateCurrentUser } from '@/hooks/useApi'
import type { User } from '@/types/api'
import Alert from '@/components/Alert'
import Button from '@/components/Button'
import FormField from '@/components/FormField'
import PageHeader from '@/components/PageHeader'
import Skeleton from '@/components/Skeleton'
import Tabs, { TabPanel } from '@/components/Tabs'
import {
  MIN_BIRTH_DATE,
  MIN_BIRTH_DATE_MESSAGE,
  PERSON_NAME_MESSAGE,
  PHONE_MESSAGE,
  VALID_PERSON_NAME,
  VALID_PHONE,
  normalizePhone,
  sanitizePersonName,
  sanitizePhone,
  todayDateKey,
} from '@/utils/fieldValidation'
import '@/styles/dashboard/SettingsPage.css'

type TabId = 'profile' | 'security'
type Profile = Pick<User, 'firstName' | 'lastName'> & { phone: string; birthDate: string; gender: string }

const fromUser = (user: User): Profile => ({
  firstName: user.firstName ?? '',
  lastName: user.lastName ?? '',
  phone: normalizePhone(user.phone),
  birthDate: user.birthDate?.slice(0, 10) ?? '',
  gender: user.gender ?? '',
})

type ProfileErrors = Partial<Record<'firstName' | 'lastName' | 'phone' | 'birthDate', string>>

const SANITIZERS: Partial<Record<keyof Profile, (value: string) => string>> = {
  firstName: sanitizePersonName,
  lastName: sanitizePersonName,
  phone: sanitizePhone,
}

function validateProfile(profile: Profile): ProfileErrors {
  const errors: ProfileErrors = {}
  const firstName = profile.firstName.trim()
  const lastName = profile.lastName.trim()
  const phone = profile.phone.trim()
  if (!firstName) errors.firstName = 'Ingresa tu nombre.'
  else if (!VALID_PERSON_NAME.test(firstName)) errors.firstName = PERSON_NAME_MESSAGE
  if (!lastName) errors.lastName = 'Ingresa tu apellido.'
  else if (!VALID_PERSON_NAME.test(lastName)) errors.lastName = PERSON_NAME_MESSAGE
  if (phone && !VALID_PHONE.test(phone)) errors.phone = PHONE_MESSAGE
  if (profile.birthDate) {
    if (profile.birthDate < MIN_BIRTH_DATE) errors.birthDate = MIN_BIRTH_DATE_MESSAGE
    else if (profile.birthDate > todayDateKey()) errors.birthDate = 'La fecha de nacimiento no puede ser futura.'
  }
  return errors
}

const roleLabel = (role: string) => ({ admin: 'Administrador', receptionist: 'Recepción', member: 'Socio' }[role] ?? role)

export default function SettingsPage() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  const updateUser = useUpdateCurrentUser()
  const changePassword = useChangePassword()
  const [activeTab, setActiveTab] = useState<TabId>('profile')
  const [profile, setProfile] = useState<Profile>(() => user ? fromUser(user) : { firstName: '', lastName: '', phone: '', birthDate: '', gender: '' })
  const [profileUserId, setProfileUserId] = useState<number | null>(user?.id ?? null)
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({})
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })

  if (user && profileUserId !== user.id) {
    setProfile(fromUser(user))
    setProfileUserId(user.id)
  }

  const updateProfile = (key: keyof Profile) => (value: string) => {
    const sanitize = SANITIZERS[key]
    setProfile((current) => ({ ...current, [key]: sanitize ? sanitize(value) : value }))
    setProfileErrors((current) => {
      if (!(key in current)) return current
      const rest = { ...current }
      delete rest[key as keyof ProfileErrors]
      return rest
    })
    setProfileMessage(null)
  }

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const errors = validateProfile(profile)
    setProfileErrors(errors)
    if (Object.keys(errors).length > 0) {
      setProfileMessage(null)
      return
    }
    const payload: Partial<User> = {
      firstName: profile.firstName.trim(),
      lastName: profile.lastName.trim(),
      phone: profile.phone.trim(),
      gender: profile.gender,
      ...(profile.birthDate ? { birthDate: profile.birthDate } : {}),
    }
    try {
      await updateUser.mutateAsync(payload)
      setProfileMessage({ type: 'success', text: 'Perfil actualizado correctamente.' })
    } catch {
      setProfileMessage({ type: 'error', text: 'No se pudieron guardar los cambios. Revisa tu conexión e inténtalo de nuevo.' })
    }
  }

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordMessage(null)
    if (passwords.next !== passwords.confirm) {
      setPasswordMessage('Las contraseñas nuevas no coinciden.')
      return
    }
    if (passwords.next.length < 8 || passwords.next.length > 128) {
      setPasswordMessage('La nueva contraseña debe tener entre 8 y 128 caracteres.')
      return
    }
    try {
      await changePassword.mutateAsync({ currentPassword: passwords.current, newPassword: passwords.next })
      setPasswords({ current: '', next: '', confirm: '' })
      navigate('/login', { replace: true, state: { notice: 'Contraseña actualizada. Inicia sesión con tu nueva contraseña.' } })
    } catch {
      setPasswordMessage('No se pudo cambiar la contraseña. Comprueba la contraseña actual e inténtalo de nuevo.')
    }
  }

  return (
    <div className="settings-page">
      <PageHeader title="Configuración" description="Administra los datos de tu cuenta y protege tu acceso." />
      {isLoading ? (
        <section className="settings-content settings-loading" aria-label="Cargando configuración" aria-busy="true">
          <Skeleton height="40px" />
          <Skeleton height="28px" width="35%" />
          <Skeleton height="48px" />
          <Skeleton height="48px" />
        </section>
      ) : !user ? (
        <Alert type="error" message="No se pudo cargar tu cuenta. Vuelve a iniciar sesión." />
      ) : (
        <section className="settings-content">
          <Tabs tabs={[{ id: 'profile', label: 'Perfil' }, { id: 'security', label: 'Seguridad' }]} activeTab={activeTab} onChange={(id) => setActiveTab(id as TabId)} ariaLabel="Configuración de cuenta" />
          <TabPanel id="profile" activeTab={activeTab} className="settings-panel">
            <div className="settings-section-heading"><h2>Datos del perfil</h2><p>Actualiza la información que identifica tu cuenta.</p></div>
            <dl className="account-facts">
              <div><dt>Correo electrónico</dt><dd>{user.email}</dd></div>
              <div><dt>Tipo de cuenta</dt><dd>{roleLabel(user.role)}</dd></div>
            </dl>
            {profileMessage && <Alert type={profileMessage.type} message={profileMessage.text} dismissible onDismiss={() => setProfileMessage(null)} />}
            <form className="settings-form" onSubmit={handleProfileSubmit}>
              <div className="form-row">
                <FormField id="firstName" label="Nombre" value={profile.firstName} onChange={updateProfile('firstName')} required maxLength={100} error={profileErrors.firstName} autoComplete="given-name" />
                <FormField id="lastName" label="Apellido" value={profile.lastName} onChange={updateProfile('lastName')} required maxLength={100} error={profileErrors.lastName} autoComplete="family-name" />
                <FormField id="phone" label="Teléfono" type="tel" value={profile.phone} onChange={updateProfile('phone')} maxLength={9} inputMode="numeric" placeholder="987654321" error={profileErrors.phone} autoComplete="tel" />
                <FormField id="birthDate" label="Fecha de nacimiento" type="date" value={profile.birthDate} onChange={updateProfile('birthDate')} min={MIN_BIRTH_DATE} max={todayDateKey()} error={profileErrors.birthDate} />
                <FormField id="gender" label="Género" type="select" value={profile.gender} onChange={updateProfile('gender')} emptyOptionLabel="Sin especificar" options={[{ value: 'masculino', label: 'Masculino' }, { value: 'femenino', label: 'Femenino' }, { value: 'otro', label: 'Otro' }]} />
              </div>
              <div className="settings-actions"><Button type="submit" loading={updateUser.isPending}>Guardar cambios</Button></div>
            </form>
          </TabPanel>
          <TabPanel id="security" activeTab={activeTab} className="settings-panel">
            <div className="settings-section-heading"><h2>Cambiar contraseña</h2><p>Al guardar, tendrás que iniciar sesión nuevamente.</p></div>
            {passwordMessage && <Alert type="error" message={passwordMessage} dismissible onDismiss={() => setPasswordMessage(null)} />}
            <form className="settings-form security-form" onSubmit={handlePasswordSubmit}>
              <FormField id="currentPassword" label="Contraseña actual" type="password" value={passwords.current} onChange={(current) => setPasswords((value) => ({ ...value, current }))} required autoComplete="current-password" />
              <FormField id="newPassword" label="Nueva contraseña" type="password" value={passwords.next} onChange={(next) => setPasswords((value) => ({ ...value, next }))} required autoComplete="new-password" helperText="Usa entre 8 y 128 caracteres." />
              <FormField id="confirmPassword" label="Confirmar nueva contraseña" type="password" value={passwords.confirm} onChange={(confirm) => setPasswords((value) => ({ ...value, confirm }))} required autoComplete="new-password" />
              <div className="settings-actions"><Button type="submit" loading={changePassword.isPending}>Cambiar contraseña</Button></div>
            </form>
          </TabPanel>
        </section>
      )}
    </div>
  )
}
