import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../components/ui/Badge';
import { RiskBadge } from '../components/ui/RiskBadge';
import { ImpactBadge } from '../components/ui/ImpactBadge';
import { GlassCard } from '../components/ui/GlassCard';
import { Skeleton, ModuleSkeleton } from '../components/ui/Skeleton';

describe('Badge', () => {
  it('renders with default variant', () => {
    render(<Badge>Test</Badge>);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('renders with all variants', () => {
    const variants = ['default', 'success', 'warning', 'danger', 'info', 'brand'];
    variants.forEach(variant => {
      const { unmount } = render(<Badge variant={variant}>{variant}</Badge>);
      expect(screen.getByText(variant)).toBeInTheDocument();
      unmount();
    });
  });
});

describe('RiskBadge', () => {
  it('renders risk levels', () => {
    const levels = ['none', 'low', 'medium', 'high', 'critical'];
    levels.forEach(risk => {
      const { unmount } = render(<RiskBadge risk={risk} />);
      expect(document.querySelector('span')).toBeInTheDocument();
      unmount();
    });
  });

  it('defaults to low for unknown risk', () => {
    render(<RiskBadge risk="unknown" />);
    expect(document.querySelector('span')).toBeInTheDocument();
  });
});

describe('ImpactBadge', () => {
  it('renders impact levels', () => {
    const levels = ['low', 'medium', 'high', 'visual'];
    levels.forEach(impact => {
      const { unmount } = render(<ImpactBadge impact={impact} />);
      expect(document.querySelector('span')).toBeInTheDocument();
      unmount();
    });
  });
});

describe('GlassCard', () => {
  it('renders children', () => {
    render(<GlassCard>Card content</GlassCard>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    const { container } = render(<GlassCard variant="brand">Brand</GlassCard>);
    expect(container.firstChild).toBeTruthy();
  });

  it('handles hover prop', () => {
    const { container } = render(<GlassCard hover>Hoverable</GlassCard>);
    expect(container.firstChild).toBeTruthy();
  });
});

describe('Skeleton', () => {
  it('renders with default variant', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    ['text', 'circle', 'card', 'button'].forEach(variant => {
      const { unmount } = render(<Skeleton variant={variant} />);
      expect(document.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
      unmount();
    });
  });
});

describe('ModuleSkeleton', () => {
  it('renders loading state', () => {
    render(<ModuleSkeleton />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText('Cargando...')).toBeInTheDocument();
  });
});
