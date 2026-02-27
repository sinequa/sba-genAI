import { Component, OnDestroy } from "@angular/core";
import { TranslocoService } from "@jsverse/transloco";
import { Subscription } from "rxjs";

import { AuthenticationService, ComponentWithLogin } from "@sinequa/core/login";
import { BasketsService } from '@sinequa/components/baskets';
import { SavedQueriesService, RecentQueriesService, RecentDocumentsService } from '@sinequa/components/saved-queries';
import { AlertsService } from '@sinequa/components/alerts';
import { LabelsService } from '@sinequa/components/labels';
import { UserPreferences } from '@sinequa/components/user-settings';
import { SelectionService } from '@sinequa/components/selection';
import { AppService } from '@sinequa/core/app-utils';
import { FEATURES, SELECTORS_HIGHLIGHTS } from '../config';
import { HighlightService } from "@sinequa/components/metadata";
import { PreviewHighlightColors } from "@sinequa/components/preview";
import { NotificationsListenerService } from "./notification.listener";
import { IntlService } from "@sinequa/core/intl";
import { setGlobalConfig } from "@sinequa/atomic";

@Component({
    selector: "app",
    templateUrl: "./app.component.html",
    standalone: false
})
export class AppComponent extends ComponentWithLogin implements OnDestroy {
    subscription = new Subscription();

    constructor(
        // Services are instantiated by the app component,
        // to guarantee they are instantiated in a consistent order,
        // regardless of the entry route.
        // The order below impacts the order of the actions in the selection menu.
        prefs: UserPreferences,
        public highlightService: HighlightService,
        public savedQueriesService: SavedQueriesService,
        public basketsService: BasketsService,
        public alertsService: AlertsService,
        public labelsService: LabelsService,
        _recentQueriesService: RecentQueriesService,
        _RecentDocumentsService: RecentDocumentsService,
        public selectionService: SelectionService,
        public appService: AppService,
        private intlService: IntlService,
        private readonly transloco: TranslocoService,
        public notificationsListenerService: NotificationsListenerService,
        private authenticationService: AuthenticationService
    ){
        super();
        this.transloco.setActiveLang(this.intlService.currentLocale.name);
        this.subscription.add(
          this.intlService.events.subscribe(event => {
            const lang = event.locale.split("-")[0]; // Get the language code (e.g., "en" from "en-US")
            if (this.transloco.getActiveLang() !== lang) this.transloco.setActiveLang(lang);
          }
        ));
    }

    initDone: boolean = false;
    /**
     * Initialize the list of actions in the selection service.
     * This method may be called multiple times, before the login is actually complete,
     * hence the initDone and this.appService.app test
     */
    override onLoginComplete(){

        if(!this.initDone && this.appService.app){

            this.initDone = true;

            let features = FEATURES;
            // The local config (config.ts) can be overriden by server-side config
            if(this.appService.app.data?.features){
                features = <string[]> this.appService.app.data.features;
            }

            features.forEach(feature => {
                switch(feature) {
                    case 'saved-queries': {
                        this.selectionService.selectionActions.push(this.savedQueriesService.selectedRecordsAction);
                        break;
                    }
                    case 'baskets': {
                        this.basketsService.selectedRecordsAction.icon = "fas fa-inbox"; // Overriding the baskets icon (hard coded in the service)
                        this.selectionService.selectionActions.push(this.basketsService.selectedRecordsAction);
                        break;
                    }
                    case 'labels': {
                        const action = this.labelsService.buildSelectionAction();
                        if(action){
                            this.selectionService.selectionActions.push(action);
                        }
                        break;
                    }
                }
            });

            const highlights: {selectors: string[], highlights: PreviewHighlightColors[]}[] = this.appService.app.data?.highlights as any || SELECTORS_HIGHLIGHTS;
            this.highlightService.setHighlights(highlights);
        }

        /**
         * The assistant library is now using the globalConfig object to manage user override
         * Thus, it relies on the atomic library.
         * However, the VanillAI app does not use the atomic library. It uses the core and components libraries under the hood.
         * To ensure the user override feature works correctly, we need to manually propagate the user override state to the globalConfig object.
         */
        if (this.authenticationService.userOverrideActive && this.authenticationService.userOverride) {
          const username = this.authenticationService.userOverride.userName;
          const domain = this.authenticationService.userOverride.domain;
          setGlobalConfig({ userOverrideActive: true, userOverride: { domain, username } });
        } else {
          setGlobalConfig({ userOverrideActive: false, userOverride: undefined });
        }
    }

    override ngOnDestroy(): void {
      super.ngOnDestroy();
      this.subscription.unsubscribe();
    }

}
