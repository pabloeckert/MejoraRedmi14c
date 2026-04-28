import { GlassCard } from './GlassCard';

export default {
  title: 'UI/GlassCard',
  component: GlassCard,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'brand', 'accent'],
    },
    hover: { control: 'boolean' },
  },
  parameters: {
    docs: {
      description: {
        component: 'Card con efecto glassmorphism (backdrop-blur). Base para todos los paneles. Soporta variantes de color y modo interactivo.',
      },
    },
  },
};

export const Default = {
  args: {
    children: 'Contenido de ejemplo dentro de una GlassCard.',
  },
};

export const Brand = {
  args: {
    variant: 'brand',
    children: (
      <div>
        <p className="text-sm font-medium text-text-primary">Variante Brand</p>
        <p className="text-xs text-text-muted mt-1">Con tono terracotta.</p>
      </div>
    ),
  },
};

export const Interactive = {
  args: {
    hover: true,
    children: (
      <div>
        <p className="text-sm font-medium text-text-primary">Clickable Card</p>
        <p className="text-xs text-text-muted mt-1">Hover para ver el efecto.</p>
      </div>
    ),
  },
};

export const WithTitle = {
  args: {
    children: (
      <div>
        <h3 className="text-lg font-bold text-text-primary mb-2">Título</h3>
        <p className="text-sm text-text-secondary">Descripción con texto secundario.</p>
      </div>
    ),
  },
};
