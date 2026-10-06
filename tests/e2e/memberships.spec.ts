import { expect, test } from '@playwright/test';
import { createClient, createPlan, loginAsReception } from './helpers';

test('membership page fetches subscriptions with one batched request', async ({ page }) => {
  await loginAsReception(page);
  const membershipApiCalls: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.origin === 'http://localhost:3000' && url.pathname.startsWith('/api/memberships')) {
      membershipApiCalls.push(url.pathname);
    }
  });

  await page.goto('/membresias');
  await expect(page.getByRole('heading', { name: 'Membresías', exact: true }).first()).toBeVisible();
  await expect.poll(() => membershipApiCalls.filter((path) => path === '/api/memberships').length).toBe(1);
  expect(membershipApiCalls.filter((path) => /^\/api\/memberships\/client\/\d+$/.test(path))).toEqual([]);
});

test('reception can create a plan, assign it, and check a member in', async ({ page }) => {
  await loginAsReception(page);
  const client = await createClient(page);
  const planName = await createPlan(page);

  await page.getByRole('button', { name: 'Asignar membresía a socio' }).click();
  await page.getByLabel(/Seleccione el Socio/).selectOption({ label: client.optionLabel });
  const planOption = page.locator('#assign-plan option').filter({ hasText: planName });
  await page.getByLabel(/Seleccione el Plan/).selectOption(await planOption.getAttribute('value') ?? '');
  await page.getByRole('button', { name: 'Activar Membresía' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Membresía asignada correctamente al socio.' })).toBeVisible();

  await page.getByRole('button', { name: 'Registrar ingreso de socio' }).click();
  await page.getByRole('dialog', { name: 'Registrar ingreso de socio' }).getByLabel(/Seleccione el Socio/).selectOption({ label: client.optionLabel });
  await page.getByRole('dialog').getByRole('button', { name: 'Registrar Ingreso' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Ingreso registrado. El acceso al gimnasio está habilitado.' })).toBeVisible();

  await page.goto('/dashboard');
  await expect(page.getByLabel('Check-ins de hoy')).toHaveText(/^[1-9]\d*$/);
});
