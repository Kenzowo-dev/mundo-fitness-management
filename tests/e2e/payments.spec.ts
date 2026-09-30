import { expect, test } from '@playwright/test';
import { createClient, createPlan, loginAsReception } from './helpers';

test('reception can record a payment and find it in payment history', async ({ page }) => {
  await loginAsReception(page);
  const client = await createClient(page);
  const planName = await createPlan(page);

  await page.getByRole('button', { name: 'Asignar membresía a socio' }).click();
  await page.getByLabel(/Seleccione el Socio/).selectOption({ label: client.optionLabel });
  const planOption = page.locator('#assign-plan option').filter({ hasText: planName });
  await page.getByLabel(/Seleccione el Plan/).selectOption(await planOption.getAttribute('value') ?? '');
  await page.getByRole('button', { name: 'Activar Membresía' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Membresía asignada correctamente al socio.' })).toBeVisible();

  await page.goto('/pagos');
  await page.getByRole('button', { name: 'Registrar nuevo pago' }).click();
  await page.getByLabel('Socio').selectOption({ label: client.paymentOptionLabel });
  const membershipOption = page.locator('#payment-membership option').filter({ hasText: planName });
  await expect(membershipOption).toBeAttached();
  await page.getByLabel('Membresía asociada').selectOption(await membershipOption.getAttribute('value') ?? '');
  await page.getByLabel(/Monto/).fill('59.90');
  await page.getByLabel('Método de Pago').selectOption('cash');
  await page.getByText('Agregar descripción (opcional)').click();
  await page.getByLabel('Descripción del pago').fill('Pago E2E de membresía');
  await page.getByRole('button', { name: 'Confirmar Cobro' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Pago registrado como recibido. No se procesó ningún cobro electrónico.' })).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: client.firstName })).toContainText('59.90');
});
