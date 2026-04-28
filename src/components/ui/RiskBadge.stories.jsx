import { RiskBadge } from './RiskBadge';

export default {
  title: 'UI/RiskBadge',
  component: RiskBadge,
  tags: ['autodocs'],
  argTypes: {
    risk: {
      control: 'select',
      options: ['none', 'low', 'medium', 'high', 'critical'],
    },
  },
  parameters: {
    docs: {
      description: {
        component: 'Indicador visual de riesgo con colores semánticos. Usado en módulos de Debloat y Performance.',
      },
    },
  },
};

export const NoRisk = { args: { risk: 'none' } };
export const LowRisk = { args: { risk: 'low' } };
export const MediumRisk = { args: { risk: 'medium' } };
export const HighRisk = { args: { risk: 'high' } };
export const Critical = { args: { risk: 'critical' } };

export const AllLevels = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <RiskBadge risk="none" />
      <RiskBadge risk="low" />
      <RiskBadge risk="medium" />
      <RiskBadge risk="high" />
      <RiskBadge risk="critical" />
    </div>
  ),
};
