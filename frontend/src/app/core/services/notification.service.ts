import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, delay, of, tap } from 'rxjs';

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info' | 'warning';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private toastSubject = new BehaviorSubject<Toast | null>(null);
  toast$ = this.toastSubject.asObservable();

  private confirmSubject = new Subject<{ options: ConfirmOptions, resolve: (result: boolean) => void } | null>();
  confirm$ = this.confirmSubject.asObservable();

  show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') {
    this.toastSubject.next({ message, type });
    
    // Auto hide after 3 seconds
    of(null).pipe(
      delay(3000),
      tap(() => this.toastSubject.next(null))
    ).subscribe();
  }

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise(resolve => {
      this.confirmSubject.next({ options, resolve });
    });
  }

  closeConfirm(result: boolean, resolver: (result: boolean) => void) {
    this.confirmSubject.next(null);
    resolver(result);
  }
}
