import { test, expect } from '@playwright/test';

test.describe('Membership Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Credenciales del seed: admin@mundofitness.com / Admin1234!
    await page.fill('input[type="email"], input[name="email"]', 'admin@mundofitness.com');
    await page.fill('input[type="password"], input[name="password"]', 'Admin1234!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/membresias');
    await page.waitForLoadState('networkidle');
  });

  test('should display memberships page with tabs', async ({ page }) => {
    await expect(page.locator('h1, h2')).toContainText(/Membresías|Memberships/i);
    await expect(page.locator('[role="tablist"], .tabs')).toBeVisible();
    await expect(page.locator('[role="tab"]')).toHaveCount(2);
  });

  test('should display membership plans tab', async ({ page }) => {
    await expect(page.locator('[role="tabpanel"] table, .table')).toBeVisible();
    const headers = page.locator('th');
    await expect(headers).toContainText(['Nombre', 'Duración', 'Precio']);
  });

  test('should switch to client memberships tab', async ({ page }) => {
    await page.click('[role="tab"]:has-text("Suscripciones"), [role="tab"]:has-text("Memberships")');
    await expect(page.locator('[role="tabpanel"] table, .table')).toBeVisible();
  });

  test('should open check-in modal', async ({ page }) => {
    await page.click('button:has-text("Check-in"), button:has-text("Registrar Check-in")');
    await expect(page.locator('[role="dialog"], .modal')).toBeVisible();
    await expect(page.locator('h2, h3')).toContainText(/Check-in|Control de Acceso/i);
  });

  test('should register check-in for client', async ({ page }) => {
    await page.click('button:has-text("Check-in"), button:has-text("Registrar Check-in")');
    await page.waitForSelector('[role="dialog"], .modal');
    
    await page.selectOption('select[name="clientId"], select[id*="client"]', { index: 1 });
    await page.click('button[type="submit"]:has-text("Registrar"), button:has-text("Ingreso")');
    
    await expect(page.locator('.success, .toast, [role="alert"]')).toContainText(/check-in|ingreso|éxito/i);
  });

  test('should open assign membership modal', async ({ page }) => {
    await page.click('button:has-text("Asignar Membresía"), button:has-text("Asignar")');
    await expect(page.locator('[role="dialog"], .modal')).toBeVisible();
    await expect(page.locator('h2, h3')).toContainText(/Asignar Membresía/i);
  });

  test('should assign membership to client', async ({ page }) => {
    await page.click('button:has-text("Asignar Membresía"), button:has-text("Asignar")');
    await page.waitForSelector('[role="dialog"], .modal');
    
    await page.selectOption('select[name="clientId"], select[id*="client"]', { index: 1 });
    await page.selectOption('select[name="planId"], select[id*="plan"]', { index: 1 });
    await page.click('button[type="submit"]:has-text("Activar"), button:has-text("Asignar")');
    
    await expect(page.locator('.success, .toast, [role="alert"]')).toContainText(/asignado|activado|éxito/i);
  });
});