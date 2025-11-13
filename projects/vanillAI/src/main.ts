import "hammerjs";
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { setGlobalConfig } from "@sinequa/atomic";
import { initializeFetchInterceptor, setAppInjector } from "@sinequa/assistant/chat";

if (environment.production) {
    enableProdMode();
}

setGlobalConfig(environment as any);

// 1. Call the patching function BEFORE bootstrapping Angular
initializeFetchInterceptor();

platformBrowserDynamic().bootstrapModule(AppModule, { preserveWhitespaces: true }).then(
    appRef => {
        // 2. IMPORTANT: Set the global injector after successful bootstrap
        setAppInjector(appRef.injector);
    })
    .catch(err => console.error(err));
