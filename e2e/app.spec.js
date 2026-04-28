import { test, expect } from '@playwright/test';

test.describe('MejoraRedmi14c', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1');
  });

  test('carga la página principal con título', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('MejoraRedmi14c');
  });

  test('muestra información del dispositivo', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Redmi 14C' })).toBeVisible();
    await expect(page.getByText('MediaTek Helio G81 Ultra')).toBeVisible();
  });

  test('muestra los 6 módulos de navegación', async ({ page }) => {
    const nav = page.locator('.grid.grid-cols-2');
    await expect(nav.getByRole('button', { name: 'Backup Completo' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Debloat' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Performance' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Estética' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Rescate' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Root (Opcional)' })).toBeVisible();
  });

  test('navegación entre módulos funciona', async ({ page }) => {
    const nav = page.locator('.grid.grid-cols-2');

    await nav.getByRole('button', { name: 'Performance' }).click();
    await expect(page.getByRole('heading', { name: /Tweaks de Rendimiento/ })).toBeVisible();

    await nav.getByRole('button', { name: 'Debloat' }).click();
    await expect(page.getByRole('heading', { name: /Eliminar Bloatware/ })).toBeVisible();

    await nav.getByRole('button', { name: 'Backup Completo' }).click();
    await expect(page.getByRole('heading', { name: /Backup Completo a PC/ })).toBeVisible();
  });

  test('módulo backup permite seleccionar targets y generar script', async ({ page }) => {
    await expect(page.getByText('Contactos', { exact: true })).toBeVisible();
    await expect(page.getByText('WhatsApp', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Generar Script' }).click();

    await expect(page.getByText('Script generado:')).toBeVisible();
    await expect(page.locator('pre.code-block')).toContainText('#!/bin/bash');
  });

  test('módulo debloat muestra perfiles', async ({ page }) => {
    const nav = page.locator('.grid.grid-cols-2');
    await nav.getByRole('button', { name: 'Debloat' }).click();

    await expect(page.getByRole('button', { name: /Seguro.*bloatware/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Equilibrado/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Agresivo/ })).toBeVisible();
  });

  test('módulo performance muestra tweaks', async ({ page }) => {
    const nav = page.locator('.grid.grid-cols-2');
    await nav.getByRole('button', { name: 'Performance' }).click();

    await expect(page.getByText('Animaciones 0.5x', { exact: true })).toBeVisible();
    await expect(page.getByText('Modo Rendimiento Fijo', { exact: true })).toBeVisible();
    await expect(page.getByText('Desactivar RAM Virtual', { exact: true })).toBeVisible();
  });

  test('asistente contextual se puede colapsar', async ({ page }) => {
    await expect(page.getByText('Asistente — Backup Completo')).toBeVisible();
    await page.getByText('Asistente — Backup Completo').click();
    await page.getByText('Asistente — Backup Completo').click();
  });

  test('panel de configuración se abre', async ({ page }) => {
    await page.locator('button[title="Configuración"]').click();
    await expect(page.getByText('Configuración', { exact: true })).toBeVisible();
    await expect(page.getByText('Tema', { exact: true })).toBeVisible();
    await expect(page.getByText('Grain', { exact: true })).toBeVisible();
  });

  test('dark mode toggle funciona', async ({ page }) => {
    await page.locator('button[title="Configuración"]').click();
    await expect(page.getByText('Tema', { exact: true })).toBeVisible();

    // Find the row containing "Tema" and click the toggle button in it
    const temaText = page.getByText('Tema', { exact: true });
    const toggleRow = temaText.locator('xpath=ancestor::div[contains(@class, "flex")]');
    const toggleBtn = toggleRow.locator('button').first();
    await toggleBtn.click();

    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark');
  });

  test('generador de script completo descarga archivo', async ({ page }) => {
    await page.getByText('Generador de Script Completo').scrollIntoViewIfNeeded();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Descargar Script Completo/ }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain('.sh');
  });

  test('módulo rescate muestra fixes rápidos', async ({ page }) => {
    const nav = page.locator('.grid.grid-cols-2');
    await nav.getByRole('button', { name: 'Rescate' }).click();

    await expect(page.getByText('Restaurar Wallpapers', { exact: true })).toBeVisible();
    await expect(page.getByText('Restaurar Bluetooth', { exact: true })).toBeVisible();
    await expect(page.getByText('Restaurar Animaciones', { exact: true })).toBeVisible();
  });

  test('módulo root muestra pasos expandibles', async ({ page }) => {
    const nav = page.locator('.grid.grid-cols-2');
    await nav.getByRole('button', { name: 'Root (Opcional)' }).click();

    await expect(page.getByRole('button', { name: /Entender los Riesgos/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Desbloquear Bootloader/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Instalar Magisk/ })).toBeVisible();

    // Expand first step
    await page.getByRole('button', { name: /Entender los Riesgos/ }).click();
    await expect(page.getByText('Pierdes la garantía')).toBeVisible();
  });
});
