import { expect, test } from '@playwright/test';
import { createClient, createPlan, loginAsReception } from './helpers';

test('reception can create a plan, assign it, and check a member in', async ({ page }) => {
  await loginAsReception(page);
  const client = await createClient(page);
  const planName = await createPlan(page);

  await page.getByRole('button', { name: 'Asignar Membresía a socio' }).click();
  await page.getByLabel('Seleccione el Socio').selectOption({ label: client.optionLabel });
  const planOption = page.locator('#assign-plan option').filter({ hasText: planName });
  await page.getByLabel('Seleccione el Plan').selectOption(await planOption.getAttribute('value') ?? '');
  await page.getByRole('button', { name: 'Activar Membresía' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Membresía asignada exitosamente' })).toBeVisible();

  await page.getByRole('button', { name: 'Registrar Check-In de socio' }).click();
  await page.getByLabel('Seleccione el Socio').selectOption({ label: client.optionLabel });
  await page.getByRole('button', { name: 'Registrar Ingreso' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Check-in registrado exitosamente' })).toBeVisible();

  await page.goto('/dashboard');
  await expect(page.getByLabel('Check-ins de hoy')).toHaveText(/^[1-9]\d*$/);
});
