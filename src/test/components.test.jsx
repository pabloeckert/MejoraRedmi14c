import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';
import { RiskBadge } from '../components/ui/RiskBadge';
import { ImpactBadge } from '../components/ui/ImpactBadge';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => children,
}));

describe('UI Components', () => {
  describe('GlassCard', () => {
    it('renderiza children', () => {
      render(<GlassCard>Test content</GlassCard>);
      expect(screen.getByText('Test content')).toBeDefined();
    });

    it('aplica className personalizada', () => {
      const { container } = render(<GlassCard className="custom-class">Test</GlassCard>);
      expect(container.firstChild.className).toContain('custom-class');
    });

    it('maneja click cuando hover está habilitado', () => {
      const onClick = vi.fn();
      render(<GlassCard hover onClick={onClick}>Click me</GlassCard>);
      fireEvent.click(screen.getByText('Click me'));
      expect(onClick).toHaveBeenCalledOnce();
    });
  });

  describe('Badge', () => {
    it('renderiza con variante default', () => {
      render(<Badge>Default</Badge>);
      expect(screen.getByText('Default')).toBeDefined();
    });

    it('renderiza con variante success', () => {
      const { container } = render(<Badge variant="success">OK</Badge>);
      expect(container.firstChild.className).toContain('success');
    });

    it('renderiza con variante danger', () => {
      const { container } = render(<Badge variant="danger">Error</Badge>);
      expect(container.firstChild.className).toContain('danger');
    });
  });

  describe('RiskBadge', () => {
    it('muestra "Sin riesgo" para risk none', () => {
      render(<RiskBadge risk="none" />);
      expect(screen.getByText('Sin riesgo')).toBeDefined();
    });

    it('muestra "Riesgo alto" para risk high', () => {
      render(<RiskBadge risk="high" />);
      expect(screen.getByText('Riesgo alto')).toBeDefined();
    });

    it('muestra "CRÍTICO" para risk critical', () => {
      render(<RiskBadge risk="critical" />);
      expect(screen.getByText('CRÍTICO')).toBeDefined();
    });

    it('fallback a low para riesgo desconocido', () => {
      render(<RiskBadge risk="unknown" />);
      expect(screen.getByText('Riesgo bajo')).toBeDefined();
    });
  });

  describe('ImpactBadge', () => {
    it('muestra "Impacto alto" para impact high', () => {
      render(<ImpactBadge impact="high" />);
      expect(screen.getByText('Impacto alto')).toBeDefined();
    });

    it('muestra "Impacto visual" para impact visual', () => {
      render(<ImpactBadge impact="visual" />);
      expect(screen.getByText('Impacto visual')).toBeDefined();
    });
  });

  describe('ErrorBoundary', () => {
    it('renderiza children cuando no hay error', () => {
      render(
        <ErrorBoundary>
          <div>Normal content</div>
        </ErrorBoundary>
      );
      expect(screen.getByText('Normal content')).toBeDefined();
    });

    it('muestra fallback cuando hay error', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary module="test">
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Algo salió mal')).toBeDefined();
      expect(screen.getByText(/módulo "test"/)).toBeDefined();
      expect(screen.getByText('Reintentar')).toBeDefined();

      consoleSpy.mockRestore();
    });
  });
});
