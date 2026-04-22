import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar" 
           [class.open]="isOpen" 
           [class.desktop-collapsed]="isDesktopCollapsed">
      <div class="sidebar-top">
        <div class="sidebar-logo">
          <div class="logo-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="var(--primary-light)"/>
              <path d="M8 22C8 22 10 18 16 18C22 18 24 22 24 22" stroke="var(--primary)" stroke-width="2" stroke-linecap="round"/>
              <circle cx="16" cy="12" r="4" fill="var(--primary)"/>
              <path d="M12 8C12 8 14 6 16 6C18 6 20 8 20 8" stroke="var(--primary)" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
        </div>

        <button class="close-btn" (click)="closeSidebar.emit()">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
          </svg>
        </button>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">
          <span class="nav-label">CATEGORY</span>
          <ul class="nav-list">
            <li class="nav-item" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
              <a routerLink="/" class="nav-link" (click)="closeSidebar.emit()">Library</a>
            </li>
            <li class="nav-item" routerLinkActive="active">
              <a routerLink="/flashcards" class="nav-link" (click)="closeSidebar.emit()">My Vocabulary</a>
            </li>
            <li class="nav-item" routerLinkActive="active">
              <a routerLink="/review" class="nav-link" (click)="closeSidebar.emit()">Smart Review</a>
            </li>
            <li class="nav-item">
              <a class="nav-link">Guide</a>
            </li>
            <li class="nav-item">
              <a class="nav-link">Support</a>
            </li>
          </ul>
        </div>

        <div class="nav-section">
          <span class="nav-label courses-label" (click)="coursesExpanded = !coursesExpanded">
            COURSES
            <svg [class.rotated]="coursesExpanded" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M3 4.5L6 7.5L9 4.5"/>
            </svg>
          </span>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="auth-section" *ngIf="auth.currentUser$ | async as user; else loginTpl">
          <div class="user-info">
            <div class="user-avatar-initial">
              {{ user.name.charAt(0).toUpperCase() }}
            </div>
            <div class="user-details">
              <span class="user-name">{{ user.name }}</span>
              <span class="user-email">{{ user.email }}</span>
            </div>
          </div>
          <button class="auth-btn logout" (click)="auth.logout()">
            <span>Logout</span>
          </button>
        </div>
        <ng-template #loginTpl>
          <a routerLink="/login" class="auth-btn login" (click)="closeSidebar.emit()">
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184L12.048 13.558c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.707a5.41 5.41 0 01-.282-1.707c0-.595.102-1.17.282-1.707V4.96H.957a8.996 8.996 0 000 8.08l3.007-2.333z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            <span>Login to Study</span>
          </a>
        </ng-template>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-width);
      height: 100vh;
      position: fixed;
      top: 0;
      left: 0;
      background: var(--bg-white);
      border-right: 1px solid var(--border-light);
      display: flex;
      flex-direction: column;
      z-index: 100;
      overflow-y: auto;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .sidebar.desktop-collapsed {
      transform: translateX(-100%);
    }

    .sidebar-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .sidebar-logo {
      padding: 20px 24px;
    }

    .logo-icon {
      width: 36px;
      height: 36px;
    }

    .close-btn {
      display: none;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      margin-right: 16px;
      transition: var(--transition);

      &:hover {
        background: var(--bg-gray);
        color: var(--text-primary);
      }
    }

    .sidebar-nav {
      flex: 1;
      padding: 0 0 16px 0;
    }

    .nav-section {
      margin-bottom: 8px;
    }

    .nav-label {
      display: block;
      padding: 8px 24px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.2px;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .courses-label {
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      user-select: none;

      svg {
        transition: transform 0.2s;

        &.rotated {
          transform: rotate(180deg);
        }
      }
    }

    .nav-list {
      padding: 4px 16px;
    }

    .nav-item {
      margin-bottom: 2px;

      .nav-link {
        display: block;
        padding: 10px 16px;
        border-radius: var(--radius-xl);
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary);
        cursor: pointer;
        transition: var(--transition);

        &:hover {
          background: var(--bg-gray);
        }
      }

      &.active .nav-link {
        background: var(--primary);
        color: white;
        font-weight: 600;
      }
    }

    .sidebar-footer {
      padding: 16px 20px 24px;
      border-top: 1px solid var(--border-light);
      margin-top: auto;
    }

    .auth-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;
      background: var(--bg-gray);
      border-radius: var(--radius-md);
    }

    .user-avatar-initial {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .user-name {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-email {
      font-size: 11px;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .auth-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 10px;
      border-radius: var(--radius-md);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
      border: 1px solid var(--border-color);
      
      &.login {
        background: white;
        color: var(--text-primary);
        &:hover {
          background: var(--bg-gray);
          transform: translateY(-1px);
        }
      }

      &.logout {
        background: transparent;
        color: var(--text-muted);
        border-color: transparent;
        font-size: 13px;
        padding: 4px;
        &:hover {
          color: var(--primary);
        }
      }
    }

    /* Mobile: sidebar slides in/out */
    @media (max-width: 1024px) {
      .sidebar {
        transform: translateX(-100%);
        box-shadow: none;

        &.open {
          transform: translateX(0);
          box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
        }
      }

      .close-btn {
        display: flex;
      }
    }
  `]
})
export class SidebarComponent {
  @Input() isOpen = false;
  @Input() isDesktopCollapsed = false;
  @Output() closeSidebar = new EventEmitter<void>();
  
  public auth = inject(AuthService);
  coursesExpanded = false;
}
