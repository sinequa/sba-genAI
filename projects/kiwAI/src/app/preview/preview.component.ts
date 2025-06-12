import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from "@angular/core";
import { ResultModule } from '@sinequa/components/result';
import { Preview, PreviewHighlightColors, PreviewModule } from '@sinequa/components/preview';
import { MetadataConfig, MetadataModule } from '@sinequa/components/metadata';
import { CustomHighlights, Record } from "@sinequa/core/web-services";
import { Action } from "@sinequa/components/action";
import { BsFacetModule } from "@sinequa/components/facet";

@Component({
  selector: "sq-mini-preview",
  templateUrl: "./preview.component.html",
  styleUrls: ["./preview.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, PreviewModule, BsFacetModule, MetadataModule, ResultModule]
})
export class MiniPreviewComponent {
  openedDoc: Record | undefined;
  preview?: Preview;
  snippetId?: number;
  customHighlights?: CustomHighlights[];
  previewCustomActions: Action[];

  previewHighlights: PreviewHighlightColors[] = [
    {
        name: 'extractslocations',
        color: 'black',
        bgColor: '#fffacd'

    },
    {
        name: 'matchlocations',
        color: 'black',
        bgColor: '#ff0'
    }
  ];

  metadata: MetadataConfig[] = [
    {
        field: "treepath",
        label: "msg#metadata.treepath_label",
        icon: "fas fa-fw fa-folder-open",
        filterable: true,
        collapseRows: true
    },
    {
        field: "filename",
        label: "msg#metadata.filename_label",
        icon: "far fa-fw fa-file-alt"
    },
    {
        field: "authors",
        label: "msg#metadata.authorsPluralLabel",
        icon: "fas fa-fw fa-user-edit",
        filterable: true
    },
    {
        field: "modified",
        label: "msg#metadata.modifiedLabel",
        icon: "far fa-fw fa-calendar-alt"
    }
  ];

  constructor(
    public cdr: ChangeDetectorRef
  ) {

    const closeAction = new Action({
      icon: "fas fa-fw fa-times",
      title: "msg#preview.closeTitle",
      action: () => this.openedDoc = undefined
    });

    this.previewCustomActions = [closeAction];

    window.addEventListener('message', (event: MessageEvent) => {
      const message = event.data;
      if (message.type === 'init') {
        setTimeout(() => {
          this.selectSnippet();
        }, 1000);
      }
    });
  }

  onPreviewReady(preview: Preview) {
    this.preview = preview;
  }

  selectSnippet() {
    if(this.snippetId !== undefined && this.preview) {
      this.preview.select(`snippet_${this.snippetId}`);
    }
  }

  openMiniPreview(record: Record, customHighlights?: CustomHighlights[], snippetId?: number) {
    this.snippetId = snippetId;
    this.customHighlights = customHighlights;

    if(this.openedDoc !== record) {
      this.preview = undefined;
      this.openedDoc = record;
      this.cdr.markForCheck();
    }
    else {
      // Select the passage in the already open preview
      this.selectSnippet();
    }

  }


}
