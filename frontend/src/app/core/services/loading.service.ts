import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private activeRequests = signal(0);
  
  // Public signal for components to consume
  loading = signal(false);

  show() {
    this.activeRequests.update(v => v + 1);
    this.loading.set(true);
  }

  hide() {
    this.activeRequests.update(v => {
      const newVal = Math.max(0, v - 1);
      if (newVal === 0) {
        this.loading.set(false);
      }
      return newVal;
    });
  }
}
