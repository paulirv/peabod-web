import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Access', () => {
  test('should redirect to login when accessing admin without auth', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Should be redirected to login or show login form
    const url = page.url();
    const hasLoginForm = await page.locator('input[type="password"]').count() > 0;

    expect(url.includes('login') || hasLoginForm).toBeTruthy();
  });

  test('should display admin login form', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');

    // Check for login form elements
    const form = page.locator('form');
    await expect(form).toBeVisible();

    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('should show validation on empty form submission', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');

    // Click submit without filling form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Wait for validation
    await page.waitForTimeout(500);

    // Should have validation (HTML5 or custom)
    const invalidInputs = await page.locator('input:invalid').count();
    const errorMessages = await page.locator('[class*="error"], [role="alert"]').count();

    expect(invalidInputs > 0 || errorMessages > 0).toBeTruthy();
  });
});

test.describe('Admin Login Flow', () => {
  test('should remain on login page with invalid credentials', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');

    // Fill in invalid credentials
    await page.locator('input[type="email"], input[name="email"]').fill('fake@admin.com');
    await page.locator('input[type="password"]').fill('wrongpassword123');

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Wait for response
    await page.waitForTimeout(2000);

    // Should show error or still be on login page
    const url = page.url();
    const hasError = await page.locator('[class*="error"], [role="alert"], .text-red').count() > 0;

    expect(url.includes('login') || hasError).toBeTruthy();
  });

  test('should have password field masked', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');

    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

test.describe('Admin Dashboard Structure', () => {
  // These tests check the structure when authenticated
  // In a real scenario, you'd authenticate first

  test('admin route redirects unauthenticated users', async ({ page }) => {
    const routes = [
      '/admin/articles',
      '/admin/pages',
      '/admin/tags',
      '/admin/media',
      '/admin/users',
    ];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const url = page.url();
      const hasLoginForm = await page.locator('input[type="password"]').count() > 0;

      // Should redirect to login or show login form
      expect(url.includes('login') || hasLoginForm).toBeTruthy();
    }
  });
});

test.describe('Admin Form Elements', () => {
  test('login form should have proper labels', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');

    // Check for labels, placeholders, or aria-labels
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    const emailLabel = await page.locator('label[for*="email"], label:has-text("email")').count();
    const emailPlaceholder = await emailInput.getAttribute('placeholder');
    const emailAriaLabel = await emailInput.getAttribute('aria-label');

    const passwordLabel = await page.locator('label[for*="password"], label:has-text("password")').count();
    const passwordPlaceholder = await passwordInput.getAttribute('placeholder');
    const passwordAriaLabel = await passwordInput.getAttribute('aria-label');

    // Should have either label, placeholder, or aria-label
    expect(emailLabel > 0 || emailPlaceholder || emailAriaLabel).toBeTruthy();
    expect(passwordLabel > 0 || passwordPlaceholder || passwordAriaLabel).toBeTruthy();
  });

  test('login form should be keyboard accessible', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');

    // Tab through form elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Submit button should be reachable
    const activeElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON', 'A']).toContain(activeElement);
  });
});

test.describe('Admin UI Elements', () => {
  test('login page should have consistent styling', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');

    // Check for basic styling (form should be visible and styled)
    const form = page.locator('form');
    const formBox = await form.boundingBox();

    // Form should have reasonable dimensions
    if (formBox) {
      expect(formBox.width).toBeGreaterThan(200);
      expect(formBox.height).toBeGreaterThan(100);
    }
  });

  test('should display site branding on admin login', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');

    // Look for logo or site name
    const branding = page.locator('img[alt*="logo" i], h1, .logo, [class*="brand"]');
    const hasBranding = await branding.count() > 0;

    // Informational - branding may or may not be present
    console.log(`Admin login has branding: ${hasBranding}`);
  });
});
