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
        <span class="icon">
          <svg *ngIf="toast.type === 'success'" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <svg *ngIf="toast.type === 'error'" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </span>
        <span class="message">{{ toast.message }}</span>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 9999;
      pointer-events: none;
      animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      background: var(--bg-white);
      border-radius: var(--radius-lg);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      border: 1px solid var(--border-light);
      pointer-events: auto;
    }

    .toast.success { border-left: 4px solid #10b981; color: #065f46; }
    .toast.error { border-left: 4px solid #ef4444; color: #991b1b; }
    .toast.info { border-left: 4px solid var(--primary); color: var(--primary); }

    .icon { display: flex; align-items: center; justify-content: center; }
    .message { font-size: 14px; font-weight: 500; }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastComponent {
  notification = inject(NotificationService);
}
