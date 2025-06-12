import { isDevMode, NgModule } from '@angular/core';

import { provideTransloco, TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';

import { TranslocoHttpLoader } from './transloco-loader';

@NgModule({
  exports: [TranslocoModule],
  providers: [
    provideTransloco({
      config: {
        availableLangs: ['en', 'fr'],
        defaultLang: 'en',
        // Remove this option if your application doesn't support changing language in runtime.
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
        fallbackLang: 'en',
        missingHandler: {
          logMissingKey: true,
          useFallbackTranslation: true
        }
      },
      loader: TranslocoHttpLoader,
    }),
    provideTranslocoMessageformat()
  ],
})
export class TranslocoRootModule {}
