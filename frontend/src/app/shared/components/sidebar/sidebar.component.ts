import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="sidebar" [class.open]="isOpen">
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
            <li class="nav-item active">
              <a routerLink="/" class="nav-link" (click)="closeSidebar.emit()">Library</a>
            </li>
            <li class="nav-item">
              <a class="nav-link">Guide</a>
            </li>
            <li class="nav-item">
              <a class="nav-link">Podcast</a>
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
        <span class="footer-label">FOLLOW US</span>
        <ul class="footer-links">
          <li><a href="#">Website</a></li>
          <li><a href="#">Facebook</a></li>
          <li><a href="#">Youtube</a></li>
        </ul>
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
      padding: 16px 24px 24px;
      border-top: 1px solid var(--border-light);
      margin-top: auto;
    }

    .footer-label {
      display: block;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.2px;
      color: var(--text-muted);
      margin-bottom: 12px;
    }

    .footer-links {
      li {
        margin-bottom: 8px;
      }

      a {
        font-size: 13px;
        color: var(--text-secondary);
        transition: color 0.2s;

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
  @Output() closeSidebar = new EventEmitter<void>();
  coursesExpanded = false;
}
