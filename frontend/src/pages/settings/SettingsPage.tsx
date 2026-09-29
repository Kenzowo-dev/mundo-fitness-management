import { useState } from 'react'
import { useAuth } from '../../context/useAuth'
import { useUpdateCurrentUser, useChangePassword } from '../../hooks/useApi'
import Button from '../../components/Button'
import FormField from '../../components/FormField'
import Alert from '../../components/Alert'
import PageHeader from '../../components/PageHeader'
import '../../styles/dashboard/SettingsPage.css'

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: '',
    birthDate: '',
    gender: '',
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const updateUserMutation = useUpdateCurrentUser()
  const changePasswordMutation = useChangePassword()

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateUserMutation.mutateAsync(profileData)
      showMessage('success', 'Perfil actualizado correctamente')
      refreshUser()
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Error al actualizar perfil')
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'Las contraseñas no coinciden')
      return
    }
    if (passwordData.newPassword.length < 8) {
      showMessage('error', 'La contraseña debe tener al menos 8 caracteres')
      return
    }
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })
      showMessage('success', 'Contraseña cambiada correctamente')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Error al cambiar contraseña')
    }
  }

  return (
    <div className="settings-page">
      <PageHeader title="Configuración" />

      {message && <Alert type={message.type} message={message.text} onDismiss={() => setMessage(null)} dismissible />}

      <div className="settings-layout">
        <nav className="settings-nav" role="tablist" aria-label="Secciones de configuración">
          <button
            role="tab"
            aria-selected={activeTab === 'profile'}
            id="tab-profile"
            aria-controls="panel-profile"
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => setActiveTab('profile')}
          >
            Perfil
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'security'}
            id="tab-security"
            aria-controls="panel-security"
            className={activeTab === 'security' ? 'active' : ''}
            onClick={() => setActiveTab('security')}
          >
            Seguridad
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'preferences'}
            id="tab-preferences"
            aria-controls="panel-preferences"
            className={activeTab === 'preferences' ? 'active' : ''}
            onClick={() => setActiveTab('preferences')}
          >
            Preferencias
          </button>
        </nav>

        <div className="settings-content">
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="settings-form" role="tabpanel" id="panel-profile" aria-labelledby="tab-profile">
              <div className="form-section">
                <h3>Información personal</h3>
                <div className="form-row">
                  <FormField
                    label="Nombre"
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={(value) => setProfileData(prev => ({ ...prev, firstName: value }))}
                    placeholder="Ingresa tu nombre"
                    required
                  />
                  <FormField
                    label="Apellido"
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={(value) => setProfileData(prev => ({ ...prev, lastName: value }))}
                    placeholder="Ingresa tu apellido"
                    required
                  />
                </div>
                <div className="form-row">
                  <FormField
                    label="Email"
                    type="email"
                    id="email-profile"
                    value={user?.email || ''}
                    disabled
                  />
                  <FormField
                    label="Rol"
                    type="text"
                    id="role-profile"
                    value={user?.role || ''}
                    disabled
                  />
                </div>
                <div className="form-row">
                  <FormField
                    label="Teléfono"
                    type="tel"
                    id="phone-profile"
                    value={profileData.phone}
                    onChange={(value) => setProfileData(prev => ({ ...prev, phone: value }))}
                    placeholder="Ej. 987654321"
                  />
                  <FormField
                    label="Fecha de nacimiento"
                    type="date"
                    id="birthDate-profile"
                    value={profileData.birthDate}
                    onChange={(value) => setProfileData(prev => ({ ...prev, birthDate: value }))}
                  />
                </div>
                <div className="form-row">
                  <FormField
                    label="Género"
                    type="select"
                    id="gender-profile"
                    value={profileData.gender}
                    onChange={(value) => setProfileData(prev => ({ ...prev, gender: value }))}
                    options={[
                      { value: '', label: 'Seleccionar' },
                      { value: 'masculino', label: 'Masculino' },
                      { value: 'femenino', label: 'Femenino' },
                      { value: 'otro', label: 'Otro' },
                    ]}
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit} className="settings-form" role="tabpanel" id="panel-security" aria-labelledby="tab-security">
              <div className="form-section">
                <h3>Cambiar contraseña</h3>
                <FormField
                  label="Contraseña actual"
                  type="password"
                  id="current-password"
                  value={passwordData.currentPassword}
                  onChange={(value) => setPasswordData(prev => ({ ...prev, currentPassword: value }))}
                  required
                />
                <FormField
                  label="Nueva contraseña"
                  type="password"
                  id="new-password"
                  value={passwordData.newPassword}
                  onChange={(value) => setPasswordData(prev => ({ ...prev, newPassword: value }))}
                  required
                />
                <FormField
                  label="Confirmar nueva contraseña"
                  type="password"
                  id="confirm-new-password"
                  value={passwordData.confirmPassword}
                  onChange={(value) => setPasswordData(prev => ({ ...prev, confirmPassword: value }))}
                  required
                />
              </div>

              <Button type="submit" variant="primary" disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending ? 'Cambiando...' : 'Cambiar contraseña'}
              </Button>
            </form>
          )}

          {activeTab === 'preferences' && (
            <div className="settings-form" id="panel-preferences" role="tabpanel" aria-labelledby="tab-preferences">
              <div className="form-section">
                <h3>Preferencias de notificaciones</h3>
                <div className="preference-item">
                  <label>
                    <input type="checkbox" defaultChecked /> Notificaciones por email
                  </label>
                </div>
                <div className="preference-item">
                  <label>
                    <input type="checkbox" defaultChecked /> Recordatorios de pagos
                  </label>
                </div>
                <div className="preference-item">
                  <label>
                    <input type="checkbox" defaultChecked /> Renovaciones de membresía
                  </label>
                </div>
                <div className="preference-item">
                  <label>
                    <input type="checkbox" /> Promociones y ofertas
                  </label>
                </div>
              </div>

              <div className="form-section">
                <h3>Apariencia</h3>
                <div className="preference-item">
                  <label>
                    Tema:
                    <select className="form-input" style={{ width: 'auto', marginLeft: '12px' }}>
                      <option value="dark">Oscuro</option>
                      <option value="light">Claro</option>
                      <option value="system">Sistema</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}