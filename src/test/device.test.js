import { describe, it, expect } from 'vitest';
import { DEVICE, BLOATWARE, TWEAKS, BACKUP_TARGETS } from '../data/device';
import { generateScript } from '../services/scriptGenerator';

describe('DEVICE config', () => {
  it('has correct device name', () => {
    expect(DEVICE.name).toBe('Redmi 14C');
  });

  it('has correct RAM config', () => {
    expect(DEVICE.ram.physical).toBe(4);
    expect(DEVICE.ram.expandable).toBe(true);
    expect(DEVICE.ram.maxExpand).toBe(8);
    expect(DEVICE.ram.recommendedExpand).toBe(0);
  });

  it('has correct storage', () => {
    expect(DEVICE.storage.total).toBe(256);
  });

  it('has correct display refresh rate', () => {
    expect(DEVICE.display.refreshRate).toBe(90);
  });

  it('has valid CPU config', () => {
    expect(DEVICE.cpu.cores).toBe(8);
    expect(DEVICE.cpu.big.count).toBe(2);
    expect(DEVICE.cpu.little.count).toBe(6);
  });
});

describe('BLOATWARE lists', () => {
  it('has safe packages', () => {
    expect(BLOATWARE.safe.length).toBeGreaterThan(0);
  });

  it('has balanced packages', () => {
    expect(BLOATWARE.balanced.length).toBeGreaterThan(0);
  });

  it('has aggressive packages', () => {
    expect(BLOATWARE.aggressive.length).toBeGreaterThan(0);
  });

  it('all packages have required fields', () => {
    const all = [...BLOATWARE.safe, ...BLOATWARE.balanced, ...BLOATWARE.aggressive];
    for (const pkg of all) {
      expect(pkg).toHaveProperty('pkg');
      expect(pkg).toHaveProperty('name');
      expect(pkg).toHaveProperty('risk');
      expect(pkg).toHaveProperty('desc');
      expect(typeof pkg.pkg).toBe('string');
      expect(pkg.pkg).toContain('.');
    }
  });

  it('risk levels are valid', () => {
    const validRisks = ['none', 'low', 'medium', 'high', 'critical'];
    const all = [...BLOATWARE.safe, ...BLOATWARE.balanced, ...BLOATWARE.aggressive];
    for (const pkg of all) {
      expect(validRisks).toContain(pkg.risk);
    }
  });
});

describe('TWEAKS', () => {
  it('has performance tweaks', () => {
    expect(TWEAKS.performance.length).toBeGreaterThan(0);
  });

  it('has aesthetics tweaks', () => {
    expect(TWEAKS.aesthetics.length).toBeGreaterThan(0);
  });

  it('has kernel tweaks', () => {
    expect(TWEAKS.kernel.length).toBeGreaterThan(0);
  });

  it('all performance tweaks have valid commands', () => {
    for (const tweak of TWEAKS.performance) {
      expect(tweak).toHaveProperty('id');
      expect(tweak).toHaveProperty('name');
      expect(tweak).toHaveProperty('cmd');
      expect(tweak).toHaveProperty('risk');
      expect(tweak).toHaveProperty('impact');
      expect(tweak.cmd.length).toBeGreaterThan(0);
    }
  });

  it('kernel tweaks are marked as requiring root', () => {
    for (const tweak of TWEAKS.kernel) {
      expect(tweak.requiresRoot).toBe(true);
    }
  });
});

describe('BACKUP_TARGETS', () => {
  it('has targets', () => {
    expect(BACKUP_TARGETS.length).toBeGreaterThan(0);
  });

  it('all targets have commands', () => {
    for (const target of BACKUP_TARGETS) {
      expect(target).toHaveProperty('id');
      expect(target).toHaveProperty('name');
      expect(target).toHaveProperty('cmd');
      expect(target.cmd.length).toBeGreaterThan(0);
    }
  });

  it('all targets have unique ids', () => {
    const ids = BACKUP_TARGETS.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('generateScript', () => {
  it('generates a valid bash script', () => {
    const script = generateScript([{ name: 'Test', type: 'tweak', tweaks: [{ name: 'T', cmd: 'echo ok' }] }]);
    expect(script).toContain('#!/bin/bash');
    expect(script).toContain('MejoraRedmi14c');
    expect(script).toContain('adb devices');
  });

  it('includes backup module', () => {
    const script = generateScript([{
      name: 'Test Backup',
      type: 'backup',
      targets: BACKUP_TARGETS,
    }]);
    expect(script).toContain('Test Backup');
    expect(script).toContain('Backup');
  });

  it('includes debloat module', () => {
    const script = generateScript([{
      name: 'Test Debloat',
      type: 'debloat',
      packages: BLOATWARE.safe.slice(0, 3),
    }]);
    expect(script).toContain('Test Debloat');
    expect(script).toContain('pm uninstall');
  });

  it('includes tweak module', () => {
    const script = generateScript([{
      name: 'Test Tweaks',
      type: 'tweak',
      tweaks: TWEAKS.performance.slice(0, 2),
    }]);
    expect(script).toContain('Test Tweaks');
  });

  it('generates device-specific output', () => {
    const script = generateScript([{ name: 'Test', type: 'tweak', tweaks: [{ name: 'T', cmd: 'echo ok' }] }]);
    expect(script).toContain(DEVICE.name);
    expect(script).toContain(DEVICE.codename);
    expect(script).toContain(`${DEVICE.ram.physical}GB`);
    expect(script).toContain(`${DEVICE.storage.total}GB`);
  });

  it('throws with empty modules', () => {
    expect(() => generateScript([])).toThrow('al menos un módulo');
  });
});
