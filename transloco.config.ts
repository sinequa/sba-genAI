import { TranslocoGlobalConfig } from '@jsverse/transloco-utils';

const config: TranslocoGlobalConfig = {
  langs: ['en', 'fr'],
  keysManager: {},
  scopedLibs: [
    {
      src: '@sinequa/assistant',
      dist: ['./projects/kiwAI/src/assets/i18n', './projects/vanillAI/src/assets/i18n']
    }
  ]
};

export default config;
