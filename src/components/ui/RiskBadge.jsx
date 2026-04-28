import { Badge } from './Badge';

export function RiskBadge({ risk }) {
  const map = {
    none: { label: 'Sin riesgo', variant: 'success' },
    low: { label: 'Riesgo bajo', variant: 'info' },
    medium: { label: 'Riesgo medio', variant: 'warning' },
    high: { label: 'Riesgo alto', variant: 'danger' },
    critical: { label: 'CRÍTICO', variant: 'danger' },
  };
  const r = map[risk] || map.low;
  return <Badge variant={r.variant}>{r.label}</Badge>;
}
