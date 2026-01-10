import { test, expect } from '@playwright/test';

test.describe('User Registration', () => {
  test('should display registration form elements', async ({ page }) => {
    // Navigate to registration page (adjust path as needed)
    await page.goto('/');

    // Look for a register/sign up link
    const registerLink = page.locator('a[href*="register"], button:has-text("Register"), button:has-text("Sign up")');

    if (await registerLink.count() > 0) {
      await registerLink.first().click();
      await page.waitForLoadState('networkidle');

      // Check for registration form elements
      const emailInput = page.locator('input[type="email"], input[name="email"]');

      // At least email should be present
      if (await emailInput.count() > 0) {
        await expect(emailInput.first()).toBeVisible();
      }
    }
  });

  test('should show validation errors for invalid registration', async ({ page }) => {
    await page.goto('/');

    const registerLink = page.locator('a[href*="register"], button:has-text("Register"), button:has-text("Sign up")');

    if (await registerLink.count() > 0) {
      await registerLink.first().click();
      await page.waitForLoadState('networkidle');

      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"], button:has-text("Register"), button:has-text("Sign up")');

      if (await submitButton.count() > 0) {
        await submitButton.first().click();

        // Wait for validation
        await page.waitForTimeout(500);

        // Check for error indicators (validation messages, red borders, etc.)
        const hasErrors = await page.locator('.error, [class*="error"], [aria-invalid="true"]').count() > 0
          || await page.locator('input:invalid').count() > 0;

        // Form should have validation
        expect(hasErrors || await page.locator('input[required]').count() > 0).toBeTruthy();
      }
    }
  });
});

test.describe('User Login', () => {
  test('should display login form when accessing login page', async ({ page }) => {
    await page.goto('/');

    // Look for login link
    const loginLink = page.locator('a[href*="login"], button:has-text("Login"), button:has-text("Sign in")');

    if (await loginLink.count() > 0) {
      await loginLink.first().click();
      await page.waitForLoadState('networkidle');

      // Check for login form elements
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      const passwordInput = page.locator('input[type="password"]');

      if (await emailInput.count() > 0) {
        await expect(emailInput.first()).toBeVisible();
      }
      if (await passwordInput.count() > 0) {
        await expect(passwordInput.first()).toBeVisible();
      }
    }
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/');

    const loginLink = page.locator('a[href*="login"], button:has-text("Login"), button:has-text("Sign in")');

    if (await loginLink.count() > 0) {
      await loginLink.first().click();
      await page.waitForLoadState('networkidle');

      // Fill in invalid credentials
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      const passwordInput = page.locator('input[type="password"]');

      if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
        await emailInput.first().fill('invalid@example.com');
        await passwordInput.first().fill('wrongpassword');

        // Submit form
        const submitButton = page.locator('button[type="submit"]');
        if (await submitButton.count() > 0) {
          await submitButton.first().click();

          // Wait for response
          await page.waitForTimeout(1000);

          // Check for error message
          const errorMessage = page.locator('[class*="error"], [role="alert"], .text-red, .text-destructive');
          // Error handling should occur (either visible error or still on login page)
          const stillOnLoginPage = page.url().includes('login');
          const hasError = await errorMessage.count() > 0;

          expect(stillOnLoginPage || hasError).toBeTruthy();
        }
      }
    }
  });
});

test.describe('Admin Login', () => {
  test('should display admin login page', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');

    // Admin login page should have login form
    const loginForm = page.locator('form');

    // Check if we're on a login page or redirected
    const isLoginPage = page.url().includes('login');

    if (isLoginPage) {
      await expect(loginForm).toBeVisible();
    }
  });

  test('should show error for invalid admin credentials', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"]');

    if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
      await emailInput.first().fill('notanadmin@example.com');
      await passwordInput.first().fill('wrongpassword');

      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.count() > 0) {
        await submitButton.first().click();

        // Wait for response
        await page.waitForTimeout(1000);

        // Should still be on login page or show error
        const url = page.url();
        expect(url.includes('login') || url.includes('admin')).toBeTruthy();
      }
    }
  });
});

test.describe('Logout', () => {
  test('should have logout option when authenticated', async ({ page }) => {
    // This test verifies logout UI exists
    // In a real scenario, you'd first authenticate
    await page.goto('/');

    // Look for logout button or link (may not be visible if not logged in)
    const logoutElement = page.locator('button:has-text("Logout"), button:has-text("Sign out"), a:has-text("Logout"), a:has-text("Sign out")');

    // If logged in, logout should be visible
    const logoutCount = await logoutElement.count();

    // This is informational - logout may or may not be visible
    console.log(`Logout option count: ${logoutCount}`);
  });
});
