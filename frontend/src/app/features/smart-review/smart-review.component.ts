import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VocabularyService } from '../../core/services/vocabulary.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/auth/auth.service';
import { FlashcardSessionComponent } from '../../shared/components/flashcards/flashcard-session.component';
import { map } from 'rxjs';

@Component({
  selector: 'app-smart-review',
  standalone: true,
  imports: [CommonModule, RouterLink, FlashcardSessionComponent],
  template: `
    <div class="review-container fade-in" [class.is-loading]="!stats">
      <div class="header-section">
        <div class="header-content">
          <h1 class="title">Smart Review Vocabulary</h1>
          <p class="subtitle">Optimize your memory using Spaced Repetition (SRS).</p>
        </div>
        <div class="header-actions">
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
        <div class="stat-item due">
          <div class="stat-top">
            <div class="stat-icon-sm">🔥</div>
            <div class="stat-info">
              <span class="stat-num">{{ stats.dueCount }}</span>
              <span class="stat-label">Due Now</span>
            </div>
          </div>
          <div class="stat-progress">
            <div class="stat-progress-fill due-fill" [style.width.%]="stats.totalCount ? (stats.dueCount / stats.totalCount * 100) : 0"></div>
          </div>
          <div class="stat-meta">{{ stats.totalCount ? (stats.dueCount / stats.totalCount * 100 | number:'1.0-0') : 0 }}% of collection needs review</div>
        </div>

        <div class="stat-divider"></div>

        <div class="stat-item total">
          <div class="stat-top">
            <div class="stat-icon-sm">📚</div>
            <div class="stat-info">
              <span class="stat-num">{{ stats.totalCount }}</span>
              <span class="stat-label">Total</span>
            </div>
          </div>
          <div class="stat-progress">
            <div class="stat-progress-fill learning-fill" [style.width.%]="stats.totalCount ? ((stats.totalCount - stats.masteredCount) / stats.totalCount * 100) : 0"></div>
            <div class="stat-progress-fill mastered-fill" [style.width.%]="stats.totalCount ? (stats.masteredCount / stats.totalCount * 100) : 0"></div>
          </div>
          <div class="stat-meta">{{ stats.totalCount - stats.masteredCount - stats.dueCount }} learning · {{ stats.dueCount }} reviewing</div>
        </div>

        <div class="stat-divider"></div>

        <div class="stat-item mastered">
          <div class="stat-top">
            <div class="stat-icon-sm">🏆</div>
            <div class="stat-info">
              <span class="stat-num">{{ stats.masteredCount }}</span>
              <span class="stat-label">Mastered</span>
            </div>
          </div>
          <div class="stat-progress">
            <div class="stat-progress-fill mastered-fill" [style.width.%]="stats.totalCount ? (stats.masteredCount / stats.totalCount * 100) : 0"></div>
          </div>
          <div class="stat-meta">{{ stats.totalCount ? (stats.masteredCount / stats.totalCount * 100 | number:'1.0-0') : 0 }}% mastery rate</div>
        </div>
      </div>

      <div class="main-layout">
        <!-- Review Action -->
        <div class="action-panel">
          <div class="panel-header">
            <h2>Daily Review Session</h2>
            <p>We've prepared a customized list of words for you based on the SM-2 algorithm.</p>
          </div>
          
          <div class="action-box">
             <div class="due-info" *ngIf="stats.dueCount > 0; else nothingDue">
                <div class="count-big">{{ stats.dueCount }}</div>
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

        <!-- Forecast Column -->
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
    </div>

    <!-- Study Modal -->
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
    
    .manage-btn {
      display: flex; align-items: center; gap: 8px; padding: 10px 18px;
      background: white; border: 1px solid var(--border-color); border-radius: 12px;
      color: var(--text-primary); font-size: 14px; font-weight: 700;
      cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: var(--shadow-sm);
      
      svg { transition: transform 0.3s; }
      &:hover { 
        background: #f8fafc; border-color: var(--primary-light); color: var(--primary);
        transform: translateY(-2px); box-shadow: var(--shadow-md);
        svg { transform: translateX(-2px); }
      }
      &:active { transform: translateY(0); }
    }

    .refresh-btn { 
      background: white; border: 1px solid var(--border-color); color: var(--text-muted);
      width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      &:hover { color: var(--primary); border-color: var(--primary-light); transform: rotate(30deg); box-shadow: var(--shadow-sm); }
      &:active { transform: scale(0.9) rotate(45deg); }
      &.spinning svg { animation: spin 1s linear infinite; }
    }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    .title { font-size: 36px; font-weight: 850; letter-spacing: -1px; color: var(--text-primary); margin-bottom: 8px; }
    .subtitle { color: var(--text-muted); font-size: 18px; }

    .review-container.is-loading { opacity: 0.7; pointer-events: none; }
    
    .loading-overlay {
      height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px;
      color: var(--text-muted); font-weight: 600;
    }
    .loader {
      width: 48px; height: 48px; border: 5px solid var(--bg-gray); border-bottom-color: var(--primary);
      border-radius: 50%; display: inline-block; box-sizing: border-box; animation: rotation 1s linear infinite;
    }
    @keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    .stats-bar {
      display: flex; align-items: stretch; gap: 0;
      background: white; border-radius: 20px; border: 1px solid var(--border-color);
      padding: 20px 0; margin-bottom: 32px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .stat-item {
      flex: 1; padding: 0 28px; display: flex; flex-direction: column; gap: 10px;
    }
    .stat-divider {
      width: 1px; background: var(--border-color); margin: 4px 0;
    }
    .stat-top { display: flex; align-items: center; gap: 12px; }
    .stat-icon-sm { font-size: 22px; }
    .stat-info { display: flex; align-items: baseline; gap: 8px; }
    .stat-num { font-size: 28px; font-weight: 900; color: var(--text-primary); line-height: 1; }
    .stat-label { font-size: 13px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; }
    .stat-progress {
      height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden;
      display: flex;
    }
    .stat-progress-fill {
      height: 100%; border-radius: 3px;
      transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      min-width: 0;
    }
    .due-fill { background: linear-gradient(90deg, #ef4444, #f97316); }
    .learning-fill { background: linear-gradient(90deg, #3b82f6, #6366f1); }
    .mastered-fill { background: linear-gradient(90deg, #10b981, #34d399); }
    .stat-meta { font-size: 12px; color: #94a3b8; font-weight: 500; }

    .stat-item.due .stat-num { color: #ef4444; }
    .stat-item.total .stat-num { color: var(--primary); }
    .stat-item.mastered .stat-num { color: #10b981; }

    .main-layout { display: grid; grid-template-columns: 1fr 340px; gap: 40px; }
    
    .action-panel { background: white; border-radius: 32px; border: 1px solid var(--border-color); padding: 40px; display: flex; flex-direction: column; gap: 32px; box-shadow: var(--shadow-sm); }
    .panel-header h2 { font-size: 24px; font-weight: 800; margin-bottom: 8px; }
    .panel-header p { color: var(--text-muted); }
    
    .action-box { 
      flex: 1; min-height: 300px; background: #f8fafc; border-radius: 24px; border: 2px dashed #e2e8f0;
      display: flex; align-items: center; justify-content: center; text-align: center;
    }
    
    .due-info { display: flex; flex-direction: column; align-items: center; }
    .count-big { font-size: 80px; font-weight: 900; color: var(--text-primary); line-height: 1; }
    .count-unit { font-size: 18px; font-weight: 600; color: var(--text-muted); margin-bottom: 32px; }
    .start-btn { padding: 20px 60px; font-size: 18px; font-weight: 800; border-radius: 20px; box-shadow: 0 10px 25px rgba(var(--primary-rgb), 0.3); }

    .empty-sync { padding: 40px; }
    .empty-icon { font-size: 64px; margin-bottom: 16px; }
    .empty-sync h3 { font-size: 20px; font-weight: 800; margin-bottom: 8px; }
    .empty-sync p { margin-bottom: 24px; color: var(--text-muted); }

    .forecast-panel { background: #f8fafc; border-radius: 32px; padding: 32px; }
    .forecast-panel h3 { font-size: 16px; font-weight: 800; margin-bottom: 24px; text-transform: uppercase; color: var(--text-muted); }
    
    .forecast-chart { display: flex; align-items: flex-end; justify-content: space-between; height: 160px; margin-bottom: 24px; padding: 0 10px; }
    .bar-group { display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1; }
    .bar-container { width: 12px; height: 120px; background: #e2e8f0; border-radius: 10px; position: relative; display: flex; align-items: flex-end; }
    .bar { 
      width: 100%; background: var(--primary); border-radius: 10px; transition: height 1s ease; position: relative;
      background: linear-gradient(to top, var(--primary), #818cf8);
      &:hover { filter: brightness(1.1); .bar-tooltip { opacity: 1; transform: translateX(-50%) translateY(-10px); } }
    }
    .bar-tooltip { 
       position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%) translateY(0);
       background: #1e293b; color: white; padding: 4px 8px; border-radius: 6px; font-size: 10px;
       white-space: nowrap; pointer-events: none; opacity: 0; transition: all 0.2s;
       z-index: 10;
    }
    .bar-label { font-size: 11px; font-weight: 700; color: #94a3b8; }
    .forecast-note { font-size: 12px; color: #94a3b8; line-height: 1.5; font-style: italic; }

    .fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

    /* Responsive Adjustments */
    @media (max-width: 1024px) {
      .main-layout { grid-template-columns: 1fr; gap: 32px; }
      .forecast-panel { order: -1; } /* Show forecast above session control on tablets */
    }

    @media (max-width: 768px) {
      .review-container { padding: 24px 16px; }
      .header-section { flex-direction: column; gap: 16px; align-items: flex-start; }
      .title { font-size: 28px; }
      .subtitle { font-size: 15px; }
      
      .stats-bar { flex-direction: column; gap: 0; padding: 16px 0; }
      .stat-item { padding: 14px 20px; }
      .stat-divider { width: auto; height: 1px; margin: 0 20px; }
      
      .action-panel { padding: 24px; }
      .count-big { font-size: 64px; }
      .start-btn { width: 100%; padding: 16px; font-size: 16px; }
      
      .forecast-chart { height: 120px; }
      .bar-container { width: 8px; height: 80px; }
    }

    @media (max-width: 480px) {
      .bar-label { font-size: 10px; }
      .forecast-panel { padding: 20px; }
    }
  `]
})
export class SmartReviewComponent implements OnInit {
  public vocabService = inject(VocabularyService);
  private auth = inject(AuthService);
  private notification = inject(NotificationService);

  stats: any = null;
  showStudyModal = false;
  studySessionWords: any[] = [];

  ngOnInit() {
    // Listen to reactive stats stream - updates automatically
    this.vocabService.stats$.subscribe(s => {
      this.stats = s;
    });

    // Trigger a data sync immediately
    this.syncData();
  }

  syncData() {
    this.vocabService.refreshVocabulary();
  }

  getBarHeight(count: number): number {
    if (!this.stats || this.stats.totalCount === 0) return 0;
    const max = Math.max(...this.stats.forecast.map((f: any) => f.count), 1);
    return (count / max) * 100;
  }

  startReview(mode: 'due' | 'all') {
    if (mode === 'due') {
      this.vocabService.vocab$.pipe(
        map(vocab => vocab.filter(v => new Date(v.next_review) <= new Date()))
      ).subscribe(dueWords => {
        if (dueWords.length === 0) {
          this.notification.show('No words due for review!');
          return;
        }
        this.studySessionWords = dueWords;
        this.showStudyModal = true;
      });
    } else {
      this.vocabService.vocab$.subscribe(all => {
        this.studySessionWords = all;
        this.showStudyModal = true;
      });
    }
  }

  onSessionClose() {
    this.showStudyModal = false;
    this.syncData();
  }
}
