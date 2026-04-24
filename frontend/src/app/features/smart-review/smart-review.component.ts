import { Component, OnInit, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { VocabularyService } from '../../core/services/vocabulary.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/auth/auth.service';
import { FlashcardSessionComponent } from '../../shared/components/flashcards/flashcard-session.component';
import { QuickGameComponent } from '../../shared/components/quick-game/quick-game.component';
import { HeatmapComponent } from '../../shared/components/heatmap/heatmap.component';
import { map, distinctUntilChanged, take, BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-smart-review',
  standalone: true,
  imports: [CommonModule, FlashcardSessionComponent, QuickGameComponent, HeatmapComponent],
  template: `
    <div class="review-container fade-in">
      <div class="header-section">
        <div class="header-content">
          <h1 class="title">Smart Review Vocabulary</h1>
          <p class="subtitle">Optimize your memory using Spaced Repetition (SRS).</p>
        </div>
        <div class="header-actions">
          <!-- Level Badge -->
          <div class="level-badge" (click)="syncData()" title="Your Current Level">
             <span class="level-icon">⭐</span>
             <span class="level-val">Level {{ auth.userSignal()?.level || 1 }}</span>
          </div>

          <!-- Streak Badge -->
          <div class="streak-badge" *ngIf="studyStats?.streak > 0" title="Daily Streak">
             <span class="streak-icon">🔥</span>
             <span class="streak-count">{{ studyStats.streak }}</span>
             <span class="streak-label">Days</span>
           </div>
        </div>
      </div>

      <!-- XP Mini Bar -->
      <div class="xp-mini-card" *ngIf="auth.userSignal() as user">
        <div class="xp-info">
          <span class="xp-label">XP Progress</span>
          <span class="xp-value">{{ user.xp || 0 }} / {{ (user.level || 1) * 100 }} XP</span>
        </div>
        <div class="xp-progress-bg">
          <div class="xp-progress-fill" [style.width.%]="xpPercentage"></div>
        </div>
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
          <div class="stat-divider"></div>
        
        <div class="stat-item accuracy" title="Overall memory accuracy">
          <div class="stat-top">
            <div class="stat-icon-sm">🎯</div>
            <div class="stat-info">
              <span class="stat-num">{{ studyStats?.accuracy || 0 }}%</span>
              <span class="stat-label">Accuracy</span>
            </div>
          </div>
          <div class="stat-progress">
            <div class="stat-progress-fill accuracy-fill" [style.width.%]="studyStats?.accuracy || 0"></div>
          </div>
          <div class="stat-meta">Based on all review sessions</div>
          
          <div class="premium-tooltip">
             <h4>Precision Score</h4>
             <p>Your objective accuracy across all flashcards and quizzes.</p>
          </div>
        </div>
      </div>
      </div>

      <div class="main-layout">
        <div class="action-panel">
          <div class="panel-header">
            <h2>Daily Review Session</h2>
            <p>Strengthen your memory with a customized session based on the SM-2 algorithm.</p>
          </div>
          
          <div class="action-box">
             <div class="due-info" *ngIf="stats && stats.dueCount > 0; else nothingDue">
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
                  <p>You have no words due for review right now. Come back later or start a practice session.</p>
                  <button class="primary-btn start-btn" (click)="startReview('all')">
                    Practice All Words
                  </button>
                </div>
             </ng-template>
          </div>

          <!-- New Words Quiz Section (Always Visible for stability) -->
          <div class="quiz-promo" [class.empty]="newWordsCount === 0">
             <div class="promo-content">
                <div class="promo-icon">{{ newWordsCount > 0 ? '🎯' : '✅' }}</div>
                <div class="promo-info">
                   <h3>{{ newWordsCount > 0 ? 'Knowledge Checkout' : 'All Caught Up!' }}</h3>
                   <p *ngIf="newWordsCount > 0">
                     You have <strong>{{ newWordsCount }}</strong> new words to activate. Try a quiz to start their review cycle!
                   </p>
                   <p *ngIf="newWordsCount === 0">
                     All your words are active. Add more words from lessons to start new quizzes.
                   </p>
                </div>
             </div>
             <button *ngIf="newWordsCount > 0" class="quiz-btn" (click)="startQuiz()">
               Launch Quiz
             </button>
             <button *ngIf="newWordsCount === 0" class="quiz-btn practice" (click)="startPracticeQuiz()">
               Practice Quiz
             </button>
          </div>
        </div>

        <div class="forecast-panel" *ngIf="displayStats.forecast">
          <h3>7-Day Workload Forecast</h3>
          <div class="forecast-chart">
            <div *ngFor="let item of displayStats.forecast; let i = index" class="bar-group" (click)="onForecastClick(item, i)">
              <div class="bar-container">
                <div class="bar" [style.height.%]="getBarHeight(item.count)">
                  <span class="bar-tooltip"><strong>{{ item.count }}</strong> words</span>
                </div>
              </div>
              <span class="bar-label">{{ item.date | date:'EEE' }}</span>
            </div>
          </div>
          <div class="forecast-note">
             Estimated number of words that will become due.
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

    <app-quick-game
      *ngIf="showQuizModal"
      [words]="quizWords"
      (results)="onQuizResults($event)"
      (close)="showQuizModal = false">
    </app-quick-game>
  `,
  styles: [`
    .review-container { max-width: 1100px; margin: 0 auto; padding: 40px 20px; will-change: opacity; }
    .header-section { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .header-actions { display: flex; align-items: center; gap: 12px; }
    
    .level-badge {
      display: flex; align-items: center; gap: 8px; background: #eff6ff;
      padding: 8px 16px; border-radius: 100px; border: 1px solid #dbeafe;
      .level-icon { font-size: 18px; }
      .level-val { font-size: 14px; font-weight: 800; color: #1e40af; }
    }

    .streak-badge {
      display: flex; align-items: center; gap: 8px; background: #fff7ed;
      padding: 8px 16px; border-radius: 100px; border: 1px solid #ffedd5;
      animation: streakPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      .streak-icon { font-size: 20px; }
      .streak-count { font-size: 18px; font-weight: 800; color: #9a3412; }
      .streak-label { font-size: 11px; font-weight: 700; color: #9a3412; text-transform: uppercase; margin-top: 2px; }
    }

    .xp-mini-card {
      background: white; border: 1px solid var(--border-color);
      border-radius: 16px; padding: 12px 20px; margin-bottom: 24px;
      box-shadow: var(--shadow-sm);
    }
    .xp-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .xp-label { font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
    .xp-value { font-size: 13px; font-weight: 800; color: var(--primary); }
    .xp-progress-bg { height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
    .xp-progress-fill { height: 100%; background: linear-gradient(90deg, var(--primary), #818cf8); border-radius: 4px; transition: width 0.8s cubic-bezier(0.23, 1, 0.32, 1); }

    @keyframes streakPop { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }

    @keyframes streakPop { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }

    .title { font-size: 36px; font-weight: 850; letter-spacing: -1px; color: var(--text-primary); margin-bottom: 8px; }
    .subtitle { color: var(--text-muted); font-size: 18px; }

    .stats-bar { display: flex; align-items: stretch; background: white; border-radius: 20px; border: 1px solid var(--border-color); padding: 20px 0; margin-bottom: 32px; box-shadow: var(--shadow-sm); }
    .stat-item { flex: 1; padding: 0 28px; display: flex; flex-direction: column; gap: 10px; position: relative; &.clickable { cursor: pointer; transition: background 0.2s; border-radius: 12px; &:hover { background: #f8fafc; } } }
    .stat-top { display: flex; align-items: center; gap: 12px; }
    .stat-icon-sm { font-size: 22px; }
    .stat-info { display: flex; align-items: baseline; gap: 8px; }
    .stat-num { font-size: 28px; font-weight: 900; color: var(--text-primary); line-height: 1; min-width: 1.5ch; }
    .stat-label { font-size: 13px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); }
    
    .stat-progress { height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden; display: flex; margin-top: 4px; }
    .stat-progress-fill { 
      height: 100%; border-radius: 3px; 
      transition: width 1s cubic-bezier(0.23, 1, 0.32, 1);
      box-shadow: 0 0 10px rgba(0,0,0,0.05);
      will-change: width;
    }
    .due-fill { background: linear-gradient(90deg, #ef4444, #f97316); }
    .learning-fill { background: linear-gradient(90deg, #3b82f6, #6366f1); }
    .mastered-fill { background: linear-gradient(90deg, #10b981, #34d399); }
    .accuracy-fill { background: linear-gradient(90deg, #8b5cf6, #d946ef); }
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

    .main-layout { display: grid; grid-template-columns: 1fr 340px; gap: 32px; }
    
    .action-panel { background: white; border-radius: 32px; border: 1px solid var(--border-color); padding: 40px; display: flex; flex-direction: column; gap: 32px; box-shadow: var(--shadow-sm); }
    .action-panel .panel-header h2 { font-size: 24px; font-weight: 800; margin-bottom: 8px; }
    .action-panel .panel-header p { color: var(--text-muted); font-size: 15px; }

    .action-box { flex: 1; min-height: 280px; background: #f8fafc; border-radius: 24px; border: 2px dashed #e2e8f0; display: flex; align-items: center; justify-content: center; text-align: center; }
    .due-info { display: flex; flex-direction: column; align-items: center; }
    .count-big { font-size: 80px; font-weight: 900; color: var(--text-primary); line-height: 1; margin-bottom: 8px; }
    .count-unit { font-size: 16px; font-weight: 600; color: var(--text-muted); margin-bottom: 32px; }
    .start-btn { padding: 18px 48px; font-size: 18px; font-weight: 800; border-radius: 16px; box-shadow: 0 10px 25px rgba(var(--primary-rgb), 0.2); }

    .quiz-promo { 
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); 
      border-radius: 24px; padding: 24px; border: 1px solid #bfdbfe;
      display: flex; align-items: center; justify-content: space-between; gap: 20px;
      margin-top: 10px;
    }
    .promo-content { display: flex; align-items: center; gap: 20px; }
    .promo-icon { font-size: 32px; background: white; width: 60px; height: 60px; border-radius: 18px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1); }
    .promo-info h3 { font-size: 17px; font-weight: 800; color: #1e40af; margin-bottom: 4px; }
    .promo-info p { font-size: 14px; color: #3b82f6; margin: 0; }
    .quiz-btn { background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; &:hover { background: #1d4ed8; transform: translateY(-2px); } }
    .quiz-btn.practice { background: #10b981; &:hover { background: #059669; } }
    
    .quiz-promo.empty {
      background: #f8fafc; border-color: #e2e8f0;
      .promo-icon { background: #f1f5f9; box-shadow: none; }
      .promo-info h3 { color: #64748b; }
      .promo-info p { color: #94a3b8; }
    }

    .empty-sync { padding: 40px; }
    .empty-icon { font-size: 48px; margin-bottom: 16px; }

    .forecast-panel { background: white; border-radius: 32px; padding: 32px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; }
    .forecast-panel h3 { font-size: 14px; font-weight: 800; margin-bottom: 24px; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; }
    .forecast-chart { display: flex; align-items: flex-end; justify-content: space-between; height: 160px; margin-bottom: 24px; }
    .bar-group { display: flex; flex-direction: column; align-items: center; gap: 12px; flex: 1; }
    .bar-container { 
      width: 12px; height: 120px; background: #f1f5f9; border-radius: 10px; 
      position: relative; display: flex; align-items: flex-end; cursor: pointer;
      &:hover { .bar { filter: brightness(1.1); } .bar-tooltip { opacity: 1; transform: translateX(-50%) translateY(-10px); } }
    }
    .bar { 
      width: 100%; background: linear-gradient(to top, var(--primary), #818cf8); 
      border-radius: 10px; transition: height 1.2s cubic-bezier(0.19, 1, 0.22, 1); 
      position: relative; will-change: height; 
    }
    .bar-tooltip { 
      position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%) translateY(0); 
      background: #1e293b; color: white; padding: 6px 12px; border-radius: 8px; 
      font-size: 11px; white-space: nowrap; opacity: 0; transition: all 0.2s; 
      z-index: 100; box-shadow: 0 4px 12px rgba(0,0,0,0.15); pointer-events: none;
      &::after {
        content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
        border: 5px solid transparent; border-top-color: #1e293b;
      }
      strong { color: var(--primary-light); }
    }
    .bar-label { font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
    .forecast-note { font-size: 11px; color: #94a3b8; text-align: center; font-style: italic; }

    .heatmap-section { margin-top: 40px; animation: slideUp 0.8s cubic-bezier(0.23, 1, 0.32, 1); }
    @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.8s ease-out; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    @media (max-width: 1024px) {
      .review-container { padding: 30px 20px; }
      .main-layout { grid-template-columns: 1fr; gap: 24px; }
      .action-panel { padding: 32px; }
    }

    @media (max-width: 768px) {
      .header-section { flex-direction: column; gap: 24px; align-items: stretch; }
      .header-actions { justify-content: flex-start; width: 100%; }
      .title { font-size: 28px; }
      .subtitle { font-size: 16px; }
      
      .stats-bar { flex-direction: column; padding: 10px; }
      .stat-item { padding: 16px 20px; border-bottom: 1px solid #f1f5f9; }
      .stat-item:last-child { border-bottom: none; }
      .stat-divider { display: none; }
      
      .count-big { font-size: 64px; }
      .start-btn { width: 100%; padding: 16px; }
      
      .forecast-chart { padding: 0 10px; height: 140px; }
      .bar-container { width: 10px; }
      .bar-label { font-size: 11px; }

      .premium-tooltip { width: 220px; left: 0; transform: translateY(10px); }
      .stat-item:hover .premium-tooltip { transform: translateY(0); }
    }

    @media (max-width: 480px) {
      .review-container { padding: 20px 12px; }
      .header-actions { flex-direction: column; align-items: stretch; }
      .manage-btn { justify-content: center; width: 100%; }
      .refresh-btn { width: 100%; }
      
      .stat-num { font-size: 24px; }
      .stat-label { font-size: 11px; }
      
      .forecast-panel { padding: 20px; }
      .forecast-chart { height: 120px; gap: 4px; }
      .bar-container { width: 6px; }
    }
  `]
})
export class SmartReviewComponent implements OnInit, OnDestroy {
  public vocabService = inject(VocabularyService);
  public auth = inject(AuthService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  get xpPercentage(): number {
    const user = this.auth.userSignal();
    if (!user) return 0;
    const currentXp = user.xp || 0;
    const level = user.level || 1;
    const xpNeeded = level * 100;
    return Math.min(Math.round((currentXp / xpNeeded) * 100), 100);
  }

  stats: any = null;
  displayStats = { dueCount: 0, totalCount: 0, masteredCount: 0, forecast: [] as any[] };
  showStudyModal = false;
  showQuizModal = false;
  studySessionWords: any[] = [];
  quizWords: any[] = [];
  studyStats: any = null;
  newWordsCount = 0;
  
  private rafId?: number;

  ngOnInit() {
    this.vocabService.stats$.pipe(
      distinctUntilChanged((p, c) => !p || !c ? false : p.dueCount===c.dueCount && p.totalCount===c.totalCount)
    ).subscribe(s => { if (s) { this.stats = s; this.animateStats(s); } });
    this.vocabService.vocab$.subscribe(v => {
      this.newWordsCount = v.filter(w => w.repetitions === 0).length;
    });
    this.vocabService.getStudyStats(true).subscribe(stats => { this.studyStats = stats; });
    this.auth.refreshProfile().subscribe();
    this.syncData();
  }

  ngOnDestroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  animateStats(target: any) {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    
    const startDue = this.displayStats.dueCount;
    const startTotal = this.displayStats.totalCount;
    const startMastered = this.displayStats.masteredCount;
    
    const targetDue = target.dueCount || 0;
    const targetTotal = target.totalCount || 0;
    const targetMastered = target.masteredCount || 0;
    const targetForecast = target.forecast || [];

    // Initialize/Reset forecast for animation if counts are currently zero
    if (this.displayStats.forecast.length === 0) {
      this.displayStats.forecast = targetForecast.map((f: any) => ({ ...f, count: 0 }));
    }

    const duration = 1200;
    const startTime = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = this.easeOutExpo(progress);

      this.displayStats.dueCount = Math.round(startDue + (targetDue - startDue) * ease);
      this.displayStats.totalCount = Math.round(startTotal + (targetTotal - startTotal) * ease);
      this.displayStats.masteredCount = Math.round(startMastered + (targetMastered - startMastered) * ease);
      
      this.displayStats.forecast = targetForecast.map((f: any, idx: number) => ({
        ...f,
        count: Math.round((f.count || 0) * ease)
      }));

      this.cd.detectChanges();

      if (progress < 1) {
        this.rafId = requestAnimationFrame(frame);
      } else {
        this.displayStats = JSON.parse(JSON.stringify(target));
        this.cd.detectChanges();
      }
    };

    this.rafId = requestAnimationFrame(frame);
  }

