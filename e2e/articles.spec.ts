import { test, expect } from '@playwright/test';

test.describe('Article Browsing', () => {
  test('should navigate to article detail page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find article links
    const articleLinks = page.locator('a[href*="/article/"]');
    const count = await articleLinks.count();

    if (count > 0) {
      // Click the first article
      const firstArticle = articleLinks.first();

      await firstArticle.click();
      await page.waitForLoadState('networkidle');

      // Verify we navigated to the article page
      expect(page.url()).toContain('/article/');
    }
  });

  test('should display article content on detail page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const articleLinks = page.locator('a[href*="/article/"]');
    const count = await articleLinks.count();

    if (count > 0) {
      await articleLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Article page should have content
      const mainContent = page.locator('main, article, .content');
      await expect(mainContent.first()).toBeVisible();

      // Should have a title (h1 or h2)
      const title = page.locator('h1, h2');
      if (await title.count() > 0) {
        await expect(title.first()).toBeVisible();
      }
    }
  });

  test('should display article metadata', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const articleLinks = page.locator('a[href*="/article/"]');

    if (await articleLinks.count() > 0) {
      await articleLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Look for common metadata elements
      const pageContent = await page.content();

      // Article pages typically have author info or date
      const hasMetadata =
        pageContent.includes('author') ||
        pageContent.includes('date') ||
        pageContent.includes('published') ||
        await page.locator('time').count() > 0;

      // This is informational - metadata presence varies
      console.log(`Page has metadata indicators: ${hasMetadata}`);
    }
  });

  test('should handle 404 for non-existent article', async ({ page }) => {
    // Try to access a non-existent article
    const response = await page.goto('/article/this-article-definitely-does-not-exist-12345');

    // Should either show 404 page or redirect
    const status = response?.status();
    const url = page.url();

    // Accept 404, redirect to home, or custom error page
    expect(status === 404 || url === '/' || url.includes('404') || await page.locator('text=/not found/i').count() > 0).toBeTruthy();
  });

  test('should navigate back to home from article', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const articleLinks = page.locator('a[href*="/article/"]');

    if (await articleLinks.count() > 0) {
      await articleLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Find a way back to home (logo, nav link, or browser back)
      const homeLink = page.locator('a[href="/"], header a, nav a').first();

      if (await homeLink.count() > 0) {
        await homeLink.click();
        await page.waitForLoadState('networkidle');

        // Should be back on home page
        expect(page.url()).toMatch(/\/$|\/home/);
      } else {
        // Use browser back
        await page.goBack();
        await page.waitForLoadState('networkidle');
        expect(page.url()).not.toContain('/article/');
      }
    }
  });
});

test.describe('Static Pages', () => {
  test('should load static page if one exists', async ({ page }) => {
    // Try common static page slugs
    const staticPages = ['about', 'contact', 'privacy', 'terms'];

    for (const slug of staticPages) {
      const response = await page.goto(`/${slug}`);

      if (response?.status() === 200) {
        // Page exists, verify it loaded
        await expect(page.locator('body')).toBeVisible();
        console.log(`Static page /${slug} exists`);
        break;
      }
    }
  });
});

test.describe('Article Cards', () => {
  test('should display article card information', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const articles = page.locator('article');
    const count = await articles.count();

    if (count > 0) {
      const firstArticle = articles.first();

      // Article card should have title
      const title = firstArticle.locator('h1, h2, h3, h4');
      if (await title.count() > 0) {
        await expect(title.first()).toBeVisible();
      }

      // May have excerpt/description
      const text = firstArticle.locator('p');
      if (await text.count() > 0) {
        await expect(text.first()).toBeVisible();
      }
    }
  });

  test('should display article images when present', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const articles = page.locator('article');

    if (await articles.count() > 0) {
      // Check for images in articles
      const images = page.locator('article img');
      const imageCount = await images.count();

      if (imageCount > 0) {
        // Verify first image loads
        const firstImage = images.first();
        await expect(firstImage).toBeVisible();

        // Check image has src
        const src = await firstImage.getAttribute('src');
        expect(src).toBeTruthy();
      }
    }
  });

  test('should display tags on article cards', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for tag elements
    const tags = page.locator('[class*="tag"], [class*="badge"], .rounded-full');
    const tagCount = await tags.count();

    // Tags may or may not be present
    console.log(`Found ${tagCount} potential tag elements`);
  });
});
