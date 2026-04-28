import { CopyButton } from './CopyButton';

export default {
  title: 'UI/CopyButton',
  component: CopyButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Botón copiar con feedback visual (✓ Copiado). Usa clipboard API con fallback.',
      },
    },
  },
};

export const Default = {
  args: {
    text: 'adb shell settings put global window_animation_scale 0.5',
  },
};

export const ShortText = {
  args: {
    text: 'echo "hello"',
  },
};
