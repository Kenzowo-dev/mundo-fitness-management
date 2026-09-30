import { expect, test } from '@playwright/test';
import { loginAsReception } from './helpers';

test('public home stays public and seeded admin can reach the dashboard', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });

  await page.goto('/');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { level: 1, name: /TRANSFORMA TU/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Iniciar sesión' }).first()).toHaveAttribute('href', '/login');
  await expect(page.getByLabel('Navegación principal')).toBeVisible();

  await loginAsReception(page);

  expect(browserErrors).toEqual([]);
});
