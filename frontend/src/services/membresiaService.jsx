const BASE_URL = 'http://localhost:3000/api/memberships'

// Obtener todas las membresías
export async function getMembresias() {
  const response = await fetch(BASE_URL)

  if (!response.ok) {
    throw new Error('No se pudieron obtener las membresías')
  }

  return response.json()
}

// Obtener una membresía por su id
export async function getMembresiaById(id) {
  const response = await fetch(`${BASE_URL}/${id}`)

  if (!response.ok) {
    throw new Error('No se pudo obtener la membresía')
  }

  return response.json()
}

// Crear una nueva membresía
export async function createMembresia(data) {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('No se pudo registrar la membresía')
  }

  return response.json()
}

// Actualizar una membresía existente
export async function updateMembresia(id, data) {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('No se pudo actualizar la membresía')
  }

  return response.json()
}

// Eliminar una membresía
export async function deleteMembresia(id) {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('No se pudo eliminar la membresía')
  }
}
