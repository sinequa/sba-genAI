import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnChanges, Output, Input, SimpleChanges } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import { InitialsAvatarComponent } from '@sinequa/assistant/chat';
import { Action } from '@sinequa/components/action';
import { BsUserSettingsModule } from '@sinequa/components/user-settings';
import { AppService } from '@sinequa/core/app-utils';
import { PrincipalWebService } from '@sinequa/core/web-services';
import pkg from '@sinequa/assistant/package.json';

@Component({
  selector: 'sq-user-card',
  templateUrl: './user-card.component.html',
  styleUrls: [`./user-card.component.scss`],
  standalone: true,
  imports: [CommonModule, InitialsAvatarComponent, BsUserSettingsModule]
})
export class UserCardComponent implements OnChanges {

  @Input() enableSettings: boolean;
  @Output() toggleChatSettings = new EventEmitter<any>();

  settingsViewAction: Action;
  versionAction: Action;
  customActions: Action[] = [];

  constructor(
    public principalService: PrincipalWebService,
    public appService: AppService,
    private readonly transloco: TranslocoService) {

    this.settingsViewAction = new Action({
      icon: "fas fa-gear fa-fw",
      text: this.transloco.translate('openSettings'),
      scrollable: true,
      action: () => {
        this.toggleChatSettings.emit();
      }
    });

    const sinequaVersion = appService.startConfig?.version ? ` + ${appService.startConfig?.version}` : '';
    this.versionAction = new Action({
      text: `v${pkg.version}${sinequaVersion}`,
      styles: 'version-menu',
      scrollable: true,
      disabled: true
    });

    this.customActions = [this.versionAction];
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.enableSettings) {
      this.customActions = this.enableSettings ? [this.versionAction, this.settingsViewAction] : [this.versionAction];
    }
  }

  get name(): string {
    return !this.principalService.principal ? ''
      : this.principalService.principal['fullName'] as string || this.principalService.principal.name;
  }

}
