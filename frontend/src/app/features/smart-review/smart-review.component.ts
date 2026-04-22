import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VocabularyService } from '../../core/services/vocabulary.service';
import { NotificationService } from '../../core/services/notification.service';
import { FlashcardSessionComponent } from '../../shared/components/flashcards/flashcard-session.component';
import { map } from 'rxjs';

@Component({
  selector: 'app-smart-review',
  standalone: true,
  imports: [CommonModule, FlashcardSessionComponent],
  template: `
    <div class="review-container fade-in">
      <div class="header-section">
        <div class="header-content">
          <h1 class="title">Smart Review Studio</h1>
          <p class="subtitle">Optimize your memory using Spaced Repetition (SRS).</p>
        </div>
        <div class="status-badge" [class.due]="stats.dueCount > 0">
          <div class="pulse-dot" *ngIf="stats.dueCount > 0"></div>
          {{ stats.dueCount > 0 ? 'Action Required' : 'All Caught Up' }}
        </div>
      </div>

      <!-- Stats Dashboard -->
      <div class="stats-grid">
        <div class="stat-card due">
          <div class="stat-icon">🔥</div>
          <div class="stat-value">{{ stats.dueCount }}</div>
          <div class="stat-label">Words Due Now</div>
          <div class="stat-desc">Review these to prevent forgetting.</div>
        </div>

        <div class="stat-card total">
          <div class="stat-icon">📚</div>
          <div class="stat-value">{{ stats.totalCount }}</div>
          <div class="stat-label">Total Collection</div>
          <div class="stat-desc">Your growing knowledge base.</div>
        </div>

        <div class="stat-card mastered">
          <div class="stat-icon">🏆</div>
          <div class="stat-value">{{ stats.masteredCount }}</div>
          <div class="stat-label">Words Mastered</div>
          <div class="stat-desc">Safely stored in long-term memory.</div>
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
    .title { font-size: 36px; font-weight: 850; letter-spacing: -1px; color: var(--text-primary); margin-bottom: 8px; }
    .subtitle { color: var(--text-muted); font-size: 18px; }
    
    .status-badge { 
      padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; text-transform: uppercase;
      background: #f1f5f9; color: #64748b; display: flex; align-items: center; gap: 8px;
    }
    .status-badge.due { background: #fee2e2; color: #ef4444; }
    .pulse-dot { width: 8px; height: 8px; background: #ef4444; border-radius: 50%; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(2.5); opacity: 0; } }

    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 40px; }
    .stat-card { 
      padding: 32px; border-radius: 24px; background: white; border: 1px solid var(--border-color);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      &:hover { transform: translateY(-8px); box-shadow: var(--shadow-xl); }
    }
    .stat-icon { font-size: 32px; margin-bottom: 16px; }
    .stat-value { font-size: 48px; font-weight: 900; line-height: 1; margin-bottom: 8px; color: var(--text-primary); }
    .stat-label { font-size: 14px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; }
    .stat-desc { font-size: 13px; color: var(--text-muted); line-height: 1.4; }

    .stat-card.due { border-left: 6px solid #ef4444; .stat-value { color: #ef4444; } }
    .stat-card.total { border-left: 6px solid var(--primary); .stat-value { color: var(--primary); } }
    .stat-card.mastered { border-left: 6px solid #10b981; .stat-value { color: #10b981; } }

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
      
      .stats-grid { grid-template-columns: 1fr; gap: 16px; }
      .stat-card { padding: 24px; }
      .stat-value { font-size: 36px; }
      
      .action-panel { padding: 24px; }
      .count-big { font-size: 64px; }
      .start-btn { width: 100%; padding: 16px; font-size: 16px; }
      
      .forecast-chart { height: 120px; }
      .bar-container { width: 8px; height: 80px; }
    }

    @media (max-width: 480px) {
      .stats-grid { grid-template-columns: 1fr; }
      .bar-label { font-size: 10px; }
      .forecast-panel { padding: 20px; }
    }
  `]
})
export class SmartReviewComponent implements OnInit {
  private vocabService = inject(VocabularyService);
  private notification = inject(NotificationService);

  stats = {
    dueCount: 0,
    totalCount: 0,
    masteredCount: 0,
    forecast: [] as any[]
  };

  showStudyModal = false;
  studySessionWords: any[] = [];

  ngOnInit() {
    this.refreshStats();
  }

  refreshStats() {
    this.vocabService.getReviewStats().subscribe(data => {
      this.stats = data;
    });
  }

  getBarHeight(count: number): number {
    if (this.stats.totalCount === 0) return 0;
    // Normalized height: max count across forecast determines 100%
    const max = Math.max(...this.stats.forecast.map(f => f.count), 1);
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
    this.refreshStats();
    this.vocabService.refreshVocabulary(); // Ensure list is updated too
  }
}
