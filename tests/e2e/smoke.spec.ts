import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { loginAsAdmin } from './helpers';

test('public home stays public and seeded admin can reach the dashboard', async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));

  await page.goto('/');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { level: 1, name: /Tu próxima versión/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Iniciar sesión' }).first()).toHaveAttribute('href', '/login');
  await expect(page.getByLabel('Navegación principal')).toBeVisible();

  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill('admin@mundofitness.com');
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('wrong-password');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('alert')).toHaveText('El correo electrónico o la contraseña no son correctos.');

  await loginAsAdmin(page);

  expect(runtimeErrors).toEqual([]);
});

test('request ID passes through gateway and auth service', async ({ request }) => {
  const requestId = `phase22-${randomUUID()}`;
  const response = await request.post('http://localhost:3000/api/auth/login', {
    headers: { 'x-request-id': requestId },
    data: { email: 'phase22-invalid@example.com', password: 'invalid-password' },
  });

  expect(response.status()).toBe(401);
  expect(response.headers()['x-request-id']).toBe(requestId);
});
