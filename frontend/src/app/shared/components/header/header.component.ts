import { Component, Output, EventEmitter } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="header">
      <div class="header-left">
        <button class="hamburger-btn" (click)="toggleSidebar.emit()">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor">
            <rect x="3" y="5" width="16" height="2" rx="1"/>
            <rect x="3" y="10" width="16" height="2" rx="1"/>
            <rect x="3" y="15" width="16" height="2" rx="1"/>
          </svg>
        </button>

        <div class="header-search">
          <div class="search-box">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="#9ca3af" stroke-width="1.5"/>
              <path d="M11 11L14 14" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <input type="text" placeholder="Search for courses..." class="search-input" />
          </div>
        </div>
      </div>

      <div class="header-actions">
        <button class="theme-toggle" (click)="themeService.toggleTheme()">
          <span *ngIf="!themeService.darkMode">🌙</span>
          <span *ngIf="themeService.darkMode">☀️</span>
        </button>
        <button class="notification-btn">
          <span class="notification-dot">🔔</span>
        </button>
        <div class="avatar">
          <div class="avatar-img">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="16" fill="var(--bg-gray)"/>
              <circle cx="16" cy="13" r="5" fill="var(--text-muted)"/>
              <path d="M6 28C6 22 10 19 16 19C22 19 26 22 26 28" fill="var(--text-muted)"/>
            </svg>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      height: var(--header-height);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 32px;
      background: var(--bg-white);
      gap: 16px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
      min-width: 0;
    }

    .hamburger-btn {
      display: flex;
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      align-items: center;
      justify-content: center;
      color: var(--text-primary);
      flex-shrink: 0;
      transition: var(--transition);
      cursor: pointer;
      background: transparent;
      border: none;

      &:hover {
        background: var(--bg-gray);
      }
    }

    .header-search {
      flex: 0 1 400px;
      min-width: 0;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 18px;
      border: 1.5px solid var(--border-color);
      border-radius: var(--radius-xl);
      background: var(--bg-white);
      transition: var(--transition);

      &:focus-within {
        border-color: var(--primary);
        box-shadow: 0 0 0 3px var(--primary-light);
      }
    }

    .search-input {
      flex: 1;
      font-size: 14px;
      color: var(--text-primary);
      background: transparent;
      min-width: 0;

      &::placeholder {
        color: var(--text-muted);
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-shrink: 0;
    }

    .theme-toggle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--bg-gray);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      transition: var(--transition);

      &:hover {
        background: var(--border-color);
        transform: rotate(15deg);
      }
    }

    .notification-btn {
      font-size: 20px;
      padding: 4px;
      transition: transform 0.2s;

      &:hover {
        transform: scale(1.1);
      }
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      overflow: hidden;
      border: 2px solid var(--border-color);
      cursor: pointer;
      transition: border-color 0.2s;

      &:hover {
        border-color: var(--primary);
      }
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    @media (max-width: 1024px) {
      .header {
        padding: 0 20px;
      }
    }

    @media (max-width: 480px) {
      .header {
        padding: 0 16px;
      }

      .header-search {
        flex: 1 1 auto;
      }

      .search-box {
        padding: 8px 14px;
      }

      .search-input {
        font-size: 13px;
      }

      .notification-btn {
        display: none;
      }

      .header-actions {
        gap: 10px;
      }
    }
  `]
})
export class HeaderComponent {
  @Output() toggleSidebar = new EventEmitter<void>();
  constructor(public themeService: ThemeService) {}
}
