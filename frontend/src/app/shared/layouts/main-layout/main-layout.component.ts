import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/header/header.component';
import { ToastComponent } from '../../components/toast/toast.component';
import { CommonModule } from '@angular/common';
import { LoadingComponent } from '../../components/loading/loading.component';
import { ConfirmModalComponent } from '../../components/confirm-modal/confirm-modal.component';
import { GamificationService } from '../../../core/services/gamification.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Subscription } from 'rxjs';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, ToastComponent, CommonModule, LoadingComponent, ConfirmModalComponent],
  template: `
    <div class="layout" [class.desktop-collapsed]="isDesktopCollapsed">
      <app-toast />
      <app-confirm-modal />
      <app-loading />
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
export class MainLayoutComponent implements OnInit, OnDestroy {
  isMobileOpen = false;
  isDesktopCollapsed = false;

  private gamification = inject(GamificationService);
  private notification = inject(NotificationService);
  private badgeSub?: Subscription;

  ngOnInit() {
    this.badgeSub = this.gamification.newBadge$.subscribe((badge) => {
      this.celebrateEarnedBadge(badge);
    });
  }

  ngOnDestroy() {
    this.badgeSub?.unsubscribe();
  }

  private celebrateEarnedBadge(badge: any) {
    if (typeof window === 'undefined') return;

    // Show Notification
    this.notification.show(
      `🏆 NEW ACHIEVEMENT: ${badge.name}! Check your profile.`,
      'success'
    );

    // Fire Confetti!
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#4f46e5', '#818cf8', '#22c55e']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#4f46e5', '#818cf8', '#22c55e']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }

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
