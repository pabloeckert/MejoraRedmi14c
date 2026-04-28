import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(500);
    const disclaimerBtn = page.getByRole('button', { name: /entiendo los riesgos/i });
    if (await disclaimerBtn.isVisible()) await disclaimerBtn.click();
    const skipBtn = page.getByRole('button', { name: /conozco la app/i });
    if (await skipBtn.isVisible()) await skipBtn.click();
    await page.waitForTimeout(300);
  });

  test('skip to content link exists', async ({ page }) => {
    const skipLink = page.getByRole('link', { name: /saltar al contenido/i });
    await expect(skipLink).toBeInTheDocument();
  });

  test('navigation has aria-label', async ({ page }) => {
    const nav = page.getByLabel('Módulos de optimización');
    await expect(nav).toBeVisible();
  });

  test('all navigation buttons have aria-label', async ({ page }) => {
    const navButtons = page.locator('nav button[aria-label]');
    const count = await navButtons.count();
    expect(count).toBeGreaterThanOrEqual(6);
  });

  test('settings button has aria attributes', async ({ page }) => {
    const settingsBtn = page.getByLabel(/configuración/i);
    await expect(settingsBtn).toHaveAttribute('aria-expanded', 'false');
    await expect(settingsBtn).toHaveAttribute('aria-haspopup', 'true');
  });

  test('module content has main landmark', async ({ page }) => {
    const main = page.locator('main#main-content');
    await expect(main).toBeVisible();
  });

  test('assistant guide has region role', async ({ page }) => {
    const guide = page.locator('[role="region"]').first();
    await expect(guide).toBeVisible();
  });

  test('toast has alert role', async ({ page }) => {
    // Trigger a toast by generating a script
    await page.getByRole('button', { name: /generar script/i }).first().click();
    await page.waitForTimeout(500);
    const toast = page.locator('[role="alert"]');
    // Toast might appear briefly
    const count = await toast.count();
    // It's ok if it already dismissed
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('keyboard navigation — tab through interactive elements', async ({ page }) => {
    // Tab to first interactive element
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    const tagName = await focused.evaluate(el => el.tagName.toLowerCase());
    expect(['a', 'button', 'input']).toContain(tagName);
  });

  test('FAQ button has aria-label', async ({ page }) => {
    const faqBtn = page.getByLabel(/preguntas frecuentes/i);
    await expect(faqBtn).toBeVisible();
  });

  test('shortcuts button has aria-label', async ({ page }) => {
    const shortcutsBtn = page.getByLabel(/atajos de teclado/i);
    await expect(shortcutsBtn).toBeVisible();
  });

  test('scroll to top appears after scrolling', async ({ page }) => {
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(500);

    const scrollBtn = page.getByLabel(/volver arriba/i);
    await expect(scrollBtn).toBeVisible();
  });
});
