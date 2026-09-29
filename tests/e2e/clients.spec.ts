import { test, expect } from '@playwright/test';

test.describe('Client Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Credenciales del seed: admin@mundofitness.com / Admin1234!
    await page.fill('input[type="email"], input[name="email"]', 'admin@mundofitness.com');
    await page.fill('input[type="password"], input[name="password"]', 'Admin1234!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');
  });

  test('should display clients list page', async ({ page }) => {
    await expect(page.locator('h1, h2')).toContainText(/Clientes|Gestión de Clientes/i);
    await expect(page.locator('table, .table')).toBeVisible();
  });

  test('should open create client modal', async ({ page }) => {
    await page.click('button:has-text("Nuevo Cliente"), button:has-text("Registrar"), button:has-text("+")');
    await expect(page.locator('[role="dialog"], .modal')).toBeVisible();
    await expect(page.locator('h2, h3')).toContainText(/Registrar|Nuevo Cliente/i);
  });

  test('should create a new client', async ({ page }) => {
    const uniqueDni = `7${Date.now().toString().slice(-7)}`;
    
    await page.click('button:has-text("Nuevo Cliente"), button:has-text("Registrar"), button:has-text("+")');
    await page.waitForSelector('[role="dialog"], .modal');
    
    await page.fill('input[name="dni"], input[placeholder*="DNI"], input[id*="dni"]', uniqueDni);
    await page.fill('input[name="firstName"], input[placeholder*="Nombre"], input[id*="name"]', 'Carlos');
    await page.fill('input[name="lastName"], input[placeholder*="Apellido"], input[id*="lastname"]', 'García');
    await page.fill('input[name="email"], input[type="email"]', `carlos.${uniqueDni}@example.com`);
    await page.fill('input[name="phone"], input[placeholder*="Teléfono"]', '+51987654321');
    
    await page.click('button[type="submit"]:has-text("Registrar"), button[type="submit"]:has-text("Guardar")');
    
    await expect(page.locator('.success, .toast, [role="alert"]')).toContainText(/registrado|creado|éxito/i);
    
    await page.waitForSelector('table tbody tr:has-text("Carlos")', { timeout: 10000 });
    await expect(page.locator('table tbody tr:has-text("Carlos")')).toBeVisible();
  });

  test('should search clients', async ({ page }) => {
    await page.fill('input[placeholder*="Buscar"], input[name="search"]', 'Carlos');
    await page.click('button[type="submit"]:has-text("Buscar"), button:has-text("Buscar")');
    await page.waitForLoadState('networkidle');
    
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    if (count > 0) {
      await expect(rows.first()).toContainText('Carlos');
    }
  });

  test('should filter by status', async ({ page }) => {
    await page.selectOption('select[name="status"], select[id*="status"]', 'active');
    await page.click('button[type="submit"]:has-text("Buscar"), button:has-text("Buscar")');
    await page.waitForLoadState('networkidle');
    
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    if (count > 0) {
      for (const row of await rows.all()) {
        await expect(row.locator('.badge, .status, [class*="status"]')).toContainText(/activo|active/i);
      }
    }
  });

  test('should view client details', async ({ page }) => {
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    
    if (count > 0) {
      await rows.first().locator('button[aria-label*="Ver"], button:has-text("👁")').click();
      await expect(page.locator('[role="dialog"], .modal')).toBeVisible();
      await expect(page.locator('h2, h3')).toContainText(/Ficha|Detalle|Cliente/i);
    }
  });
});