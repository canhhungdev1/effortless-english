import { Injectable } from '@angular/core';
import { BehaviorSubject, delay, of, tap } from 'rxjs';

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private toastSubject = new BehaviorSubject<Toast | null>(null);
  toast$ = this.toastSubject.asObservable();

  show(message: string, type: 'success' | 'error' | 'info' = 'success') {
    this.toastSubject.next({ message, type });
    
    // Auto hide after 3 seconds
    of(null).pipe(
      delay(3000),
      tap(() => this.toastSubject.next(null))
    ).subscribe();
  }
}
