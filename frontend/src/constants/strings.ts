export const STRINGS = {
  auth: {
  loginError:
    'No se pudo iniciar sesión.',
  loginRequiredFields:
    'Ingresa tu correo y contraseña.',
  registerError:
    'No se pudo crear la cuenta.',
  registerSuccess:
    'Cuenta creada correctamente. Ya puedes comenzar.',
  requiredFields:
    'Por favor, completa todos los campos.',
  passwordMismatch:
    'Las contraseñas no coinciden.',
  passwordMinLength:
    'La contraseña debe tener al menos 6 caracteres.',
},

  membership: {
  notFound:
    'Membresía no encontrada',
  activeMembershipExists:
    'El usuario ya tiene una membresía activa',
  anotherActiveMembershipExists:
    'El usuario ya tiene otra membresía activa',
  loadError:
    'No se pudieron cargar las membresías.',
  loadOneError:
    'No se pudo cargar la membresía',
  createError:
    'No se pudo registrar la membresía',
  createSuccess:
    'Membresía registrada correctamente',
  updateError:
    'No se pudo actualizar la membresía',
  deleteError:
    'No se pudo eliminar la membresía',
  invalidPlan:
    'Selecciona un plan válido.',
  calculateEndDateError:
    'No se pudo calcular la fecha de finalización.',
  deleteConfirmation:
    '¿Seguro que deseas eliminar esta membresía?',
},

  plan: {
  duplicateName:
    'Ya existe un plan con ese nombre',
  notFound:
    'Plan no encontrado',
  duplicateOtherName:
    'Ya existe otro plan con ese nombre',
  loadError:
    'No se pudieron cargar los planes.',
  createError:
    'No se pudo crear el plan',
  updateError:
    'No se pudo actualizar el plan',
  toggleStatusError:
    'No se pudo cambiar el estado del plan',
  invalidName:
    'Ingresa un nombre para el plan.',
  invalidDuration:
    'La duración debe ser un número entero mayor que 0.',
  invalidPrice:
    'El precio debe ser un número válido.',
  toggleStatusConfirmation: (
    action: string,
    name: string,
  ) =>
    `¿Seguro que deseas ${action} el plan ${name}?`,
},

  user: {
    duplicateEmail:
      'Ya existe un usuario con ese correo.',
    invalidCredentials:
      'Correo o contraseña incorrectos.',
    notFound:
      'Usuario no encontrado.',
    deleteError:
      'No se pudo eliminar el usuario',
    deleteConfirmation: (
      name: string,
    ) =>
      `¿Seguro que deseas eliminar a ${name}?`,
    planConfirmation: (
      planName: string,
      price: number,
    ) =>
      `¿Deseas seleccionar el plan ${planName} por S/ ${price}?`,
    membershipSuccess:
      'Membresía registrada correctamente',
    membershipError:
      'No se pudo registrar la membresía',
  },
} as const