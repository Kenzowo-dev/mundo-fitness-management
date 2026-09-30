import { expect, type Page } from '@playwright/test';

const adminEmail = 'admin@mundofitness.com';
const adminPassword = 'Admin1234!';
const receptionEmail = 'recepcion@mundofitness.com';

function uniqueSuffix() {
  return `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
}

export async function loginAsReception(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(receptionEmail);
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(adminPassword);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: /Bienvenido/ })).toBeVisible();
}

export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(adminEmail);
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(adminPassword);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

export async function createClient(page: Page) {
  const suffix = uniqueSuffix();
  const firstName = `Cliente${suffix.slice(-5)}`;
  const lastName = 'Prueba E2E';
  const dni = `7${suffix.slice(-7)}`;
  const optionLabel = `${firstName} ${lastName} - DNI: ${dni}`;
  const paymentOptionLabel = `${firstName} ${lastName} · DNI ${dni}`;

  await page.goto('/clientes');
  await page.getByRole('button', { name: 'Registrar nuevo socio' }).click();
  await page.getByLabel(/DNI/).fill(dni);
  await page.getByLabel('Nombres').fill(firstName);
  await page.getByLabel('Apellidos').fill(lastName);
  await page.getByRole('button', { name: 'Registrar socio', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('row').filter({ hasText: dni })).toBeVisible();

  return { firstName, lastName, dni, optionLabel, paymentOptionLabel };
}

export async function createPlan(page: Page) {
  const planName = `Plan E2E ${uniqueSuffix()}`;
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL('/login');
  await loginAsAdmin(page);
  await page.goto('/membresias');
  await page.getByRole('tab', { name: /^Planes/ }).click();
  await page.getByRole('tabpanel', { name: 'Planes' }).getByRole('button', { name: 'Crear plan', exact: true }).click();
  await page.getByLabel('Nombre del plan').fill(planName);
  await page.getByLabel('Duración en días').fill('30');
  await page.getByLabel('Precio').fill('59.90');
  await page.getByRole('dialog').getByRole('button', { name: 'Crear plan', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: planName })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL('/login');
  await loginAsReception(page);
  await page.goto('/membresias');
  return planName;
}
