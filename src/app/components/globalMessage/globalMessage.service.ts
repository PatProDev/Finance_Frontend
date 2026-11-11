import { Injectable, signal } from '@angular/core';

export type GlobalMessageType = 'success' | 'error';

export interface GlobalMessage {
  text: string;
  type: GlobalMessageType;
}

@Injectable({ providedIn: 'root' })
export class GlobalMessageService {
  readonly message = signal<GlobalMessage | null>(null);
  private dismissTimer?: ReturnType<typeof setTimeout>;

  show(text: string, type: GlobalMessageType = 'success', duration = 4000): void {
    this.dismiss();
    this.message.set({ text, type });
    this.dismissTimer = setTimeout(() => this.dismiss(), duration);
  }

  dismiss(): void {
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = undefined;
    }

    this.message.set(null);
  }
}
