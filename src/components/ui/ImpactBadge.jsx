import { Badge } from './Badge';

export function ImpactBadge({ impact }) {
  const map = {
    low: { label: 'Impacto bajo', variant: 'default' },
    medium: { label: 'Impacto medio', variant: 'info' },
    high: { label: 'Impacto alto', variant: 'brand' },
    visual: { label: 'Impacto visual', variant: 'brand' },
  };
  const i = map[impact] || map.low;
  return <Badge variant={i.variant}>{i.label}</Badge>;
}
