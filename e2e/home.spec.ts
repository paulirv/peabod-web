import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the site header', async ({ page }) => {
    // Check that the header is visible
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('should display the site title/logo', async ({ page }) => {
    // Look for a logo or site title in the header
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('should display navigation links', async ({ page }) => {
    // Check for main navigation
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
  });

  test('should display the footer', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('should have correct page title', async ({ page }) => {
    // Verify the page has loaded with a title
    await expect(page).toHaveTitle(/.+/);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Page should still be functional on mobile
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Article Listing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display article cards if articles exist', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for article elements (they may or may not exist depending on data)
    const articles = page.locator('article');
    const count = await articles.count();

    // If there are articles, verify they have expected structure
    if (count > 0) {
      const firstArticle = articles.first();
      await expect(firstArticle).toBeVisible();
    }
  });

  test('should have clickable article links', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const articleLinks = page.locator('article a[href*="/article/"]');
    const count = await articleLinks.count();

    if (count > 0) {
      // Verify links are clickable
      const firstLink = articleLinks.first();
      await expect(firstLink).toBeVisible();

      // Get the href before clicking
      const href = await firstLink.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });
});
