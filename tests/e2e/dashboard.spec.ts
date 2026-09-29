import { test, expect } from '@playwright/test';

test.describe('Dashboard Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Credenciales del seed: admin@mundofitness.com / Admin1234!
    await page.fill('input[type="email"], input[name="email"]', 'admin@mundofitness.com');
    await page.fill('input[type="password"], input[name="password"]', 'Admin1234!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should display dashboard with stats', async ({ page }) => {
    await expect(page.locator('h1, h2')).toContainText(/Dashboard|Panel|Bienvenido/i);
    
    const statCards = page.locator('.stat-card, .stat, [class*="stat"]');
    await expect(statCards.first()).toBeVisible();
  });

  test('should display quick action cards', async ({ page }) => {
    const actionCards = page.locator('a[href*="clientes"], a[href*="membresias"], a[href*="planes"], a[href*="pagos"]');
    await expect(actionCards.first()).toBeVisible();
  });

  test('should navigate to clients page', async ({ page }) => {
    await page.click('a[href*="clientes"], button:has-text("Clientes")');
    await expect(page).toHaveURL(/.*clientes/);
    await expect(page.locator('h1, h2')).toContainText(/Clientes|Gestión de Clientes/i);
  });

  test('should navigate to memberships page', async ({ page }) => {
    await page.click('a[href*="membresias"], button:has-text("Membresías")');
    await expect(page).toHaveURL(/.*membresias/);
    await expect(page.locator('h1, h2')).toContainText(/Membresías|Memberships/i);
  });

  test('should navigate to plans page', async ({ page }) => {
    await page.click('a[href*="planes"], button:has-text("Planes")');
    await expect(page).toHaveURL(/.*planes/);
    await expect(page.locator('h1, h2')).toContainText(/Planes|Entrenamiento/i);
  });

  test('should navigate to payments page', async ({ page }) => {
    await page.click('a[href*="pagos"], button:has-text("Pagos")');
    await expect(page).toHaveURL(/.*pagos/);
    await expect(page.locator('h1, h2')).toContainText(/Pagos|Caja|Facturación/i);
  });
});