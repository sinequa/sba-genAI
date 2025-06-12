import { Injectable, inject } from '@angular/core';
import { NotificationType } from '@sinequa/assistant/chat';
import { NotificationsService } from '@sinequa/core/notification';

@Injectable({
  providedIn: 'root'
})
export class NotificationsListenerService {
  private notificationsService = inject(NotificationsService);

  constructor() {
    addEventListener('notification', (event: Event) =>{
      const customEvent = event as CustomEvent<{
        type: NotificationType;
        title?: string;
        message: string;
      }>;

      const { type, message } = customEvent.detail;

      this.notificationsService[type](message);
    });
  }
}
