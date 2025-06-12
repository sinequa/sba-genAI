import { NgModule, APP_INITIALIZER } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { LocationStrategy, HashLocationStrategy } from "@angular/common";
import { HTTP_INTERCEPTORS } from "@angular/common/http";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import Flow from '@flowjs/flow.js';
import { FlowInjectionToken } from '@flowjs/ngx-flow';

// @sinequa/core library
import { WebServicesModule, StartConfigWebService, StartConfig } from "@sinequa/core/web-services";
import { LoginModule, LoginInterceptor, TeamsInitializer, AuthenticationService } from "@sinequa/core/login";
import { IntlModule } from "@sinequa/core/intl";
import { MODAL_PROMPT, ModalModule } from "@sinequa/core/modal";
import { NotificationsInterceptor } from "@sinequa/core/notification";
import { AuditInterceptor } from "@sinequa/core/app-utils";

// @sinequa/components library
import { BsSearchModule, SearchOptions } from "@sinequa/components/search";
import { BsNotificationModule } from "@sinequa/components/notification";
import { SCREEN_SIZE_RULES } from '@sinequa/components/utils';
import { BsUserSettingsModule } from '@sinequa/components/user-settings';
import { MLModule } from '@sinequa/components/machine-learning';
import { ChatComponent, ChatPrompt, ChatSettingsV3Component, SavedChatsComponent } from '@sinequa/assistant/chat';

import { appInitializerFn } from "@sinequa/atomic";

// Modules
import { TranslocoRootModule } from "./transloco-root.module";

// Components
import { AppComponent } from "./app.component";
import { MiniPreviewComponent } from "./preview/preview.component";
import { SidebarComponent } from "./sidebar/sidebar.component";
import { UserCardComponent } from "./user-card/user-card.component";

// Environment
import { environment } from "../environments/environment";

// Initialization of @sinequa/core
export const startConfig: StartConfig = {
  production: environment.production,
  auditEnabled: true,
};

// @sinequa/core config initializer
export function StartConfigInitializer(startConfigWebService: StartConfigWebService) {
    return () => startConfigWebService.fetchPreLoginAppConfig();
}

// Search options (search service)
export const searchOptions: SearchOptions = {
    deactivateRouting: true,
    routes: [],
    homeRoute: "home"
};


// Application languages (intl service)
import {LocalesConfig, Locale} from "@sinequa/core/intl";
import enLocale from "../locales/en";
import frLocale from "../locales/fr";

export class AppLocalesConfig implements LocalesConfig {
    defaultLocale: Locale;
    locales?: Locale[];
    constructor(){
        this.locales = [
            { name: "en", display: "msg#locale.en", data: enLocale},
            { name: "fr", display: "msg#locale.fr", data: frLocale}
        ];
        this.defaultLocale = this.locales[0];
    }
}


// Screen size breakpoints (consistent with Bootstrap custom breakpoints in app.scss)
export const breakpoints = {
    xl: "(min-width: 1650px)",
    lg: "(min-width: 1400px) and (max-width: 1649.98px)",
    md: "(min-width: 992px) and (max-width: 1399.98px)",
    sm: "(min-width: 576px) and (max-width: 991.98px)",
    xs: "(max-width: 575.98px)",
};


@NgModule({
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        RouterModule.forRoot([]),
        FormsModule,
        ReactiveFormsModule,

        WebServicesModule.forRoot(startConfig),
        IntlModule.forRoot(AppLocalesConfig),
        LoginModule,
        ModalModule,

        BsSearchModule.forRoot(searchOptions),
        BsNotificationModule,
        BsUserSettingsModule,
        MLModule,
        SidebarComponent,
        MiniPreviewComponent,

        ChatComponent,
        ChatSettingsV3Component,
        SavedChatsComponent,
        UserCardComponent,
        ChatPrompt,
        TranslocoRootModule
    ],
    declarations: [
        AppComponent
    ],
    providers: [
        // Provides an APP_INITIALIZER which will fetch application configuration information from the Sinequa
        // server automatically at startup using the application name specified in the URL (app[-debug]/<app-name>).
        // This allows an application to avoid hard-coding parameters in the StartConfig but requires that the application
        // be served from the an app[-debug]/<app name> URL.
        {provide: APP_INITIALIZER, useFactory: StartConfigInitializer, deps: [StartConfigWebService], multi: true},
        { provide: APP_INITIALIZER, useFactory: () => appInitializerFn, multi: true },
        // Uncomment if the app is to be used with Teams
        {provide: APP_INITIALIZER, useFactory: TeamsInitializer, deps: [AuthenticationService], multi: true},

        // Provides the Angular LocationStrategy to be used for reading route state from the browser's URL. Currently
        // only the HashLocationStrategy is supported by Sinequa.
        {provide: LocationStrategy, useClass: HashLocationStrategy},

        // Provides an HttpInterceptor to handle user login. The LoginInterceptor handles HTTP 401 responses
        // to Sinequa web service requests and initiates the login process.
        {provide: HTTP_INTERCEPTORS, useClass: LoginInterceptor, multi: true},

        // Provides an HttpInterceptor that offers a centralized location through which all client-side
        // audit records pass. An application can replace AuditInterceptor with a subclass that overrides
        // the updateAuditRecord method to add custom audit information to the records.
        {provide: HTTP_INTERCEPTORS, useClass: AuditInterceptor, multi: true},

        // Provides an HttpInterceptor that automatically processes any notifications specified in the $notifications
        // member of the response body to any Sinequa web service requests.
        {provide: HTTP_INTERCEPTORS, useClass: NotificationsInterceptor, multi: true},

        { provide: SCREEN_SIZE_RULES, useValue: breakpoints },
        { provide: MODAL_PROMPT, useValue: ChatPrompt },
        { provide: FlowInjectionToken, useValue: Flow }
    ],
    bootstrap: [
        AppComponent
    ]
})
export class AppModule {
}
