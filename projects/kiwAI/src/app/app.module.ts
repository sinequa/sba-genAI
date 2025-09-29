import { HashLocationStrategy, LocationStrategy } from "@angular/common";
import { HTTP_INTERCEPTORS } from "@angular/common/http";
import { APP_INITIALIZER, NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { RouterModule } from "@angular/router";
import Flow from '@flowjs/flow.js';
import { FlowInjectionToken } from '@flowjs/ngx-flow';

// @sinequa/core library
import { AuditInterceptor } from "@sinequa/core/app-utils";
import { IntlModule } from "@sinequa/core/intl";
import { AuthenticationService, LoginInterceptor, LoginModule, TeamsInitializer } from "@sinequa/core/login";
import { ModalModule } from "@sinequa/core/modal";
import { NotificationsInterceptor } from "@sinequa/core/notification";
import { StartConfig, StartConfigWebService, WebServicesModule } from "@sinequa/core/web-services";

// @sinequa/components library
import { ChatComponent, ChatSettingsV3Component, CustomElementsService, initializeCustomElements, SavedChatsComponent } from '@sinequa/assistant/chat';
import { MLModule } from '@sinequa/components/machine-learning';
import { BsNotificationModule } from "@sinequa/components/notification";
import { BsSearchModule, SearchOptions } from "@sinequa/components/search";
import { BsUserSettingsModule } from '@sinequa/components/user-settings';
import { SCREEN_SIZE_RULES } from '@sinequa/components/utils';

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
import { Locale, LocalesConfig } from "@sinequa/core/intl";
import enLocale from "../locales/en";
import frLocale from "../locales/fr";
import deLocale from "../locales/de";

export class AppLocalesConfig implements LocalesConfig {
    defaultLocale: Locale;
    locales?: Locale[];
    constructor(){
        this.locales = [
            { name: "en", display: "msg#locale.en", data: enLocale},
            { name: "fr", display: "msg#locale.fr", data: frLocale},
            { name: "de", display: "msg#locale.de", data: deLocale}
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

        // Provides an APP_INITIALIZER which will initialize the custom elements defined in the @sinequa/assistant/chat
        // library. This is required to be able to use the custom elements in Angular components templates.
        {
            provide: APP_INITIALIZER,
            useFactory: initializeCustomElements,
            multi: true,
            deps: [CustomElementsService],
        },

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
        { provide: FlowInjectionToken, useValue: Flow }
    ],
    bootstrap: [
        AppComponent
    ]
})
export class AppModule {
}
