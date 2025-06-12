import "hammerjs";
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { setGlobalConfig } from "@sinequa/atomic";

if (environment.production) {
    enableProdMode();
}

// mandatory, because "@sinequa/atomic" is used in the application
setGlobalConfig(environment as any);

platformBrowserDynamic().bootstrapModule(AppModule, {preserveWhitespaces: true})
    .catch(err => console.error(err));
