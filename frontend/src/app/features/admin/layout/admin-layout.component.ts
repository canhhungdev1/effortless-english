import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { ToastComponent } from '../../../shared/components/toast/toast.component';


@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ToastComponent],
  template: `
    <div class="admin-container" [class.collapsed]="isSidebarCollapsed()">
      <app-toast></app-toast>
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo">
            <span class="logo-icon">⚡</span>
            <span class="logo-text" *ngIf="!isSidebarCollapsed()">Admin Panel</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/admin/dashboard" routerLinkActive="active" class="nav-item">
            <span class="icon" title="Dashboard">📊</span>
            <span class="label" *ngIf="!isSidebarCollapsed()">Dashboard</span>
          </a>
          <a routerLink="/admin/courses" routerLinkActive="active" class="nav-item">
            <span class="icon" title="Manage Courses">📚</span>
            <span class="label" *ngIf="!isSidebarCollapsed()">Manage Courses</span>
          </a>
          <a routerLink="/admin/vtt-creator" routerLinkActive="active" class="nav-item">
            <span class="icon" title="VTT Creator">🎞️</span>
            <span class="label" *ngIf="!isSidebarCollapsed()">VTT Creator</span>
          </a>
          <div class="nav-divider"></div>
          <a routerLink="/" class="nav-item back-home">
            <span class="icon" title="Back to Site">🏠</span>
            <span class="label" *ngIf="!isSidebarCollapsed()">Back to Site</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="user-info">
            <div class="avatar">AD</div>
            <div class="details" *ngIf="!isSidebarCollapsed()">
              <span class="name">Administrator</span>
              <span class="role">Project Owner</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <header class="top-bar">
          <div class="top-bar-left">
            <button class="toggle-btn" (click)="toggleSidebar()">
              <span class="icon">{{ isSidebarCollapsed() ? '➡️' : '⬅️' }}</span>
            </button>
            <h2 class="page-title">Admin Dashboard</h2>
          </div>
          <div class="top-actions">
            <button class="action-btn notification">
              <span class="icon">🔔</span>
            </button>
            <button class="action-btn logout">
              <span class="icon">🔒</span>
              Logout
            </button>
          </div>
        </header>

        <div class="content-wrapper">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>

  `,
  styles: [`
    .admin-container {
      display: flex;
      min-height: 100vh;
      background: #f8fafc;
    }

    /* Sidebar */
    .sidebar {
      width: 260px;
      background: #1e293b;
      color: white;
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow-y: auto;
      z-index: 100;
      scrollbar-width: none;
      &::-webkit-scrollbar { display: none; }
    }

    .admin-container.collapsed .sidebar {
      width: 80px;
    }


    .sidebar-header {
      padding: 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-icon {
      font-size: 24px;
      background: var(--primary);
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
    }

    .logo-text {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .sidebar-nav {
      flex: 1;
      padding: 24px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      color: #94a3b8;
      text-decoration: none;
      border-radius: 8px;
      transition: all 0.2s ease;
      font-weight: 500;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.05);
      color: white;
    }

    .nav-item.active {
      background: var(--primary);
      color: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .nav-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
      margin: 16px 0;
    }

    .back-home {
      margin-top: auto;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .sidebar-footer {
      padding: 20px;
      background: rgba(0, 0, 0, 0.2);
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar {
      width: 40px;
      height: 40px;
      background: #475569;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
    }

    .details {
      display: flex;
      flex-direction: column;
    }

    .name {
      font-size: 14px;
      font-weight: 600;
    }

    .role {
      font-size: 12px;
      color: #94a3b8;
    }

    /* Main Content */
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      margin-left: 260px;
      transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      min-width: 0;
    }

    .admin-container.collapsed .main-content {
      margin-left: 80px;
    }

    .top-bar {
      height: 70px;
      background: white;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 32px;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .top-bar-left {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .toggle-btn {
      width: 36px;
      height: 36px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
      &:hover { background: #f1f5f9; border-color: #cbd5e1; }
    }


    .page-title {
      font-size: 20px;
      font-weight: 700;
      color: #1e293b;
    }

    .top-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .action-btn {
      height: 40px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 16px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      background: white;
      color: #475569;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }

    .notification {
      padding: 0;
      width: 40px;
      justify-content: center;
    }

    .content-wrapper {
      padding: 32px;
      max-width: 1400px;
      width: 100%;
      margin: 0 auto;
    }
  `]
})
export class AdminLayoutComponent {
  isSidebarCollapsed = signal(false);

  toggleSidebar() {
    this.isSidebarCollapsed.update(v => !v);
  }
}

