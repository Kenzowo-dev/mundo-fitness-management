import { expect, type Page } from '@playwright/test';

const adminEmail = 'admin@mundofitness.com';
const adminPassword = 'Admin1234!';

function uniqueSuffix() {
  return `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
}

export async function loginAsReception(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(adminEmail);
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(adminPassword);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: /Bienvenido/ })).toBeVisible();
}

export async function createClient(page: Page) {
  const suffix = uniqueSuffix();
  const firstName = `Cliente${suffix.slice(-5)}`;
  const lastName = 'Prueba E2E';
  const dni = `7${suffix.slice(-7)}`;
  const optionLabel = `${firstName} ${lastName} - DNI: ${dni}`;
  const paymentOptionLabel = `${firstName} ${lastName} (DNI: ${dni})`;

  await page.goto('/clientes');
  await page.getByRole('button', { name: 'Registrar nuevo cliente' }).click();
  await page.getByLabel('DNI / Documento').fill(dni);
  await page.getByLabel('Nombres').fill(firstName);
  await page.getByLabel('Apellidos').fill(lastName);
  await page.getByRole('button', { name: 'Registrar Cliente' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('row').filter({ hasText: dni })).toBeVisible();

  return { firstName, lastName, dni, optionLabel, paymentOptionLabel };
}

export async function createPlan(page: Page) {
  const planName = `Plan E2E ${uniqueSuffix()}`;
  await page.goto('/membresias');
  await page.getByRole('button', { name: 'Crear plan de membresía' }).click();
  await page.getByLabel('Nombre del plan').fill(planName);
  await page.getByLabel('Duración en días').fill('30');
  await page.getByLabel('Precio').fill('59.90');
  await page.getByRole('button', { name: 'Crear plan', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: planName })).toBeVisible();
  return planName;
}
