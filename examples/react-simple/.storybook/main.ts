import type { StorybookConfig } from '@storybook/react/types';

const config: StorybookConfig = {
  stories: [
    {
      directory: '../src',
      titlePrefix: 'Demo',
    },
  ],
  logLevel: 'debug',
  addons: [],
  typescript: {
    check: true,
    checkOptions: {},
    reactDocgenTypescriptOptions: {
      propFilter: (prop) => ['label', 'disabled'].includes(prop.name),
    },
  },
  core: {
    builder: { name: 'webpack4' },
    channelOptions: { allowFunction: false, maxDepth: 10 },
  },
  features: {
    postcss: false,
    modernInlineRender: true,
    storyStoreV7: !global.navigator?.userAgent?.match?.('jsdom'),
    buildStoriesJson: true,
    babelModeV7: true,
    warnOnLegacyHierarchySeparator: false,
    previewMdx2: true,
    breakingChangesV7: true,
  },
  framework: '@storybook/react',
};
module.exports = config;