import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BsFacetDate } from '@sinequa/analytics/timeline';
import { Action } from '@sinequa/components/action';
import { DEFAULT_FACET_COMPONENTS, FacetConfig } from '@sinequa/components/facet';
import { MetadataConfig } from '@sinequa/components/metadata';
import { Preview, PreviewHighlightColors, PreviewService } from '@sinequa/components/preview';
import { SearchService } from '@sinequa/components/search';
import { SelectionService } from '@sinequa/components/selection';
import { HelpFolderOptions } from '@sinequa/components/user-settings';
import { UIService } from '@sinequa/components/utils';
import { AppService, Query } from '@sinequa/core/app-utils';
import { IntlService } from '@sinequa/core/intl';
import { LoginService } from '@sinequa/core/login';
import { AuditEventType, AuditWebService, CustomHighlights, PrincipalWebService, Record, Results } from '@sinequa/core/web-services';
import { combineLatest, map, Observable, Subscription, switchMap, tap } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';

import { FACETS, FEATURES, FacetParams, METADATA_CONFIG, PREVIEW_HIGHLIGHTS } from '../../config';
import { ChatComponent, ChatConfig, ChatContextAttachment, DocumentOverviewComponent, DocumentUploadComponent, SuggestedAction, DocumentListComponent } from '@sinequa/assistant/chat';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit, OnDestroy {

  @ViewChild(ChatComponent) sqChat: ChatComponent;
  @ViewChild("dialog") dialog: ElementRef<HTMLDialogElement>;
  @ViewChild(DocumentOverviewComponent) sqDocumentOverview: DocumentOverviewComponent;
  @ViewChild(DocumentUploadComponent) sqDocumentUpload: DocumentUploadComponent;
  @ViewChild(DocumentListComponent) sqDocumentList: DocumentListComponent;

  // Document "opened" via a click (opens the preview facet)
  public openedDoc?: Record;
  public preview?: Preview;
  public passageId?: number;
  public snippetId?: number;
  public customHighlights?: CustomHighlights[];

  // Custom action for the preview facet (open the preview route)
  public previewCustomActions: Action[];

  // Custom action for the assistant reset chat
  public resetChatAction: Action;

  // Custom action for the chat settings
  public chatSettingsAction: Action;
  enableSettings = false;

  // Custom action for the assistant upload document
  public documentOverviewRefreshAction: Action;
  public documentListRefreshAction: Action;
  public documentListDeleteAllAction: Action;

  /**
   * Controls visibility of filters (small screen sizes)
   */
  public showFilters = this.ui.screenSizeIsGreaterOrEqual('md');
  /**
   * Controls visibility of menu (small screen sizes)
   */
  public showMenu = (this.ui.screenSizeIsGreaterOrEqual('md')) ? true : false;
  /**
   * Controls visibility of the search bar (small screen sizes)
   */
  public showSearch = true;
  /**
   * Controls visibility of the filters toggle button (small screen sizes)
   */
  public showFilterToggle = false;

  public results$: Observable<Results | undefined>;

  public readonly facetComponents = {
      ...DEFAULT_FACET_COMPONENTS,
      "date": BsFacetDate
  }

  public helpFolderOptions: HelpFolderOptions = {
    path: '/r/_sinequa/webpackages/help',
    indexFile: 'olh-search.html#sdard-search',
  }

  public isDark: boolean;

  public miniPreviewQuery?: Query;

  private subscription = new Subscription();

  public isChatInitialized = false;
  disabledUpload: boolean = true;
  uploadedDocumentsTitle: string;

  constructor(
    private previewService: PreviewService,
    private titleService: Title,
    private intlService: IntlService,
    private appService: AppService,
    public readonly ui: UIService,
    public searchService: SearchService,
    public selectionService: SelectionService,
    public loginService: LoginService,
    public auditService: AuditWebService,
    private principalService: PrincipalWebService,
    private readonly transloco: TranslocoService
  ) {

    this.chatSettingsAction = new Action({
      icon: 'fas fa-cog',
      action: action => {
        action.selected = !action.selected;
      }
    });

    this.resetChatAction = new Action({
      icon: 'fas fa-sync',
      action: () => this.sqChat?.newChat()
    });

    this.documentOverviewRefreshAction = new Action({
      icon: "fas fa-sync",
      action: () => this.sqDocumentOverview?.updateUploadedDocumentsList()
    });

    this.documentListRefreshAction = new Action({
      icon: "fas fa-sync",
      action: () => this.sqDocumentList?.updateUploadedDocumentsList()
    });

    this.documentListDeleteAllAction = new Action({
      icon: 'fas fa-trash',
      action: () => this.sqDocumentList?.deleteAllDocuments()
    });

    const expandAction = new Action({
      icon: "fas fa-fw fa-expand-alt",
      title: "msg#preview.expandTitle",
      action: () => {
        if (this.openedDoc) {
          this.previewService.openRoute(this.openedDoc, this.searchService.query);
        }
      }
    });

    const closeAction = new Action({
      icon: "fas fa-fw fa-times",
      title: "msg#preview.closeTitle",
      action: () => {
        this.closeDocument();
      }
    });

    this.previewCustomActions = [expandAction, closeAction];

    this.showFilters = (this.ui.screenSizeIsGreater('md'));
    this.showFilterToggle = (this.ui.screenSizeIsLessOrEqual('md'));

    // when size change, adjust _showFilters variable accordingly
    // To avoid weird behavior with the Toggle Filters button
    this.subscription.add(this.ui.resizeEvent.subscribe(_ => {
      this.showFilterToggle = (this.ui.screenSizeIsLessOrEqual('md'));
      this.showMenu = (this.ui.screenSizeIsGreaterOrEqual('md'));
      this.showSearch = (this.ui.screenSizeIsGreaterOrEqual('sm'));
      this.showFilters = (this.ui.screenSizeIsGreaterOrEqual('md'));
    }));

    this.subscription.add(this.ui.isDarkTheme$.subscribe(value => this.isDark = value));

    window.addEventListener('message', (event: MessageEvent) => {
      const message = event.data;
      if (message.type === 'init') {
        setTimeout(() => {
          this.selectPassageOrSnippet();
        }, 2000);
      }
    });

    // Load the current language once (in case it's not already loaded)
    this.transloco.load(this.transloco.getActiveLang()).subscribe(() => {
      // Safe to translate now
      this.internationalizeActionsTitle();
      this.uploadedDocumentsTitle = this.transloco.translate('uploaded');
    });

    // React to future language switches
    this.subscription.add(
      this.transloco.langChanges$
        .pipe(switchMap(lang => this.transloco.load(lang)))
        .subscribe(() => {
          // Re-initialize on language switch
          this.internationalizeActionsTitle();
          this.uploadedDocumentsTitle = this.transloco.translate('uploaded');
        })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * Initializes the component.
   * Sets the page title and subscribes to the search service events.
   * Updates the query name and filters when new results are received.
   * Mutates the results/records if desired and updates the page title.
   */
  ngOnInit() {
    this.titleService.setTitle(this.intlService.formatMessage("msg#search.pageTitle", { search: "" }));

    // mutate results/records if desired, convert to switchMap or mergeMap if additional calls need to be chained
    // consult RxJS documentation for additional functionality like combineLatest, etc.
    this.results$ = this.searchService.resultsStream
      .pipe(
        tap(results => {
          this.titleService.setTitle(this.intlService.formatMessage("msg#search.pageTitle", {search: this.searchService.query.text || ""}));
          if (!this.showResults) {
            this.openedDoc = undefined;
            this.showFilters = false;
          }
          if(results && results.records.length <= results.pageSize) {
            window.scrollTo({top: 0, behavior: 'auto'});
          }
        })
      );
  }

  internationalizeActionsTitle() {
    this.chatSettingsAction.title = this.transloco.translate('openSettings');
    this.resetChatAction.title = this.transloco.translate('resetAssistant');
    this.documentOverviewRefreshAction.title = this.transloco.translate('refresh');
    this.documentListRefreshAction.title = this.transloco.translate('refresh');
    this.documentListDeleteAllAction.title = this.transloco.translate('deleteAll');
  }

  /**
   * Returns the configuration of the facets displayed in the facet-multi component.
   * The configuration from the config.ts file can be overriden by configuration from
   * the app configuration on the server
   */
  public get facets(): FacetConfig<FacetParams>[] {
    return this.appService.app?.data?.facets as any as FacetConfig<FacetParams>[] || FACETS;
  }

  /**
   * Returns the list of features activated in the top right menus.
   * The configuration from the config.ts file can be overriden by configuration from
   * the app configuration on the server
   */
  public get features(): string[] {
    return this.appService.app?.data?.features as string[] || FEATURES;
  }

  /**
   * Returns the configuration of the metadata displayed in the facet-preview component.
   * The configuration from the config.ts file can be overriden by configuration from
   * the app configuration on the server
   */
  public get metadata(): MetadataConfig[] {
    return this.appService.app?.data?.metadata as any as MetadataConfig[] || METADATA_CONFIG;
  }

  public get previewHighlights(): PreviewHighlightColors[] {
    return this.appService.app?.data?.previewHighlights as any || PREVIEW_HIGHLIGHTS;
  }

  /**
   * Responds to a click on a document (setting openedDoc will open the preview facet)
   * @param record
   * @param event
   */
  onDocumentClicked(record: Record, event: Event) {
    if(!this.isClickAction(event)){
      this.openMiniPreview(record);
    }
  }

  openMiniPreviewWithChunks(ref: ChatContextAttachment) {
    const customHighlights = !ref.parts.length ? undefined : [{
      category: "snippet",
      highlights: ref.parts,
    }];
    const snippetId = ref.$partId !== undefined ? ref.$partId! - 1 : undefined;
    this.openMiniPreview(ref.record as Record, undefined, customHighlights, snippetId);
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
      default:
        console.log("Assistant's unknown suggested action type: " + action.type);
    }
  }

  insertText(text: string): void {
    const start = this.sqChat.questionInput!.nativeElement.selectionStart;
    const end = this.sqChat.questionInput!.nativeElement.selectionEnd;
    this.sqChat.question = this.sqChat.question.substring(0, start) + text + this.sqChat.question.substring(end, this.sqChat.question.length);
    this.sqChat.questionInput!.nativeElement.value = this.sqChat.question;
  }

  openMiniPreview(record: Record, passageId?: number, customHighlights?: CustomHighlights[], snippetId?: number) {
    this.passageId = passageId;
    this.snippetId = snippetId;
    this.customHighlights = customHighlights;
    this.miniPreviewQuery = new Query(this.searchService.query.name);
    this.miniPreviewQuery.text = this.searchService.query.text || record.title;
    this.miniPreviewQuery.addFilter({field: "id", value: record.id, operator: "eq"});

    if(this.openedDoc !== record) {
      this.preview = undefined;
      this.openedDoc = record;
    }
    else {
      // Select the passage in the already open preview
      this.selectPassageOrSnippet();
    }

    if (this.ui.screenSizeIsLessOrEqual('md')) {
      this.showFilters = false; // Hide filters on small screens if a document gets opened
    }
  }

  onPreviewReady(preview: Preview) {
    this.preview = preview;
  }

  openDocument(record: Record) {
    const url = record.url1 || record.originalUrl;
    if (url) {
      // Open the URL in a new tab
      window.open(url, '_blank');
    }
  }

  /**
   * Select the selected matchingpassage in the preview, if any
   */
  selectPassageOrSnippet() {
    if (this.preview) {
      if (this.passageId !== undefined) {
        const passage = this.preview.data?.record.matchingpassages?.passages.find(p => p.id === this.passageId);
        if(passage) {
          this.preview.selectStart("matchingpassages", passage.rlocation[0]);
        }
      }
      else if (this.snippetId !== undefined) {
        this.preview.select(`snippet_${this.snippetId}`);
      }
    }
  }

  /**
   * Open the preview when this record has no url1
   * @param record
   * @param isLink
   */
  openPreviewIfNoUrl(record: Record, isLink: boolean) {
    if(!isLink){
      this.previewService.openRoute(record, this.searchService.query);
    }
  }

  /**
   * Responds to the preview facet being closed by a user action
   */
  closeDocument(){
    if(this.openedDoc){
      this.auditService.notify({
        type: AuditEventType.Preview_Close,
        detail: this.previewService.getAuditPreviewDetail(this.openedDoc.id, this.searchService.query, this.openedDoc, this.searchService.results?.id)
      });
      this.openedDoc = undefined;
      if(this.ui.screenSizeIsEqual('md')){
        this.showFilters = true; // Show filters on medium screen when document is closed
      }
    }
  }

  // Make sure the click is not meant to trigger an action
  private isClickAction(event: Event): boolean {
    const target = event.target as HTMLElement|null;
    return event.type !== 'click' || !!target?.matches("a, a *, input, input *, button, button *");
  }

  /**
   * Show or hide the left facet bar (small screen sizes)
   */
  toggleFilters(){
    this.showFilters = !this.showFilters;
    if(this.showFilters){ // Close document if filters are displayed
      this.openedDoc = undefined;
    }
  }


  /**
   * Show or hide the user menus (small screen sizes)
   */
  toggleMenu(){
    this.showMenu = !this.showMenu;
    this.showSearch = !this.showMenu;
  }

  /**
   * Determine whether to show or hide results
   */
  get showResults(): boolean {
    if(this.ui.screenSizeIsLessOrEqual('sm')){
      return !this.showFilters && !this.openedDoc;
    }
    return true;
  }

  /**
   * Any icons mappings overrides
   * Overrides "defaultFormatIcons" from @sinequa/components/result
   */
  get formatIcons(): any {
    return this.appService.app?.data?.formatIcons;
  }

  /**
   * Handles the click event for similar documents.
   * @param {Object} id - The ID of the document.
   */
  similarDocumentsClick({id}) {
    this.searchService.getRecords([id]).subscribe(records => {
      if (records.length > 0) {
        const record = records[0] as Record;
        this.previewService.openRoute(record, this.searchService.query);
      }
    });
  }

  get instanceId(): string {
    return 'search-results-assistant';
  }

  get miniPreviewInstanceId(): string {
    return 'mini-preview-assistant';
  }

  toggleChatSettings(value: boolean) {
    this.chatSettingsAction.selected = value;
  }

  onChatConfig(config: ChatConfig) {
    this.isChatInitialized = true;
    this.enableSettings = this.principalService.principal!.isAdministrator || config.uiSettings.display;

    setTimeout(() => {
      this.subscription.add(
        this.sqDocumentUpload?.documentsUploadService
          .uploadConfig$.subscribe((uploadConfig) => {
            this.disabledUpload = !uploadConfig?.documentsUploadEnabled;
          })
      );
      this.subscription.add(
        combineLatest([
          this.sqChat.chatService.streaming$,
          this.sqChat.chatService.stoppingGeneration$
        ]).pipe(
          map(([streaming, stoppingGeneration]) => !!(streaming || stoppingGeneration))
        ).subscribe((result) => {
          this.resetChatAction.disabled = result;
        })
      );
      // Update the document list after the dialog is closed
      this.dialog?.nativeElement.addEventListener("close", () => {
        this.sqDocumentOverview.updateUploadedDocumentsList();
      });
    });

  }

  attachToAssistant(doc: Record, event: Event) {
    event.stopPropagation();
    this.sqChat?.attachToChat([doc.id]);
  }

  get disableAttachToChat(): boolean {
    return !!(this.sqChat?.chatService?.streaming$.value || this.sqChat?.chatService?.stoppingGeneration$.value);
  }

  get isDocumentsUploadEnabled(): boolean {
    return this.appService.app?.data?.documentsUploadSettings?.enabled || false;
  }

  closeDialog() {
    this.dialog?.nativeElement.close();
  }

  openDialog() {
    this.dialog?.nativeElement.showModal();
  }
}
