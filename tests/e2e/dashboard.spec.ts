import { expect, test } from '@playwright/test';
import { loginAsReception } from './helpers';

test('reception can review dashboard metrics and operational reports', async ({ page }) => {
  await loginAsReception(page);
  await expect(page.getByRole('heading', { name: /Bienvenido/ })).toBeVisible();
  await expect(page.getByLabel('Indicadores del gimnasio')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Socios activos' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Membresías vigentes' })).toBeVisible();

  await page.getByRole('link', { name: 'Informes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Informes', exact: true }).first()).toBeVisible();
  await expect(page.getByRole('img', { name: /Socios por estado/ })).toBeVisible();
  await expect(page.getByRole('img', { name: /Membresías por estado/ })).toBeVisible();
  await expect(page.getByRole('img', { name: /Check-ins por día/ })).toBeVisible();
});
