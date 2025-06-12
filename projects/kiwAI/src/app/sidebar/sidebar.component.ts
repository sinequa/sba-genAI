import { CommonModule } from "@angular/common";
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { TranslocoPipe, TranslocoService } from "@jsverse/transloco";
import { BehaviorSubject, filter, merge, Observable, Subscription, switchMap, tap } from "rxjs";

import { DocumentUploadComponent, SavedChatsComponent, DocumentListComponent, DocumentOverviewComponent } from "@sinequa/assistant/chat";
import { Action } from "@sinequa/components/action";
import { BsFacetModule, FacetService } from "@sinequa/components/facet";
import { FiltersModule } from "@sinequa/components/filters";
import { FirstPageService, SearchService } from "@sinequa/components/search";
import { AppService, Query } from "@sinequa/core/app-utils";
import { LoginService } from "@sinequa/core/login";
import { Results } from "@sinequa/core/web-services";

@Component({
  selector: "sq-sidebar",
  templateUrl: "./sidebar.component.html",
  styleUrls: ["./sidebar.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    FiltersModule,
    BsFacetModule,
    SavedChatsComponent,
    DocumentUploadComponent,
    DocumentOverviewComponent,
    DocumentListComponent,
    TranslocoPipe
  ],

})
export class SidebarComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild("dialog") dialog: ElementRef<HTMLDialogElement>;
  @ViewChild(DocumentOverviewComponent) sqDocumentOverview: DocumentOverviewComponent;
  @ViewChild(DocumentUploadComponent) sqDocumentUpload: DocumentUploadComponent;
  @ViewChild(DocumentListComponent) sqDocumentList: DocumentListComponent;

  public refreshAction = new Action({
    icon: "fas fa-sync",
    action: () => this.sqDocumentOverview?.updateUploadedDocumentsList()
  });
  public documentListRefreshAction = new Action({
    icon: "fas fa-sync",
    action: () => this.sqDocumentList?.updateUploadedDocumentsList()
  });
  public documentListDeleteAllAction = new Action({
    icon: 'fas fa-trash',
    action: () => this.sqDocumentList?.deleteAllDocuments()
  });

  public results$: Observable<Results | undefined>;
  private readonly overrideResults$ = new BehaviorSubject<Results | undefined>(undefined);
  private _results: Results | undefined;
  disabledUpload: boolean = true;
  uploadedDocumentsTitle: string = this.transloco.translate('uploaded');
  private readonly _subscription = new Subscription();

  constructor(
    public appService: AppService,
    public loginService: LoginService,
    public searchService: SearchService,
    public firstPageService: FirstPageService,
    public facetService: FacetService,
    public cdr: ChangeDetectorRef,
    private readonly transloco: TranslocoService
  ) {
    // Load the current language once (in case it's not already loaded)
    this.transloco.load(this.transloco.getActiveLang()).subscribe(() => {
      // Safe to translate now
      this.internationalizeActionsTitle();
    });

    // React to future language switches
    this._subscription.add(
      this.transloco.langChanges$
        .pipe(switchMap(lang => this.transloco.load(lang)))
        .subscribe(() => {
          // Re-initialize on language switch
          this.internationalizeActionsTitle();
        })
    );
  }

  ngOnInit() {
    this.results$ = merge(
      this.firstPageService.getFirstPage(),
      this.overrideResults$
    ).pipe(
      tap((results) => this._results = results)
    );

    this._subscription.add(
      this.facetService.events.pipe(
        filter((x) => x.type !== 'Facet_TreeOpen')
      ).subscribe(() =>
        this.onQueryChange(this.searchService.query)
      )
    );
  }

  get instanceId(): string {
    return 'standalone-assistant';
  }

  get isDocumentsUploadEnabled(): boolean {
    return this.appService.app?.data?.documentsUploadSettings?.enabled || false;
  }

  ngAfterViewInit() {
    this._subscription.add(
      this.sqDocumentUpload?.documentsUploadService
        .uploadConfig$.subscribe((uploadConfig) => {
          this.disabledUpload = !uploadConfig?.documentsUploadEnabled;
        })
    );

    // Update the document list after the dialog is closed
    this.dialog?.nativeElement.addEventListener("close", (event) => {
      this.sqDocumentOverview.updateUploadedDocumentsList();
    });
  }

  ngOnDestroy() {
    this._subscription.unsubscribe();
  }

  internationalizeActionsTitle() {
    this.refreshAction.title = this.transloco.translate('refresh');
    this.documentListRefreshAction.title = this.transloco.translate('refresh');
    this.documentListDeleteAllAction.title = this.transloco.translate('deleteAll');
  }

  openDialog() {
    this.dialog?.nativeElement.showModal();
  }

  closeDialog() {
    this.dialog?.nativeElement.close();
  }

  onQueryChange(query: Query) {
    // Trigger change detection when filters are updated
    this.searchService.setQuery(query.copy());
    if (this._results) {
      const results = { ...this._results };
      this.searchService.initializeResults(this.searchService.query, results);
      this.overrideResults$.next(results);
    }
  }

}
