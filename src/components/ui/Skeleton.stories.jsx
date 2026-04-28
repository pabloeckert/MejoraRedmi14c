import { Skeleton, ModuleSkeleton } from './Skeleton';

export default {
  title: 'UI/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Componente de carga animada. Muestra placeholders mientras el contenido carga.',
      },
    },
  },
};

export const Text = {
  args: { variant: 'text', className: 'h-4 w-48' },
};

export const Circle = {
  args: { variant: 'circle', width: 48, height: 48 },
};

export const Card = {
  args: { variant: 'card', className: 'h-24 w-full' },
};

export const Module = {
  render: () => <ModuleSkeleton />,
  parameters: {
    docs: {
      description: { story: 'Skeleton completo para carga de módulos.' },
    },
  },
};
