import type { StorybookConfig } from '@storybook/nextjs-vite'
import { mergeConfig } from 'vite'

const config: StorybookConfig = {
  stories: ['../components/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-docs'],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },
  staticDirs: ['../public'],
  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
  viteFinal: async (config) =>
    mergeConfig(config, {
      resolve: {
        alias: { '@': process.cwd() },
      },
    }),
}

export default config
