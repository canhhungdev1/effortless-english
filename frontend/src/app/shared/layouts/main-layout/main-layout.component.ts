import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/header/header.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, CommonModule],
  template: `
    <div class="layout" [class.desktop-collapsed]="isDesktopCollapsed">
      <div class="sidebar-overlay"
           [class.visible]="isMobileOpen"
           (click)="closeMobileSidebar()"></div>
      <app-sidebar 
           [isOpen]="isMobileOpen" 
           [isDesktopCollapsed]="isDesktopCollapsed"
           (closeSidebar)="closeMobileSidebar()" />
      <div class="layout-main">
        <app-header (toggleSidebar)="toggleSidebar()" />
        <main class="layout-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .layout {
      display: flex;
      min-height: 100vh;
      overflow-x: hidden;
      width: 100%;
      max-width: 100vw;
    }

    .layout-main {
      flex: 1;
      margin-left: var(--sidebar-width);
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
      min-width: 0;
      transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .layout.desktop-collapsed .layout-main {
      margin-left: 0;
    }

    .layout-content {
      flex: 1;
      padding: 0 32px 40px;
      overflow-x: hidden;
    }

    .sidebar-overlay {
      display: none;
    }

    @media (max-width: 1024px) {
      .layout-main {
        margin-left: 0;
      }

      .layout-content {
        padding: 0 20px 32px;
      }

      .sidebar-overlay {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        z-index: 99;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;

        &.visible {
          opacity: 1;
          visibility: visible;
        }
      }
    }

    @media (max-width: 480px) {
      .layout-content {
        padding: 0 16px 24px;
      }
    }
  `]
})
export class MainLayoutComponent {
  isMobileOpen = false;
  isDesktopCollapsed = false;

  toggleSidebar() {
    if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
      this.isMobileOpen = !this.isMobileOpen;
    } else {
      this.isDesktopCollapsed = !this.isDesktopCollapsed;
    }
  }

  closeMobileSidebar() {
    this.isMobileOpen = false;
  }
}
