import { ImpactBadge } from './ImpactBadge';

export default {
  title: 'UI/ImpactBadge',
  component: ImpactBadge,
  tags: ['autodocs'],
  argTypes: {
    impact: {
      control: 'select',
      options: ['low', 'medium', 'high', 'visual'],
    },
  },
};

export const Low = { args: { impact: 'low' } };
export const Medium = { args: { impact: 'medium' } };
export const High = { args: { impact: 'high' } };
export const Visual = { args: { impact: 'visual' } };

export const AllLevels = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <ImpactBadge impact="low" />
      <ImpactBadge impact="medium" />
      <ImpactBadge impact="high" />
      <ImpactBadge impact="visual" />
    </div>
  ),
};
