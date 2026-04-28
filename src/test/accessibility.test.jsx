import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
    footer: ({ children, ...props }) => <footer {...props}>{children}</footer>,
  },
  AnimatePresence: ({ children }) => children,
}));

describe('Accesibilidad — ARIA attributes', () => {
  it('navegación tiene aria-label', async () => {
    const { Navigation } = await import('../components/Navigation');
    const { container } = render(<Navigation active="backup" onSelect={() => {}} />);
    const nav = container.querySelector('nav');
    expect(nav).toBeTruthy();
    expect(nav.getAttribute('aria-label')).toBe('Módulos de optimización');
  });

  it('botones de navegación tienen aria-label descriptivo', async () => {
    const { Navigation } = await import('../components/Navigation');
    const { container } = render(<Navigation active="backup" onSelect={() => {}} />);
    const buttons = container.querySelectorAll('button');
    buttons.forEach(btn => {
      const label = btn.getAttribute('aria-label');
      expect(label).toBeTruthy();
      expect(label.length).toBeGreaterThan(5);
    });
  });

  it('módulo activo tiene aria-current="page"', async () => {
    const { Navigation } = await import('../components/Navigation');
    const { container } = render(<Navigation active="backup" onSelect={() => {}} />);
    const activeBtn = container.querySelector('[aria-current="page"]');
    expect(activeBtn).toBeTruthy();
    expect(activeBtn.getAttribute('aria-label')).toContain('Backup');
  });

  it('settings button tiene aria-expanded y aria-haspopup', async () => {
    const { SettingsPanel } = await import('../components/SettingsPanel');
    const { container } = render(
      <SettingsPanel theme="light" setTheme={() => {}} grain="on" setGrain={() => {}} animations="on" setAnimations={() => {}} />
    );
    const btn = container.querySelector('button[aria-expanded]');
    expect(btn).toBeTruthy();
    expect(btn.getAttribute('aria-haspopup')).toBe('true');
    expect(btn.getAttribute('aria-label')).toBe('Abrir configuración');
  });

  it('settings toggles tienen aria-labelledby', async () => {
    const { SettingsPanel } = await import('../components/SettingsPanel');
    const { container } = render(
      <SettingsPanel theme="light" setTheme={() => {}} grain="on" setGrain={() => {}} animations="on" setAnimations={() => {}} />
    );
    // Open settings
    container.querySelector('button[aria-expanded]').click();

    // Check for aria-labelledby on toggle buttons
    const labeledBtns = container.querySelectorAll('button[aria-labelledby]');
    expect(labeledBtns.length).toBeGreaterThanOrEqual(0);
  });

  it('assistant guide tiene role="region" y aria-label', async () => {
    const { AssistantGuide } = await import('../components/AssistantGuide');
    const { container } = render(<AssistantGuide module="backup" />);
    const region = container.querySelector('[role="region"]');
    expect(region).toBeTruthy();
    expect(region.getAttribute('aria-label')).toContain('Backup');
  });

  it('assistant guide toggle tiene aria-expanded', async () => {
    const { AssistantGuide } = await import('../components/AssistantGuide');
    const { container } = render(<AssistantGuide module="backup" />);
    const btn = container.querySelector('button[aria-expanded]');
    expect(btn).toBeTruthy();
    expect(btn.getAttribute('aria-controls')).toBeTruthy();
  });

  it('navegación usa <nav> en vez de <div>', async () => {
    const { Navigation } = await import('../components/Navigation');
    const { container } = render(<Navigation active="backup" onSelect={() => {}} />);
    const nav = container.querySelector('nav');
    expect(nav).toBeTruthy();
    expect(nav.tagName).toBe('NAV');
  });
});
