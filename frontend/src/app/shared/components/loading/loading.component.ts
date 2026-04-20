import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-overlay" *ngIf="loadingService.loading()">
      <div class="glass-card">
        <div class="modern-loader">
          <div class="liquid-dot"></div>
          <div class="liquid-dot"></div>
          <div class="liquid-dot"></div>
          <div class="liquid-dot"></div>
        </div>
        <div class="loading-text">
          <span>L</span><span>o</span><span>a</span><span>d</span><span>i</span><span>n</span><span>g</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      inset: 0;
      background: rgba(255, 255, 255, 0.4);
      backdrop-filter: blur(12px) saturate(180%);
      -webkit-backdrop-filter: blur(12px) saturate(180%);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.7);
      padding: 40px 60px;
      border-radius: 32px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
    }

    .modern-loader {
      display: flex;
      gap: 12px;
      filter: url('#gooey');
    }

    .liquid-dot {
      width: 16px;
      height: 16px;
      background: var(--primary, #3b82f6);
      border-radius: 50%;
      animation: liquid-move 2s infinite ease-in-out;
    }

    .liquid-dot:nth-child(2) { animation-delay: 0.2s; background: #60a5fa; }
    .liquid-dot:nth-child(3) { animation-delay: 0.4s; background: #93c5fd; }
    .liquid-dot:nth-child(4) { animation-delay: 0.6s; background: #bfdbfe; }

    .loading-text {
      display: flex;
      gap: 4px;
      font-weight: 800;
      color: var(--primary);
      font-size: 14px;
      letter-spacing: 4px;
      text-transform: uppercase;
      padding-left: 4px;
    }

    .loading-text span {
      animation: letter-glow 2s infinite;
    }

    .loading-text span:nth-child(2) { animation-delay: 0.1s; }
    .loading-text span:nth-child(3) { animation-delay: 0.2s; }
    .loading-text span:nth-child(4) { animation-delay: 0.3s; }
    .loading-text span:nth-child(5) { animation-delay: 0.4s; }
    .loading-text span:nth-child(6) { animation-delay: 0.5s; }
    .loading-text span:nth-child(7) { animation-delay: 0.6s; }

    @keyframes liquid-move {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-20px) scale(1.2); }
    }

    @keyframes letter-glow {
      0%, 100% { opacity: 0.3; filter: blur(1px); }
      50% { opacity: 1; filter: blur(0); text-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }
    }

    @keyframes fadeIn {
      from { opacity: 0; backdrop-filter: blur(0); }
      to { opacity: 1; backdrop-filter: blur(12px); }
    }
  `]
})
export class LoadingComponent {
  loadingService = inject(LoadingService);
}
