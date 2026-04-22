import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="notification.confirm$ | async as request" (click)="onCancel(request)">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-icon" [class]="request.options.type || 'info'">
          <span *ngIf="request.options.type === 'danger'">⚠️</span>
          <span *ngIf="request.options.type !== 'danger'">❓</span>
        </div>
        
        <h3 class="modal-title">{{ request.options.title }}</h3>
        <p class="modal-message">{{ request.options.message }}</p>
        
        <div class="modal-actions">
          <button class="btn-cancel" (click)="onCancel(request)">
            {{ request.options.cancelText || 'Cancel' }}
          </button>
          <button 
            class="btn-confirm" 
            [class]="request.options.type || 'info'"
            (click)="onConfirm(request)"
          >
            {{ request.options.confirmText || 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(8px); z-index: 11000;
      display: flex; align-items: center; justify-content: center;
      padding: 20px; animation: fadeIn 0.3s ease;
    }

    .modal-content {
      background: white; border-radius: 32px; padding: 40px;
      width: 100%; max-width: 400px; text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      animation: modalIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .modal-icon {
      width: 64px; height: 64px; border-radius: 20px; margin: 0 auto 24px;
      display: flex; align-items: center; justify-content: center; font-size: 32px;
      &.danger { background: #fef2f2; color: #ef4444; }
      &.info { background: #eff6ff; color: #3b82f6; }
      &.warning { background: #fffbeb; color: #f59e0b; }
    }

    .modal-title { font-size: 24px; font-weight: 850; color: #1e293b; margin-bottom: 12px; }
    .modal-message { font-size: 16px; color: #64748b; line-height: 1.6; margin-bottom: 32px; }

    .modal-actions { display: grid; grid-template-columns: 1fr 1.2fr; gap: 12px; }
    
    button {
      padding: 14px; border-radius: 16px; font-size: 15px; font-weight: 800;
      cursor: pointer; transition: all 0.2s; border: none;
    }

    .btn-cancel { background: #f1f5f9; color: #64748b; &:hover { background: #e2e8f0; } }
    
    .btn-confirm {
      color: white;
      &.danger { background: #ef4444; box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3); &:hover { background: #dc2626; } }
      &.info { background: #3b82f6; box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3); &:hover { background: #2563eb; } }
      &.warning { background: #f59e0b; box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3); &:hover { background: #d97706; } }
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes modalIn {
      from { transform: scale(0.8) translateY(20px); opacity: 0; }
      to { transform: scale(1) translateY(0); opacity: 1; }
    }
  `]
})
export class ConfirmModalComponent {
  notification = inject(NotificationService);

  onConfirm(request: any) {
    this.notification.closeConfirm(true, request.resolve);
  }

  onCancel(request: any) {
    this.notification.closeConfirm(false, request.resolve);
  }
}
