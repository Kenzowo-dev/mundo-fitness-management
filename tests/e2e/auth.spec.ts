import { expect, test } from '@playwright/test';
import { loginAsReception } from './helpers';

test('a member can register, log in, request a renewal, and log out', async ({ page }) => {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  const email = `e2e-member-${suffix}@example.test`;
  const password = 'MemberPass123!';

  await page.goto('/registro');
  await page.getByLabel('Nombre', { exact: true }).fill('Socio E2E');
  await page.getByLabel('Apellido', { exact: true }).fill('Mundo Fitness');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByLabel('Confirmar contraseña').fill(password);
  await page.getByLabel('Número de teléfono').fill('987654321');
  await page.getByLabel('Fecha de nacimiento').fill('1995-06-15');
  await page.getByLabel('Género').selectOption('otro');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page).toHaveURL(/\/portal$/);
  await expect(page.getByRole('heading', { name: 'Mis datos' })).toBeVisible({ timeout: 15000 });

  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL('/');

  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Correo electrónico' }).fill(email);
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/portal$/);
  await expect(page.getByRole('heading', { name: 'Mis datos' })).toBeVisible({ timeout: 15000 });

  const renewalPlan = page.locator('label', { hasText: 'Plan solicitado' }).locator('select');
  await expect(renewalPlan.locator('option').nth(1)).toBeAttached();
  await renewalPlan.selectOption({ index: 1 });
  await page.getByLabel('Comentario para recepción (opcional)').fill('Solicito renovar mi membresía.');
  await page.getByRole('button', { name: 'Solicitar renovación' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Solicitud enviada' })).toBeVisible();

  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL('/');

  await loginAsReception(page);
  await page.goto('/membresias');
  await page.getByRole('tab', { name: /Solicitudes web/ }).click();
  const renewalRow = page.getByRole('row').filter({ hasText: email });
  await expect(renewalRow).toBeVisible();
  await renewalRow.getByRole('button', { name: 'Marcar contactada' }).click();
  await expect(renewalRow.getByRole('button', { name: 'Marcar contactada' })).toBeDisabled();
});