  private easeOutExpo(t: number): number {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  goToVocabulary(filter: string) { this.router.navigate(['/flashcards'], { queryParams: { filter } }); }
  
  onForecastClick(item: any, index: number) {
    if (index === 0) {
      // For Day 0 (Today), just use the "due" filter which include overdues
      this.goToVocabulary('due');
    } else {
      // For future days, use a specific date filter
      this.router.navigate(['/flashcards'], { 
        queryParams: { 
          filter: 'date', 
          date: item.date 
        } 
      });
    }
  }
  
  syncData() {
    this.vocabService.refreshVocabulary(true).subscribe();
    this.vocabService.getStudyStats(true).subscribe(stats => { this.studyStats = stats; });
    this.auth.refreshProfile().subscribe();
  }

  getBarHeight(count: number): number {
    if (!this.stats || this.stats.totalCount === 0 || !this.stats.forecast) return 0;
    const max = Math.max(...this.stats.forecast.map((f: any) => f.count || 0), 10);
    return Math.min((count / max) * 100, 100);
  }

  startReview(mode: 'due' | 'all') {
    this.vocabService.vocab$.pipe(take(1), map(v => {
      if (mode === 'all') return v;
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      return v.filter(w => new Date(w.next_review) <= endOfToday);
    })).subscribe(words => {
      if (words.length === 0) { this.notification.show('No words to practice!'); return; }
      this.studySessionWords = words; this.showStudyModal = true;
    });
  }

  onSessionClose() { this.showStudyModal = false; this.syncData(); }

  startQuiz() {
    this.vocabService.vocab$.pipe(take(1)).subscribe(v => {
       this.quizWords = v.filter(w => w.repetitions === 0).slice(0, 10); // Quiz up to 10 new words
       if (this.quizWords.length > 0) {
         this.showQuizModal = true;
       }
    });
  }

  startPracticeQuiz() {
    this.vocabService.vocab$.pipe(take(1)).subscribe(v => {
       if (v.length === 0) {
         this.notification.show('Add some words first to start a practice quiz!');
         return;
       }
       // Shuffle and pick 10 random words for practice
       this.quizWords = [...v].sort(() => 0.5 - Math.random()).slice(0, 10);
       this.showQuizModal = true;
    });
  }

  onQuizResults(results: { vocabularyId: string, isCorrect: boolean }[]) {
    this.vocabService.recordQuizResults(results).subscribe({
      next: () => {
        this.showQuizModal = false;
        this.notification.show('SRS progress updated based on quiz results!', 'success');
        this.syncData();
      },
      error: () => this.notification.show('Failed to save quiz results', 'error')
    });
  }
}
