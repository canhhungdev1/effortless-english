import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { VocabularyService } from '../../core/services/vocabulary.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/auth/auth.service';
import { FlashcardSessionComponent } from '../../shared/components/flashcards/flashcard-session.component';
import { HeatmapComponent } from '../../shared/components/heatmap/heatmap.component';
import { map, distinctUntilChanged, take } from 'rxjs';

@Component({
  selector: 'app-smart-review',
  standalone: true,
  imports: [CommonModule, RouterLink, FlashcardSessionComponent, HeatmapComponent],
  template: `
    <div class="review-container fade-in" [class.is-loading]="!stats">
      <div class="header-section">
        <div class="header-content">
          <h1 class="title">Smart Review Vocabulary</h1>
          <p class="subtitle">Optimize your memory using Spaced Repetition (SRS).</p>
        </div>
        <div class="header-actions">
          <!-- Streak Badge -->
          <div class="streak-badge" *ngIf="studyStats?.streak > 0" title="Daily Streak">
             <span class="streak-icon">🔥</span>
             <span class="streak-count">{{ studyStats.streak }}</span>
             <span class="streak-label">Days</span>
           </div>

          <button class="secondary-btn manage-btn" routerLink="/flashcards">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
            </svg>
            Manage Vocabulary
          </button>
          
          <button class="icon-btn refresh-btn" (click)="syncData()" [title]="'Refresh Data'" [class.spinning]="!stats">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Loading Overlay -->
      <div class="loading-overlay" *ngIf="!stats">
        <div class="loader"></div>
        <p>Connecting to your personal collection...</p>
      </div>

      <!-- Stats Dashboard -->
      <div class="stats-bar" *ngIf="stats">
        <div class="stat-item due clickable" (click)="goToVocabulary('due')" title="Click to view due words">
          <div class="stat-top">
            <div class="stat-icon-sm">🔥</div>
            <div class="stat-info">
              <span class="stat-num">{{ displayStats.dueCount }}</span>
              <span class="stat-label">Due Now</span>
            </div>
          </div>
          <div class="stat-progress">
            <div class="stat-progress-fill due-fill" [style.width.%]="stats.totalCount ? (displayStats.dueCount / stats.totalCount * 100) : 0"></div>
          </div>
          <div class="stat-meta">{{ stats.totalCount ? (displayStats.dueCount / stats.totalCount * 100 | number:'1.0-0') : 0 }}% needs review</div>
          
          <div class="premium-tooltip">
             <h4>Study Required</h4>
             <p>Words that have reached their review interval according to the SM-2 algorithm.</p>
          </div>
        </div>

        <div class="stat-divider"></div>

        <div class="stat-item total clickable" (click)="goToVocabulary('all')" title="Click to view all words">
          <div class="stat-top">
            <div class="stat-icon-sm">📚</div>
            <div class="stat-info">
              <span class="stat-num">{{ displayStats.totalCount }}</span>
              <span class="stat-label">Total</span>
            </div>
          </div>
          <div class="stat-progress">
            <div class="stat-progress-fill learning-fill" [style.width.%]="stats.totalCount ? ((displayStats.totalCount - displayStats.masteredCount) / stats.totalCount * 100) : 0"></div>
            <div class="stat-progress-fill mastered-fill" [style.width.%]="stats.totalCount ? (displayStats.masteredCount / stats.totalCount * 100) : 0"></div>
          </div>
          <div class="stat-meta">{{ displayStats.totalCount - displayStats.masteredCount }} learning · {{ displayStats.masteredCount }} mastered</div>
          
          <div class="premium-tooltip">
             <h4>Learning Progress</h4>
             <p>Your entire collection breakdown by mastery and review status.</p>
          </div>
        </div>

        <div class="stat-divider"></div>

        <div class="stat-item mastered clickable" (click)="goToVocabulary('learning')" title="Click to view learning words">
          <div class="stat-top">
            <div class="stat-icon-sm">🏆</div>
            <div class="stat-info">
              <span class="stat-num">{{ displayStats.masteredCount }}</span>
              <span class="stat-label">Mastered</span>
            </div>
          </div>
          <div class="stat-progress">
            <div class="stat-progress-fill mastered-fill" [style.width.%]="stats.totalCount ? (displayStats.masteredCount / stats.totalCount * 100) : 0"></div>
          </div>
          <div class="stat-meta">{{ stats.totalCount ? (displayStats.masteredCount / stats.totalCount * 100 | number:'1.0-0') : 0 }}% mastery rate</div>
          
          <div class="premium-tooltip">
             <h4>Knowledge Shield</h4>
             <p>Words with high ease factor and long intervals, considered learned for now.</p>
          </div>
        </div>
      </div>

      <div class="main-layout">
        <div class="action-panel">
          <div class="panel-header">
            <h2>Daily Review Session</h2>
            <p>We've prepared a customized list of words for you based on the SM-2 algorithm.</p>
          </div>
          
          <div class="action-box">
             <div class="due-info" *ngIf="stats.dueCount > 0; else nothingDue">
                <div class="count-big">{{ displayStats.dueCount }}</div>
                <div class="count-unit">Words waiting for you</div>
                <button class="primary-btn start-btn" (click)="startReview('due')">
                  Start Learning Now
                </button>
             </div>
             <ng-template #nothingDue>
                <div class="empty-sync">
                  <div class="empty-icon">✨</div>
                  <h3>You're brilliant!</h3>
                  <p>You have no words due for review right now. Come back later or start a practice session with all your words.</p>
                  <button class="secondary-btn" (click)="startReview('all')">
                    Practice All Words
                  </button>
                </div>
             </ng-template>
          </div>
        </div>

        <div class="forecast-panel">
          <h3>7-Day Workload Forecast</h3>
          <div class="forecast-chart">
            <div *ngFor="let item of stats.forecast" class="bar-group">
              <div class="bar-container">
                <div class="bar" [style.height.%]="getBarHeight(item.count)">
                  <span class="bar-tooltip">{{ item.count }} words</span>
                </div>
              </div>
              <span class="bar-label">{{ item.date | date:'EEE' }}</span>
            </div>
          </div>
          <div class="forecast-note">
             Estimated number of words that will become due by the end of each day.
          </div>
        </div>
      </div>

      <div class="heatmap-section" *ngIf="studyStats?.heatmap">
        <app-heatmap [data]="studyStats.heatmap" />
      </div>
    </div>

    <app-flashcard-session 
      *ngIf="showStudyModal" 
      [words]="studySessionWords" 
      (close)="onSessionClose()">
    </app-flashcard-session>
  `,
  styles: [`
    .review-container { max-width: 1100px; margin: 0 auto; padding: 40px 20px; }
    .header-section { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .header-actions { display: flex; align-items: center; gap: 12px; }
    
    .streak-badge {
      display: flex; align-items: center; gap: 8px; background: #fff7ed;
      padding: 8px 16px; border-radius: 100px; border: 1px solid #ffedd5;
      animation: streakPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      .streak-icon { font-size: 20px; }
      .streak-count { font-size: 18px; font-weight: 800; color: #9a3412; }
      .streak-label { font-size: 11px; font-weight: 700; color: #9a3412; text-transform: uppercase; margin-top: 2px; }
    }
    @keyframes streakPop { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }

    .manage-btn {
      display: flex; align-items: center; gap: 8px; padding: 10px 18px;
      background: white; border: 1px solid var(--border-color); border-radius: 12px;
      color: var(--text-primary); font-size: 14px; font-weight: 700;
      cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: var(--shadow-sm);
      svg { transition: transform 0.3s; }
      &:hover { background: #f8fafc; border-color: var(--primary-light); color: var(--primary); transform: translateY(-2px); box-shadow: var(--shadow-md); svg { transform: translateX(-2px); } }
    }

    .refresh-btn { 
      background: white; border: 1px solid var(--border-color); color: var(--text-muted);
      width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      &:hover { color: var(--primary); border-color: var(--primary-light); transform: rotate(30deg); box-shadow: var(--shadow-sm); }
      &.spinning svg { animation: spin 1s linear infinite; }
    }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    .title { font-size: 36px; font-weight: 850; letter-spacing: -1px; color: var(--text-primary); margin-bottom: 8px; }
    .subtitle { color: var(--text-muted); font-size: 18px; }

    .loading-overlay { height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; color: var(--text-muted); font-weight: 600; }
    .loader { width: 48px; height: 48px; border: 5px solid var(--bg-gray); border-bottom-color: var(--primary); border-radius: 50%; display: inline-block; animation: rotation 1s linear infinite; }
    @keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    .stats-bar { display: flex; align-items: stretch; background: white; border-radius: 20px; border: 1px solid var(--border-color); padding: 20px 0; margin-bottom: 32px; box-shadow: var(--shadow-sm); }
    .stat-item { flex: 1; padding: 0 28px; display: flex; flex-direction: column; gap: 10px; position: relative; &.clickable { cursor: pointer; transition: background 0.2s; border-radius: 12px; &:hover { background: #f8fafc; } } }
    .stat-top { display: flex; align-items: center; gap: 12px; }
    .stat-icon-sm { font-size: 22px; }
    .stat-info { display: flex; align-items: baseline; gap: 8px; }
    .stat-num { font-size: 28px; font-weight: 900; color: var(--text-primary); line-height: 1; }
    .stat-label { font-size: 13px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); }
    
    .stat-progress { height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden; display: flex; margin-top: 4px; }
    .stat-progress-fill { 
      height: 100%; border-radius: 3px; 
      transition: width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s ease; 
      box-shadow: 0 0 10px rgba(0,0,0,0.05);
    }
    .due-fill { background: linear-gradient(90deg, #ef4444, #f97316); }
    .learning-fill { background: linear-gradient(90deg, #3b82f6, #6366f1); }
    .mastered-fill { background: linear-gradient(90deg, #10b981, #34d399); }
    .stat-meta { font-size: 12px; color: #94a3b8; font-weight: 500; margin-top: 4px; }

    .premium-tooltip {
      position: absolute; bottom: calc(100% + 15px); left: 50%; transform: translateX(-50%) translateY(10px);
      width: 260px; background: #1e293b; color: white; padding: 16px; border-radius: 16px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2); opacity: 0; pointer-events: none;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); z-index: 100;
      &::after { content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border: 8px solid transparent; border-top-color: #1e293b; }
      h4 { font-size: 14px; font-weight: 800; margin-bottom: 6px; color: var(--primary-light); }
      p { font-size: 12px; color: #cbd5e1; margin: 0; }
    }
    .stat-item:hover .premium-tooltip { opacity: 1; transform: translateX(-50%) translateY(0); }
    .stat-divider { width: 1px; background: var(--border-color); margin: 4px 0; }

    .main-layout { display: grid; grid-template-columns: 1fr 340px; gap: 40px; }
    .action-panel { background: white; border-radius: 32px; border: 1px solid var(--border-color); padding: 40px; display: flex; flex-direction: column; gap: 32px; box-shadow: var(--shadow-sm); }
    .panel-header h2 { font-size: 24px; font-weight: 800; margin-bottom: 8px; }
    .action-box { flex: 1; min-height: 300px; background: #f8fafc; border-radius: 24px; border: 2px dashed #e2e8f0; display: flex; align-items: center; justify-content: center; text-align: center; }
    .count-big { font-size: 80px; font-weight: 900; color: var(--text-primary); line-height: 1; }
    .count-unit { font-size: 18px; font-weight: 600; color: var(--text-muted); margin-bottom: 32px; }
    .start-btn { padding: 20px 60px; font-size: 18px; font-weight: 800; border-radius: 20px; box-shadow: 0 10px 25px rgba(var(--primary-rgb), 0.3); }

    .forecast-panel { background: #f8fafc; border-radius: 32px; padding: 32px; border: 1px solid var(--border-color); }
    .forecast-panel h3 { font-size: 16px; font-weight: 800; margin-bottom: 24px; text-transform: uppercase; color: var(--text-muted); }
    .forecast-chart { display: flex; align-items: flex-end; justify-content: space-between; height: 160px; margin-bottom: 24px; }
    .bar-container { width: 12px; height: 120px; background: #e2e8f0; border-radius: 10px; position: relative; display: flex; align-items: flex-end; }
    .bar { width: 100%; background: linear-gradient(to top, var(--primary), #818cf8); border-radius: 10px; transition: height 1s cubic-bezier(0.34, 1.56, 0.64, 1); position: relative; &:hover { filter: brightness(1.1); .bar-tooltip { opacity: 1; transform: translateX(-50%) translateY(-10px); } } }
    .bar-tooltip { position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%) translateY(0); background: #1e293b; color: white; padding: 4px 8px; border-radius: 6px; font-size: 10px; opacity: 0; transition: all 0.2s; z-index: 10; }
    .forecast-note { font-size: 12px; color: #94a3b8; font-style: italic; }

    .heatmap-section { margin-top: 40px; animation: slideUp 0.6s ease-out; }
    @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    @media (max-width: 1024px) { .main-layout { grid-template-columns: 1fr; } }
  `]
})
export class SmartReviewComponent implements OnInit {
  public vocabService = inject(VocabularyService);
  private auth = inject(AuthService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  stats: any = null;
  displayStats = { dueCount: 0, totalCount: 0, masteredCount: 0, forecast: [] as any[] };
  showStudyModal = false;
  studySessionWords: any[] = [];
  studyStats: any = null;
  private animationTimer: any;

  ngOnInit() {
    this.vocabService.stats$.pipe(
      distinctUntilChanged((p, c) => !p || !c ? false : p.dueCount===c.dueCount && p.totalCount===c.totalCount)
    ).subscribe(s => { if (s) { this.stats = s; this.animateStats(s); } });
    this.vocabService.getStudyStats().subscribe(stats => { this.studyStats = stats; });
    this.syncData();
  }

  animateStats(target: any) {
    if (this.animationTimer) clearInterval(this.animationTimer);
    this.displayStats.dueCount = 0; this.displayStats.totalCount = 0; this.displayStats.masteredCount = 0;
    this.displayStats.forecast = target.forecast;
    this.cd.detectChanges();

    setTimeout(() => {
      const duration = 1200; const steps = 60; const interval = duration / steps;
      let currentStep = 0;
      this.animationTimer = setInterval(() => {
        currentStep++;
        const progress = this.easeOutQuad(currentStep / steps);
        this.displayStats.dueCount = Math.round((target.dueCount || 0) * progress);
        this.displayStats.totalCount = Math.round((target.totalCount || 0) * progress);
        this.displayStats.masteredCount = Math.round((target.masteredCount || 0) * progress);
        this.cd.detectChanges();
        if (currentStep >= steps) { clearInterval(this.animationTimer); this.displayStats = { ...target }; this.cd.detectChanges(); }
      }, interval);
    }, 100);
  }

  private easeOutQuad(t: number): number { return t * (2 - t); }
  goToVocabulary(filter: string) { this.router.navigate(['/flashcards'], { queryParams: { filter } }); }
  syncData() {
    this.vocabService.refreshVocabulary();
    this.vocabService.getStudyStats(true).subscribe(stats => { this.studyStats = stats; });
  }
  getBarHeight(count: number): number {
    if (!this.stats || this.stats.totalCount === 0) return 0;
    const max = Math.max(...this.stats.forecast.map((f: any) => f.count), 1);
    return (count / max) * 100;
  }
  startReview(mode: 'due' | 'all') {
    this.vocabService.vocab$.pipe(take(1), map(v => mode === 'due' ? v.filter(w => new Date(w.next_review) <= new Date()) : v)).subscribe(words => {
      if (words.length === 0) { this.notification.show('No words to practice!'); return; }
      this.studySessionWords = words; this.showStudyModal = true;
    });
  }
  onSessionClose() { this.showStudyModal = false; this.syncData(); }
}
