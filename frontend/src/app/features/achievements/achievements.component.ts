import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamificationService, Badge } from '../../core/services/gamification.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-achievements',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="achievements-container">
      <header class="achievements-header">
        <div class="header-left">
          <h1 class="page-title">Achievements</h1>
          <p class="subtitle">Complete challenges to earn unique badges and rewards</p>
        </div>
        <div class="progress-summary" *ngIf="isLoggedIn()">
           <div class="summary-item">
             <span class="summary-value">{{ earnedCount() }}/{{ badges().length }}</span>
             <span class="summary-label">Badges Collected</span>
           </div>
        </div>
      </header>

      <div class="badges-grid" *ngIf="isLoggedIn()">
        <div class="badge-card" *ngFor="let badge of badges()" [class.locked]="!badge.isEarned">
          <div class="badge-icon-wrapper">
             <div class="badge-icon">{{ getPlaceholderIcon(badge.code) }}</div>
             <div class="earned-overlay" *ngIf="badge.isEarned">✓</div>
          </div>
          <div class="badge-info">
            <h3 class="badge-name">{{ badge.name }}</h3>
            <p class="badge-desc">{{ badge.description }}</p>
            <div class="badge-date" *ngIf="badge.isEarned">Earned on {{ badge.earnedAt | date:'mediumDate' }}</div>
            <div class="badge-progress" *ngIf="!badge.isEarned">
               <div class="progress-bar-bg">
                 <div class="progress-bar-fill" [style.width.%]="40"></div>
               </div>
               <span class="progress-text">In Progress</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Guest State -->
      <div class="empty-state glass-card" *ngIf="!isLoggedIn()">
        <div class="empty-icon">🎖️</div>
        <h2>Join the Hall of Fame</h2>
        <p>Log in to participate in periodic challenges, track your badges, and compete with other English learners worldwide.</p>
        <button class="cta-btn">Get Started</button>
      </div>
    </div>
  `,
  styles: [`
    .achievements-container { padding: 8px 0 60px; }
    .achievements-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; }
    .page-title { font-size: 32px; font-weight: 850; color: var(--text-primary); margin: 0; }
    .subtitle { font-size: 16px; color: var(--text-muted); margin: 8px 0 0; }
    
    .progress-summary { background: white; border: 1.5px solid var(--border-light); padding: 12px 24px; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .summary-item { display: flex; flex-direction: column; align-items: center; }
    .summary-value { font-size: 20px; font-weight: 850; color: var(--primary); }
    .summary-label { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }

    .badges-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
    .badge-card {
      background: white; border: 1px solid var(--border-light); border-radius: 24px; padding: 24px;
      display: flex; gap: 20px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative; overflow: hidden;
      
      &:not(.locked):hover {
        transform: translateY(-5px);
        box-shadow: 0 20px 25px -5px rgba(0,0,0,0.08);
        border-color: var(--primary-light);
      }
      
      &.locked {
        background: #f8fafc;
        .badge-icon-wrapper { filter: grayscale(1); opacity: 0.5; }
        .badge-name { color: #64748b; }
      }
    }

    .badge-icon-wrapper {
      width: 80px; height: 80px; flex-shrink: 0; background: var(--bg-gray); border-radius: 20px;
      display: flex; align-items: center; justify-content: center; position: relative;
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
    }
    .badge-icon { font-size: 40px; }
    .earned-overlay {
      position: absolute; bottom: -5px; right: -5px; width: 24px; height: 24px; background: #22c55e;
      color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 850; border: 3px solid white;
    }

    .badge-info { flex: 1; display: flex; flex-direction: column; justify-content: center; }
    .badge-name { font-size: 17px; font-weight: 800; margin: 0 0 6px; color: var(--text-primary); }
    .badge-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0 0 12px; }
    .badge-date { font-size: 11px; font-weight: 600; color: #16a34a; }
    
    .badge-progress { display: flex; flex-direction: column; gap: 6px; }
    .progress-bar-bg { height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
    .progress-bar-fill { height: 100%; background: #94a3b8; border-radius: 3px; }
    .progress-text { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }

    .glass-card { background: white; border: 1px solid var(--border-light); border-radius: 24px; padding: 60px 40px; text-align: center; display: flex; flex-direction: column; align-items: center; }
    .empty-icon { font-size: 64px; margin-bottom: 24px; }
    .empty-state h2 { font-size: 24px; font-weight: 850; margin-bottom: 12px; }
    .empty-state p { font-size: 16px; color: var(--text-muted); max-width: 400px; line-height: 1.6; margin-bottom: 32px; }
    .cta-btn { background: var(--primary); color: white; border: none; padding: 14px 32px; border-radius: 14px; font-weight: 700; cursor: pointer; transition: transform 0.2s; &:hover { transform: scale(1.05); } }
  `]
})
export class AchievementsComponent implements OnInit {
  private gamificationService = inject(GamificationService);
  private authService = inject(AuthService);

  badges = signal<Badge[]>([]);
  isLoggedIn = signal(false);
  earnedCount = signal(0);

  ngOnInit() {
    this.isLoggedIn.set(this.authService.isLoggedIn());
    if (this.isLoggedIn()) {
      this.loadBadges();
    }
  }

  loadBadges() {
    this.gamificationService.getBadges().subscribe(badges => {
      this.badges.set(badges);
      this.earnedCount.set(badges.filter(b => b.isEarned).length);
    });
  }

  getPlaceholderIcon(code: string): string {
    if (code.includes('STREAK')) return '🔥';
    if (code.includes('TIME')) return '🎧';
    if (code.includes('VOCAB')) return '🔤';
    return '🎖️';
  }
}
