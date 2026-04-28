import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to get clean state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    // Disclaimers and onboarding — accept/close
    await page.waitForTimeout(500);
    // Dismiss disclaimer if visible
    const disclaimerBtn = page.getByRole('button', { name: /entiendo los riesgos/i });
    if (await disclaimerBtn.isVisible()) await disclaimerBtn.click();
    // Dismiss onboarding if visible
    const skipBtn = page.getByRole('button', { name: /conozco la app/i });
    if (await skipBtn.isVisible()) await skipBtn.click();
    await page.waitForTimeout(300);
  });

  test('homepage — backup module', async ({ page }) => {
    await expect(page).toHaveScreenshot('homepage-backup.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('debloat module', async ({ page }) => {
    await page.getByRole('button', { name: /debloat/i }).first().click();
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('debloat-module.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('performance module', async ({ page }) => {
    await page.getByRole('button', { name: /performance/i }).first().click();
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('performance-module.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('rescue module', async ({ page }) => {
    await page.getByRole('button', { name: /rescate/i }).first().click();
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('rescue-module.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('dark mode', async ({ page }) => {
    // Open settings and toggle dark mode
    await page.getByLabel(/configuración/i).click();
    await page.waitForTimeout(200);
    await page.getByLabel(/tema/i).click();
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('dark-mode.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });
});
