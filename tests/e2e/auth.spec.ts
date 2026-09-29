import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.locator('h1, h2')).toContainText(/Iniciar Sesión|Login|Bienvenido/i);
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.locator('.error, [role="alert"], .text-red')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"], input[name="email"]', 'invalid@test.com');
    await page.fill('input[type="password"], input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.error, [role="alert"], .text-red')).toContainText(/credenciales|invalid|incorrect/i);
  });

  test('should navigate to register page', async ({ page }) => {
    await page.click('a:has-text("Registrar"), a:has-text("Crear cuenta"), a:has-text("Sign up")');
    await expect(page).toHaveURL(/.*registro/);
  });
});

test.describe('User Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/registro');
    await page.waitForLoadState('networkidle');
  });

  test('should display registration form with all fields', async ({ page }) => {
    await expect(page.locator('input[name="firstName"], input[placeholder*="Nombre"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"], input[placeholder*="Apellido"]')).toBeVisible();
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"], input[type="password"]')).toBeVisible();
    // DNI field removed - now auto-generated from userId
    // await expect(page.locator('input[name="dni"], input[placeholder*="DNI"]')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.locator('.error, [role="alert"], .text-red')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'SecurePass123');
    await page.click('button[type="submit"]');
    await expect(page.locator('.error, [role="alert"], .text-red')).toContainText(/email|correo/i);
  });

  test('should validate password strength', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', '123');
    await page.click('button[type="submit"]');
    await expect(page.locator('.error, [role="alert"], .text-red')).toContainText(/8 caracteres|8 characters|password/i);
  });
});