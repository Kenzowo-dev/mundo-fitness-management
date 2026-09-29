import { test, expect } from '@playwright/test';

test.describe('Payment Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Credenciales del seed: admin@mundofitness.com / Admin1234!
    await page.fill('input[type="email"], input[name="email"]', 'admin@mundofitness.com');
    await page.fill('input[type="password"], input[name="password"]', 'Admin1234!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/pagos');
    await page.waitForLoadState('networkidle');
  });

  test('should display payments page with tabs', async ({ page }) => {
    await expect(page.locator('h1, h2')).toContainText(/Pagos|Caja|Facturación/i);
    await expect(page.locator('[role="tablist"], .tabs')).toBeVisible();
    await expect(page.locator('[role="tab"]')).toHaveCount(2);
  });

  test('should display payments history tab', async ({ page }) => {
    await expect(page.locator('[role="tabpanel"] table, .table')).toBeVisible();
    const headers = page.locator('th');
    await expect(headers).toContainText(['Socio', 'Monto', 'Método', 'Estado']);
  });

  test('should switch to invoices tab', async ({ page }) => {
    await page.click('[role="tab"]:has-text("Facturas"), [role="tab"]:has-text("Invoices")');
    await expect(page.locator('[role="tabpanel"] table, .table')).toBeVisible();
    const headers = page.locator('th');
    await expect(headers).toContainText(['Número', 'Socio', 'Monto', 'Vencimiento']);
  });

  test('should open create payment modal', async ({ page }) => {
    await page.click('button:has-text("Registrar Pago"), button:has-text("Cobro"), button:has-text("+ Pago")');
    await expect(page.locator('[role="dialog"], .modal')).toBeVisible();
    await expect(page.locator('h2, h3')).toContainText(/Registrar Pago|Cobro/i);
  });

  test('should create a new payment', async ({ page }) => {
    await page.click('button:has-text("Registrar Pago"), button:has-text("Cobro"), button:has-text("+ Pago")');
    await page.waitForSelector('[role="dialog"], .modal');
    
    await page.selectOption('select[name="clientId"], select[id*="client"]', { index: 1 });
    await page.fill('input[name="amount"], input[placeholder*="Monto"], input[id*="amount"]', '49.99');
    await page.selectOption('select[name="paymentMethod"], select[id*="method"]', 'credit_card');
    await page.fill('input[name="description"], input[placeholder*="Descripción"]', 'Pago mensualidad Enero');
    
    await page.click('button[type="submit"]:has-text("Confirmar"), button:has-text("Cobrar")');
    
    await expect(page.locator('.success, .toast, [role="alert"]')).toContainText(/pago|cobro|éxito/i);
  });

  test('should validate payment form', async ({ page }) => {
    await page.click('button:has-text("Registrar Pago"), button:has-text("Cobro"), button:has-text("+ Pago")');
    await page.waitForSelector('[role="dialog"], .modal');
    
    await page.click('button[type="submit"]:has-text("Confirmar"), button:has-text("Cobrar")');
    
    await expect(page.locator('.error, [role="alert"], .text-red')).toBeVisible();
  });

  test('should filter payments by status', async ({ page }) => {
    await page.selectOption('select[name="status"], select[id*="status"]', 'completed');
    await page.click('button[type="submit"]:has-text("Buscar"), button:has-text("Buscar")');
    await page.waitForLoadState('networkidle');
    
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    if (count > 0) {
      for (const row of await rows.all()) {
        await expect(row.locator('.badge, .status')).toContainText(/completado|completed/i);
      }
    }
  });
});