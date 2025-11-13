import { Component, OnDestroy, ViewChild } from "@angular/core";
import { LogLevel } from "@microsoft/signalr";
import { TranslocoService } from '@jsverse/transloco';

import { ChatComponent, ChatConfig, ChatContextAttachment, MessageHandler, SuggestedAction } from "@sinequa/assistant/chat";
import { SearchService } from "@sinequa/components/search";
import { AppService } from "@sinequa/core/app-utils";
import { AuthenticationService, ComponentWithLogin } from "@sinequa/core/login";
import { PrincipalWebService, Record } from "@sinequa/core/web-services";
import { Subscription } from "rxjs";
import { environment } from "../environments/environment";
import { MiniPreviewComponent } from "./preview/preview.component";
import { IntlService } from "@sinequa/core/intl";
import { NotificationsListenerService } from "./notification.listener";
import { setGlobalConfig } from "@sinequa/atomic";

@Component({
  selector: "app",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent extends ComponentWithLogin implements OnDestroy {
  @ViewChild(ChatComponent) sqChat: ChatComponent;

  settingsView = false;
  enableSettings = false;
  savedChatView = false;

  logLevel = environment.production ? LogLevel.None : LogLevel.Debug;
  messageHandlers: Map<string, MessageHandler<any>> = new Map([["function_int", { handler: (data: number) => console.log("this is my custom handler" + data), isGlobalHandler: true }]])

  subscription = new Subscription();

  constructor(
    public appService: AppService,
    public searchService: SearchService,
    private principalService: PrincipalWebService,
    private intlService: IntlService,
    private readonly transloco: TranslocoService,
    public notificationsListenerService: NotificationsListenerService,
    private authenticationService: AuthenticationService
  ) {
    super();
    this.transloco.setActiveLang(this.intlService.currentLocale.name);
    this.subscription.add(
      this.intlService.events.subscribe(event => {
        const lang = event.locale.split("-")[0]; // Get the language code (e.g., "en" from "en-US")
        if (this.transloco.getActiveLang() !== lang) this.transloco.setActiveLang(lang);
      }
    ));
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.subscription.unsubscribe();
  }

  override onLoginComplete(){
    /**
     * The assistant library is now using the globalConfig object to manage user override
     * Thus, it relies on the atomic library.
     * However, the kiwAI app does not use the atomic library. It uses the core and components libraries under the hood.
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


  get instanceId(): string {
    return 'standalone-assistant';
  }

  openMiniPreviewWithChunks(ref: ChatContextAttachment, preview: MiniPreviewComponent) {
    const customHighlights = !ref.parts?.length ? undefined : [{
      category: "snippet",
      highlights: ref.parts,
    }];
    const snippetId = ref.$partId !== undefined ? ref.$partId! - 1 : undefined;
    preview.openMiniPreview(ref.record as Record, customHighlights, snippetId);
  }

  openDocument(record: Record) {
    const url = record.url1 || record.originalUrl;
    if (url) {
      // Open the URL in a new tab
      window.open(url, '_blank');
    }
  }

  /**
   * Handler for the suggestion actions selected by the user in the chat
   * @param action The suggested action
   */
  onSuggestAction(action: SuggestedAction) {
    switch (action.type) {
      case "Prefill":
        this.insertText(action.content);
        break;
      case "Submit":
        this.submitQuestion(action.content);
        break;
      default:
        console.log("Assistant's unknown suggested action type: " + action.type);
    }
  }

  submitQuestion(question: string) {
      this.sqChat.question = question;
      this.sqChat.submitQuestion();
  }

  insertText(text: string): void {
    const start = this.sqChat.questionInput!.nativeElement.selectionStart;
    const end = this.sqChat.questionInput!.nativeElement.selectionEnd;
    this.sqChat.question = this.sqChat.question.substring(0, start) + text + this.sqChat.question.substring(end, this.sqChat.question.length);
    this.sqChat.questionInput!.nativeElement.value = this.sqChat.question;
  }

  toggleSavedChats() {
    this.savedChatView = !this.savedChatView;
  }

  toggleChatSettings(value: boolean) {
    this.settingsView = value;
  }

  onChatConfig(config: ChatConfig) {
    this.enableSettings = this.principalService.principal!.isAdministrator || config.uiSettings.display;
  }

  openDefaultChat() {
    this.sqChat?.newChat();
  }

  get disableResetChat(): boolean {
    return !!(this.sqChat?.chatService?.streaming$.value || this.sqChat?.chatService?.stoppingGeneration$.value);
  }
}
