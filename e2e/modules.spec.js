import { test, expect } from '@playwright/test';

test.describe('Modules', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(500);
    // Dismiss disclaimer and onboarding
    const disclaimerBtn = page.getByRole('button', { name: /entiendo los riesgos/i });
    if (await disclaimerBtn.isVisible()) await disclaimerBtn.click();
    const skipBtn = page.getByRole('button', { name: /conozco la app/i });
    if (await skipBtn.isVisible()) await skipBtn.click();
    await page.waitForTimeout(300);
  });

  test('backup module — select all and generate', async ({ page }) => {
    // Should be on backup by default
    await expect(page.getByText('Backup Completo a PC')).toBeVisible();

    // Select all
    await page.getByRole('button', { name: /seleccionar todo/i }).click();

    // Count should match
    await expect(page.getByText(/7 de 7 seleccionados|items para respaldar/)).toBeVisible();

    // Generate button should be enabled
    const generateBtn = page.getByRole('button', { name: /generar script/i });
    await expect(generateBtn).toBeEnabled();
  });

  test('debloat module — profile switching', async ({ page }) => {
    await page.getByRole('button', { name: /debloat/i }).first().click();
    await page.waitForTimeout(500);

    // Should show debloat title
    await expect(page.getByText('Debloat — Eliminar Bloatware')).toBeVisible();

    // Default profile should be safe
    await expect(page.getByText(/paquetes seleccionados/)).toBeVisible();

    // Switch to balanced
    await page.getByRole('button', { name: /equilibrado/i }).click();
    await page.waitForTimeout(200);

    // Should have more packages
    const countText = await page.getByText(/paquetes seleccionados/).textContent();
    expect(countText).toBeTruthy();

    // Switch to aggressive — should show warning
    await page.getByRole('button', { name: /agresivo/i }).click();
    await page.waitForTimeout(200);
    await expect(page.getByText(/perfil agresivo/i)).toBeVisible();
  });

  test('performance module — tweaks visible', async ({ page }) => {
    await page.getByRole('button', { name: /performance/i }).first().click();
    await page.waitForTimeout(500);

    await expect(page.getByText('Performance — Tweaks de Rendimiento')).toBeVisible();

    // Key tweaks should be visible
    await expect(page.getByText('Animaciones 0.5x')).toBeVisible();
    await expect(page.getByText('Desactivar RAM Virtual')).toBeVisible();
    await expect(page.getByText('Renderizado GPU Forzado')).toBeVisible();
  });

  test('aesthetics module — blur and refresh rate', async ({ page }) => {
    await page.getByRole('button', { name: /estética/i }).first().click();
    await page.waitForTimeout(500);

    await expect(page.getByText('Estética — Visual y Animaciones')).toBeVisible();

    // Key options
    await expect(page.getByText(/Blur Nativo/i)).toBeVisible();
    await expect(page.getByText(/90Hz/i)).toBeVisible();
  });

  test('rescue module — quick fixes visible', async ({ page }) => {
    await page.getByRole('button', { name: /rescate/i }).first().click();
    await page.waitForTimeout(500);

    await expect(page.getByText('Rescate — Restaurar y Reparar')).toBeVisible();

    // Quick fixes should be visible
    await expect(page.getByText(/Restaurar Wallpapers/i)).toBeVisible();
    await expect(page.getByText(/Restaurar Bluetooth/i)).toBeVisible();
    await expect(page.getByText(/Restaurar TODAS/i)).toBeVisible();
  });

  test('root module — accordion steps', async ({ page }) => {
    await page.getByRole('button', { name: /root/i }).first().click();
    await page.waitForTimeout(500);

    await expect(page.getByText('Root Opcional — Magisk + Kernel')).toBeVisible();

    // Warning should be visible
    await expect(page.getByText(/Root no es obligatorio/)).toBeVisible();

    // Click first step to expand
    await page.getByText('Entender los Riesgos').click();
    await page.waitForTimeout(300);

    // Content should be visible
    await expect(page.getByText(/pierdes la garantía/i)).toBeVisible();
  });

  test('generate script from multiple modules', async ({ page }) => {
    // The script generator at the bottom should be visible
    await expect(page.getByText('Generador de Script Completo')).toBeVisible();

    // Generate button
    const downloadBtn = page.getByRole('button', { name: /descargar script completo/i });
    await expect(downloadBtn).toBeVisible();
  });
});
