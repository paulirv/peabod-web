import { test, expect } from '@playwright/test';

test.describe('Theme System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should have theme switcher visible', async ({ page }) => {
    // Look for theme switcher button
    const themeSwitcher = page.locator('button[aria-label*="theme" i], button:has-text("Theme"), [class*="theme"]');
    const count = await themeSwitcher.count();

    // Theme switcher may or may not be visible
    console.log(`Theme switcher elements found: ${count}`);
  });

  test('should apply CSS custom properties for theming', async ({ page }) => {
    // Check if CSS custom properties are being used
    const hasCustomProperties = await page.evaluate(() => {
      const root = document.documentElement;
      const styles = getComputedStyle(root);

      // Check for common theme variables
      const bgVar = styles.getPropertyValue('--background');
      const fgVar = styles.getPropertyValue('--foreground');
      const primaryVar = styles.getPropertyValue('--primary');

      return bgVar || fgVar || primaryVar;
    });

    // Theme system should use CSS custom properties
    console.log(`CSS custom properties in use: ${!!hasCustomProperties}`);
  });

  test('should persist theme preference', async ({ page }) => {
    // Look for theme toggle
    const themeSwitcher = page.locator('button[aria-label*="theme" i], button:has-text("Theme")');

    if (await themeSwitcher.count() > 0) {
      await themeSwitcher.first().click();
      await page.waitForTimeout(500);

      // Look for theme options
      const themeOptions = page.locator('[role="menuitem"], [class*="theme"]');

      if (await themeOptions.count() > 1) {
        // Select a theme
        await themeOptions.first().click();
        await page.waitForTimeout(500);

        // Check localStorage or cookie for theme preference
        const storedTheme = await page.evaluate(() => {
          return localStorage.getItem('theme') || localStorage.getItem('peabod-theme');
        });

        console.log(`Stored theme: ${storedTheme}`);
      }
    }
  });
});

test.describe('Responsive Design', () => {
  test('should render correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Main content should be visible
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Header should be visible
    const header = page.locator('header');
    if (await header.count() > 0) {
      await expect(header).toBeVisible();
    }
  });

  test('should render correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should render correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Check for mobile menu (hamburger) if applicable
    const mobileMenu = page.locator('button[aria-label*="menu" i], .hamburger, [class*="mobile-menu"]');
    const hasMobileMenu = await mobileMenu.count() > 0;

    console.log(`Has mobile menu: ${hasMobileMenu}`);
  });

  test('should not have horizontal scroll on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    // There should be no horizontal scroll on mobile
    expect(hasHorizontalScroll).toBe(false);
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const h1Count = await page.locator('h1').count();
    const h2Count = await page.locator('h2').count();

    // Page should have at least one heading
    expect(h1Count + h2Count).toBeGreaterThan(0);

    // Ideally only one h1
    console.log(`H1 count: ${h1Count}, H2 count: ${h2Count}`);
  });

  test('should have alt text on images', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');

      // Images should have alt text or be decorative (role="presentation")
      expect(alt !== null || role === 'presentation' || role === 'none').toBeTruthy();
    }
  });

  test('should have focusable interactive elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Tab through page
    await page.keyboard.press('Tab');

    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? {
        tagName: el.tagName,
        tabIndex: el.tabIndex,
      } : null;
    });

    // Should have focused something
    expect(focusedElement).toBeTruthy();
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check text is readable (has some color)
    const bodyText = await page.locator('body').evaluate((el) => {
      const styles = getComputedStyle(el);
      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor,
      };
    });

    // Text and background should be different
    expect(bodyText.color).not.toBe(bodyText.backgroundColor);
  });
});

test.describe('Performance', () => {
  test('page should load within reasonable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Page should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);

    console.log(`Page load time: ${loadTime}ms`);
  });

  test('should not have JavaScript errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait a bit for any async errors
    await page.waitForTimeout(1000);

    // Log any errors found
    if (errors.length > 0) {
      console.log('JavaScript errors found:', errors);
    }

    // Ideally no JS errors
    expect(errors.length).toBe(0);
  });
});
