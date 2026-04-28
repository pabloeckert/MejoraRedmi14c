import { Badge } from './Badge';

export default {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'brand', 'success', 'warning', 'danger', 'info'],
    },
  },
};

export const Default = {
  args: { children: 'Badge', variant: 'default' },
};

export const Brand = {
  args: { children: 'Brand', variant: 'brand' },
};

export const Success = {
  args: { children: 'Sin Root', variant: 'success' },
};

export const Warning = {
  args: { children: 'Riesgo Bajo', variant: 'warning' },
};

export const Danger = {
  args: { children: 'Avanzado', variant: 'danger' },
};

export const AllVariants = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="brand">Brand</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Danger</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  ),
};
