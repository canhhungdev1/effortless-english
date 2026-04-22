import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" *ngIf="notification.toast$ | async as toast">
      <div class="toast" [class]="toast.type">
        <div class="toast-icon">
          <ng-container [ngSwitch]="toast.type">
            <span *ngSwitchCase="'success'">✅</span>
            <span *ngSwitchCase="'error'">❌</span>
            <span *ngSwitchCase="'warning'">⚠️</span>
            <span *ngSwitchCase="'info'">ℹ️</span>
          </ng-container>
        </div>
        <div class="toast-content">
          <p class="toast-message">{{ toast.message }}</p>
        </div>
        <button class="toast-close" (click)="close()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed; top: 32px; right: 32px; z-index: 10000;
      pointer-events: none; perspective: 1000px;
    }

    .toast {
      display: flex; align-items: center; gap: 16px; min-width: 320px; max-width: 450px;
      padding: 16px 20px; border-radius: 20px; pointer-events: auto;
      background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px);
      box-shadow: 0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05);
      animation: toastIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
      border-left: 6px solid #cbd5e1;
    }

    .toast.success { border-left-color: #10b981; }
    .toast.error { border-left-color: #ef4444; }
    .toast.warning { border-left-color: #f59e0b; }
    .toast.info { border-left-color: #3b82f6; }

    .toast-icon { font-size: 20px; flex-shrink: 0; }
    .toast-content { flex: 1; }
    .toast-message { font-size: 14px; font-weight: 700; color: #1e293b; margin: 0; line-height: 1.4; }

    .toast-close {
      background: #f1f5f9; border: none; color: #64748b; width: 24px; height: 24px;
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.2s;
      &:hover { background: #e2e8f0; color: #1e293b; transform: scale(1.1); }
    }

    @keyframes toastIn {
      from { transform: translateX(100%) scale(0.8) rotateY(-10deg); opacity: 0; }
      to { transform: translateX(0) scale(1) rotateY(0); opacity: 1; }
    }
  `]
})
export class ToastComponent {
  notification = inject(NotificationService);

  close() {
    (this.notification as any).toastSubject.next(null);
  }
}
