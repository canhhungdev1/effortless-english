import { Component, Output, EventEmitter, inject } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
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

        <ng-container *ngIf="authService.userSignal() as user; else loginBtn">
          <div class="user-menu" (click)="toggleDropdown()">
            <div class="avatar">
              <div class="avatar-img">
                <span class="avatar-initial">{{ (user.name || user.email || 'U').charAt(0).toUpperCase() }}</span>
              </div>
            </div>
            <div class="dropdown-menu" *ngIf="showDropdown">
              <div class="dropdown-header">
                <strong>{{ user.name }}</strong>
                <span>{{ user.email }}</span>
              </div>
              <div class="dropdown-divider"></div>
              <a *ngIf="user.role === 'ADMIN'" routerLink="/admin" class="dropdown-item">
                Admin Panel
              </a>
              <button class="dropdown-item" (click)="logout()">
                Log out
              </button>
            </div>
          </div>
        </ng-container>
        
        <ng-template #loginBtn>
          <a routerLink="/login" class="login-btn">Log In</a>
        </ng-template>
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
      background: var(--bg-gray);
      color: var(--primary);
      font-weight: bold;
      font-size: 16px;
    }

    .user-menu {
      position: relative;
      cursor: pointer;
    }

    .dropdown-menu {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      background: var(--bg-white);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      width: 200px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .dropdown-header {
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      background: var(--bg-gray);

      strong {
        font-size: 14px;
        color: var(--text-primary);
      }

      span {
        font-size: 12px;
        color: var(--text-muted);
      }
    }

    .dropdown-divider {
      height: 1px;
      background: var(--border-color);
    }

    .dropdown-item {
      padding: 12px 16px;
      text-align: left;
      background: transparent;
      border: none;
      font-size: 14px;
      color: var(--text-primary);
      cursor: pointer;
      text-decoration: none;
      transition: background 0.2s;

      &:hover {
        background: var(--bg-gray);
        color: var(--primary);
      }
    }

    .login-btn {
      padding: 8px 16px;
      background: var(--primary);
      color: white;
      border-radius: var(--radius-md);
      font-weight: 500;
      text-decoration: none;
      font-size: 14px;
      transition: background 0.2s;

      &:hover {
        background: var(--primary-dark);
      }
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
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  showDropdown = false;

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  logout() {
    this.authService.logout();
    this.showDropdown = false;
  }
}
