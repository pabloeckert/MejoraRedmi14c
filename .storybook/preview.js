import '../src/index.css';

/** @type { import('@storybook/react').Preview } */
const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: 'oklch(0.985 0.005 55)' },
        { name: 'dark', value: 'oklch(0.130 0.012 55)' },
      ],
    },
  },
  initialGlobals: {
    backgrounds: { value: 'light' },
  },
};

export default preview;
