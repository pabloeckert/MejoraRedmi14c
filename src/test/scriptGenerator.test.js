import { describe, it, expect } from 'vitest';
import { generateScript, generateRestoreScript } from '../services/scriptGenerator';

describe('scriptGenerator service', () => {
  describe('generateScript', () => {
    it('genera script bash válido con shebang', () => {
      const script = generateScript([{ name: 'Test', type: 'tweak', tweaks: [{ name: 'T1', cmd: 'echo ok' }] }]);
      expect(script).toMatch(/^#!/);
      expect(script).toContain('#!/bin/bash');
    });

    it('incluye metadatos del dispositivo', () => {
      const script = generateScript([{ name: 'Test', type: 'tweak', tweaks: [{ name: 'T1', cmd: 'echo ok' }] }]);
      expect(script).toContain('Redmi 14C');
      expect(script).toContain('airflow');
    });

    it('incluye verificación de conexión ADB', () => {
      const script = generateScript([{ name: 'Test', type: 'tweak', tweaks: [{ name: 'T1', cmd: 'echo ok' }] }]);
      expect(script).toContain('adb devices');
      expect(script).toContain('set -e');
    });

    it('genera sección de backup correctamente', () => {
      const script = generateScript([{
        name: 'Backup Test',
        type: 'backup',
        targets: [
          { name: 'Contactos', cmd: 'adb pull /contacts/' },
          { name: 'Fotos', cmd: 'adb pull /dcim/' },
        ],
      }]);
      expect(script).toContain('Backup Test');
      expect(script).toContain('BACKUP_DIR=');
      expect(script).toContain('mkdir -p');
      expect(script).toContain('Contactos');
      expect(script).toContain('Fotos');
    });

    it('genera sección de debloat correctamente', () => {
      const script = generateScript([{
        name: 'Debloat Test',
        type: 'debloat',
        packages: [
          { pkg: 'com.test.app', name: 'Test App' },
        ],
      }]);
      expect(script).toContain('pm uninstall -k --user 0 com.test.app');
      expect(script).toContain('Test App');
    });

    it('genera sección de tweaks correctamente', () => {
      const script = generateScript([{
        name: 'Performance',
        type: 'tweak',
        tweaks: [
          { name: 'Animaciones', cmd: 'adb shell settings put global window_animation_scale 0.5' },
        ],
      }]);
      expect(script).toContain('Animaciones');
      expect(script).toContain('window_animation_scale 0.5');
    });

    it('genera múltiples módulos en orden', () => {
      const script = generateScript([
        { name: 'FASE 1: Backup', type: 'backup', targets: [{ name: 'T', cmd: 'echo 1' }] },
        { name: 'FASE 2: Debloat', type: 'debloat', packages: [{ pkg: 'com.test', name: 'T' }] },
        { name: 'FASE 3: Tweaks', type: 'tweak', tweaks: [{ name: 'T', cmd: 'echo 3' }] },
      ]);
      const idx1 = script.indexOf('FASE 1');
      const idx2 = script.indexOf('FASE 2');
      const idx3 = script.indexOf('FASE 3');
      expect(idx1).toBeLessThan(idx2);
      expect(idx2).toBeLessThan(idx3);
    });

    it('incluye mensaje de completado', () => {
      const script = generateScript([{ name: 'Test', type: 'tweak', tweaks: [{ name: 'T', cmd: 'echo ok' }] }]);
      expect(script).toContain('Script completado');
      expect(script).toContain('adb reboot');
    });

    it('lanza error con módulos vacíos', () => {
      expect(() => generateScript([])).toThrow('al menos un módulo');
    });

    it('lanza error con tipo de módulo inválido', () => {
      expect(() => generateScript([{ name: 'Test', type: 'invalid' }])).toThrow('inválido');
    });

    it('lanza error sin targets en backup', () => {
      expect(() => generateScript([{ name: 'Test', type: 'backup' }])).toThrow('targets');
    });

    it('lanza error sin packages en debloat', () => {
      expect(() => generateScript([{ name: 'Test', type: 'debloat' }])).toThrow('packages');
    });

    it('lanza error sin tweaks en tweak', () => {
      expect(() => generateScript([{ name: 'Test', type: 'tweak' }])).toThrow('tweaks');
    });
  });

  describe('generateRestoreScript', () => {
    it('genera script de restauración con shebang', () => {
      const script = generateRestoreScript();
      expect(script).toMatch(/^#!/);
    });

    it('incluye restauración de animaciones', () => {
      const script = generateRestoreScript();
      expect(script).toContain('window_animation_scale 1.0');
      expect(script).toContain('transition_animation_scale 1.0');
    });

    it('incluye restauración de configuraciones', () => {
      const script = generateRestoreScript();
      expect(script).toContain('force_gpu_rendering 0');
      expect(script).toContain('ram_expand_size 4096');
    });

    it('incluye restauración de apps', () => {
      const script = generateRestoreScript();
      expect(script).toContain('pm install-existing');
      expect(script).toContain('pm list packages -d');
    });

    it('contiene advertencia de reversión total', () => {
      const script = generateRestoreScript();
      expect(script).toContain('revierte TODOS');
    });
  });
});
