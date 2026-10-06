import { expect, test } from '@playwright/test';

const apiUrl = process.env.E2E_API_URL || 'http://localhost:3000';

test('live public catalog reaches the UI while private plans stay protected', async ({ page, request }, testInfo) => {
  const network: { method: string; path: string; status: number }[] = [];
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.pathname.startsWith('/api/')) network.push({
      method: response.request().method(), path: url.pathname, status: response.status(),
    });
  });
  const response = await request.get(`${apiUrl}/api/memberships/plans/public`);
  expect(response.status()).toBe(200);
  const plans = await response.json();
  expect(Array.isArray(plans)).toBe(true);
  expect(plans.length).toBeGreaterThan(0);
  for (const plan of plans) {
    const allowedFields = [
      'currency', 'description', 'durationDays', 'features', 'id',
      'includesClasses', 'includesSauna', 'maxVisitsPerWeek', 'name', 'price',
    ];
    expect(Object.keys(plan).every(key => allowedFields.includes(key))).toBe(true);
    expect(plan).toEqual(expect.objectContaining({
      id: expect.any(Number), name: expect.any(String), price: expect.any(Number),
      durationDays: expect.any(Number), currency: expect.any(String),
      features: expect.any(Array),
    }));
  }
  for (const path of ['/api/memberships/plans', '/api/memberships/stats',
    '/api/memberships/requests', '/api/clients', '/api/payments']) {
    const protectedResponse = await request.get(`${apiUrl}${path}`);
    expect(protectedResponse.status(), path).toBe(401);
  }

  const runtimeErrors: string[] = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  const catalogResponse = page.waitForResponse(response =>
    new URL(response.url()).pathname === '/api/memberships/plans/public');
  await page.goto('/');
  expect((await catalogResponse).status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1, name: /Tu próxima versión/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: plans[0].name, exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Me interesa este plan' }).first())
    .toHaveAttribute('href', `/registro?plan=${plans[0].id}`);
  await page.screenshot({ path: testInfo.outputPath('public-live-catalog.png'), fullPage: true });
  await page.getByRole('link', { name: 'Me interesa este plan' }).first().click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/registro');
  expect(new URL(page.url()).searchParams.get('plan')).toBe(String(plans[0].id));
  await expect(page.getByText(plans[0].name, { exact: false }).last()).toBeVisible();
  expect(runtimeErrors).toEqual([]);
  await testInfo.attach('api-statuses', {
    body: JSON.stringify(network, null, 2), contentType: 'application/json',
  });
});
