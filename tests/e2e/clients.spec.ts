import { expect, test } from '@playwright/test';
import { loginAsReception } from './helpers';

test('reception can create, edit, and find a client', async ({ page }) => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const dni = `8${suffix.slice(-7)}`;
  const firstName = `Socio${suffix.slice(-4)}`;

  await loginAsReception(page);
  await page.goto('/clientes');
  await page.getByRole('button', { name: 'Registrar nuevo cliente' }).click();
  await expect(page.getByRole('dialog', { name: 'Registrar Nuevo Cliente' })).toBeVisible();
  await page.getByLabel('DNI / Documento').fill(dni);
  await page.getByLabel('Nombres').fill(firstName);
  await page.getByLabel('Apellidos').fill('Prueba E2E');
  await page.getByLabel('Correo Electrónico').fill(`e2e-${suffix}@example.test`);
  await page.getByRole('button', { name: 'Registrar Cliente' }).click();

  await page.getByRole('textbox', { name: 'Buscar clientes' }).fill(dni);
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  const row = page.getByRole('row').filter({ hasText: dni });
  await expect(row).toBeVisible();

  await row.getByRole('button', { name: `Editar ${firstName}` }).click();
  await page.getByLabel('Teléfono / WhatsApp').fill('+51999990000');
  await page.getByRole('button', { name: 'Guardar Cambios' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('row').filter({ hasText: dni })).toContainText('+51999990000');
});
