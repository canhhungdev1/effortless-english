import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VocabularyWord } from '../../../core/models/course.model';
import { FlashcardComponent } from './flashcard.component';
import { VocabularyService } from '../../../core/services/vocabulary.service';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-flashcard-session',
  standalone: true,
  imports: [CommonModule, FlashcardComponent],
  template: `
    <div class="flashcard-overlay">
      <div class="session-container" [class.summary-mode]="isFinished">
        <!-- Header -->
        <div class="session-header">
          <div class="header-left">
            <h2 class="session-title">{{ isFinished ? 'Session Summary' : 'Flashcard Study' }}</h2>
            <div class="progress-info" *ngIf="!isFinished">
              Word {{ currentIndex + 1 }} of {{ shuffledDeck.length }}
            </div>
          </div>
          <button class="close-btn" (click)="onClose()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Progress Bar -->
        <div class="progress-container" *ngIf="!isFinished">
          <div class="progress-bar" [style.width.%]="progress"></div>
        </div>

        <!-- Card Area -->
        <div class="card-area">
          <div class="card-wrapper" *ngIf="!isFinished" [class.exit]="isTransitioning" [class.enter]="!isTransitioning">
            <app-flashcard 
              #cardRef
              *ngIf="shuffledDeck.length > 0" 
              [data]="shuffledDeck[currentIndex]"
              (flipped)="onCardFlipped($event)" />
          </div>
            
          <div class="finish-screen" *ngIf="isFinished">
            <div class="celebration-icon">🏆</div>
            <h2 class="finish-title">Session Complete!</h2>
            <p class="finish-subtitle">Fantastic work! You've successfully reviewed <strong>{{ shuffledDeck.length }}</strong> words.</p>
            
            <div class="summary-stats">
              <div class="summary-item excellent">
                <span class="count">{{ sessionSummary.easy }}</span>
                <span class="label">Easy</span>
              </div>
              <div class="summary-item good">
                <span class="count">{{ sessionSummary.good }}</span>
                <span class="label">Good</span>
              </div>
              <div class="summary-item hard">
                <span class="count">{{ sessionSummary.hard }}</span>
                <span class="label">Hard</span>
              </div>
              <div class="summary-item again">
                <span class="count">{{ sessionSummary.again }}</span>
                <span class="label">Again</span>
              </div>
            </div>

            <div class="mastery-score">
               <div class="score-circle">
                 <span class="percentage">{{ masteryPercentage }}%</span>
                 <span class="score-label">Accuracy</span>
               </div>
            </div>

            <div class="finish-actions">
              <button class="primary-btn finish-btn" (click)="onClose()">Finish & Exit</button>
              <button class="secondary-btn" (click)="restart()">Practice Again</button>
            </div>
          </div>
        </div>

        <!-- SRS Rating Controls (Shown only when card is flipped) -->
        <div class="session-footer" *ngIf="!isFinished">
          <div class="nav-hint" *ngIf="!isRevealed">
            💡 Click the card to see translation and rate your memory
          </div>
          
          <div class="rating-controls" *ngIf="isRevealed">
            <button class="rate-btn again" (click)="onRate(0)">
              <span class="btn-label">Again</span>
              <span class="btn-time">&lt;1m</span>
            </button>
            <button class="rate-btn hard" (click)="onRate(1)">
              <span class="btn-label">Hard</span>
              <span class="btn-time">1d</span>
            </button>
            <button class="rate-btn good" (click)="onRate(2)">
              <span class="btn-label">Good</span>
              <span class="btn-time">4d</span>
            </button>
            <button class="rate-btn easy" (click)="onRate(3)">
              <span class="btn-label">Easy</span>
              <span class="btn-time">7d</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .flashcard-overlay {
      position: fixed; inset: 0; background: rgba(0, 0, 0, 0.9);
      backdrop-filter: blur(12px); z-index: 1000; display: flex;
      align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.4s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .session-container {
      width: 100%; max-width: 600px; background: #ffffff;
      border-radius: 32px; overflow: hidden; display: flex;
      flex-direction: column; box-shadow: 0 40px 100px rgba(0,0,0,0.6);
      border: 1px solid rgba(255,255,255,0.1);
      transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .session-container.summary-mode { max-width: 500px; }

    .session-header { 
      padding: 24px 32px; display: flex; align-items: center; justify-content: space-between; 
      background: #f8f9fa; border-bottom: 1px solid #eee;
    }
    .session-title { font-size: 20px; font-weight: 800; color: #2d3436; margin: 0; letter-spacing: -0.5px; }
    .progress-info { font-size: 14px; font-weight: 600; color: var(--text-muted); margin-top: 4px; }
    .close-btn { 
      width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; 
      color: #636e72; transition: all 0.2s; background: #dfe6e9;
      &:hover { background: #b2bec3; color: #2d3436; transform: rotate(90deg); } 
    }

    .progress-container { height: 6px; background: #eee; width: 100%; }
    .progress-bar { 
      height: 100%; background: linear-gradient(90deg, var(--primary), #ff4757); 
      border-radius: 0 3px 3px 0; transition: width 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
    }

    .card-area { 
      padding: 40px 32px; min-height: 480px; display: flex; align-items: center; justify-content: center;
      background: radial-gradient(circle at center, #ffffff 0%, #f1f2f6 100%);
      position: relative; overflow: hidden;
    }

    .card-wrapper {
      width: 100%; display: flex; justify-content: center;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .card-wrapper.exit { transform: translateX(150%) rotate(15deg); opacity: 0; filter: blur(4px); }
    .card-wrapper.enter { animation: cardEnter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

    @keyframes cardEnter {
      from { transform: translateY(40px) scale(0.9); opacity: 0; filter: blur(10px); }
      to { transform: translateY(0) scale(1); opacity: 1; filter: blur(0); }
    }

    .session-footer {
      padding: 32px; min-height: 140px; display: flex; align-items: center; justify-content: center;
      border-top: 1px solid #eee; background: #ffffff;
    }

    .nav-hint { 
      color: var(--text-muted); font-size: 15px; font-weight: 500; 
      display: flex; align-items: center; gap: 8px;
      animation: bounce 2s infinite;
    }
    @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }

    .rating-controls { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; width: 100%; }
    
    .rate-btn {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding: 16px 8px; border: 2px solid #eee; border-radius: 20px;
      background: white; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      .btn-label { font-weight: 800; font-size: 15px; text-transform: uppercase; }
      .btn-time { font-size: 12px; font-weight: 600; color: var(--text-muted); }
      &:hover { transform: translateY(-8px); border-color: currentColor; box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
      &.again { color: #ff4757; &:hover { background: #fff5f5; } }
      &.hard { color: #ffa502; &:hover { background: #fffaf0; } }
      &.good { color: #2e86de; &:hover { background: #f0f7ff; } }
      &.easy { color: #2ecc71; &:hover { background: #f2fff7; } }
    }

    /* Finish Screen Styles */
    .finish-screen { 
      text-align: center; display: flex; flex-direction: column; align-items: center; gap: 24px; 
      animation: slideUp 0.6s cubic-bezier(0.23, 1, 0.32, 1); width: 100%;
    }
    .celebration-icon { font-size: 72px; animation: scaleUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); }
    @keyframes scaleUp { from { transform: scale(0); } to { transform: scale(1); } }
    
    .finish-title { font-size: 28px; font-weight: 850; color: #1e293b; margin: 0; }
    .finish-subtitle { font-size: 16px; color: #64748b; margin-top: -8px; }
    
    .summary-stats { 
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; width: 100%; 
      margin: 10px 0;
    }
    .summary-item {
      padding: 16px 8px; border-radius: 16px; display: flex; flex-direction: column; gap: 4px;
      .count { font-size: 22px; font-weight: 800; }
      .label { font-size: 11px; font-weight: 700; text-transform: uppercase; opacity: 0.8; }
      &.excellent { background: #ecfdf5; color: #059669; }
      &.good { background: #eff6ff; color: #2563eb; }
      &.hard { background: #fffbeb; color: #d97706; }
      &.again { background: #fef2f2; color: #dc2626; }
    }

    .mastery-score {
      padding: 20px; background: #f8fafc; border-radius: 100px; width: 140px; height: 140px;
      display: flex; align-items: center; justify-content: center; border: 8px solid #e2e8f0;
      .score-circle { display: flex; flex-direction: column; align-items: center; }
      .percentage { font-size: 32px; font-weight: 900; color: #1e293b; line-height: 1; }
      .score-label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-top: 4px; }
    }

    .finish-actions { display: flex; flex-direction: column; gap: 12px; width: 100%; }
    .primary-btn.finish-btn { width: 100%; padding: 18px; font-size: 17px; box-shadow: 0 10px 30px rgba(var(--primary-rgb), 0.3); }
    .secondary-btn { background: none; border: none; font-weight: 700; color: #64748b; cursor: pointer; &:hover { color: var(--primary); } }

    @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `]
})
export class FlashcardSessionComponent implements OnInit {
  @Input() words: any[] = [];
  @Output() close = new EventEmitter<void>();
  @ViewChild('cardRef') cardRef?: FlashcardComponent;

  shuffledDeck: any[] = [];
  currentIndex = 0;
  isFinished = false;
  isRevealed = false;
  isTransitioning = false;
  
  sessionSummary = {
    again: 0,
    hard: 0,
    good: 0,
    easy: 0
  };

  private successSound = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
  private clickSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

  private cdr = inject(ChangeDetectorRef);

  constructor(private vocabService: VocabularyService) {}

  ngOnInit() {
    this.restart();
  }

  get progress(): number {
    return (this.currentIndex / this.shuffledDeck.length) * 100;
  }

  get masteryPercentage(): number {
    if (this.shuffledDeck.length === 0) return 0;
    const totalRated = this.sessionSummary.again + this.sessionSummary.hard + this.sessionSummary.good + this.sessionSummary.easy;
    if (totalRated === 0) return 0;
    // Calculation: Easy=100%, Good=80%, Hard=50%, Again=0%
    const score = (this.sessionSummary.easy * 100) + (this.sessionSummary.good * 80) + (this.sessionSummary.hard * 50);
    return Math.round(score / totalRated);
  }

  onCardFlipped(flipped: boolean) {
    this.isRevealed = flipped;
  }

  onRate(rating: number) {
    if (this.isTransitioning) return;

    // Track for summary
    if (rating === 0) this.sessionSummary.again++;
    else if (rating === 1) this.sessionSummary.hard++;
    else if (rating === 2) this.sessionSummary.good++;
    else if (rating === 3) this.sessionSummary.easy++;

    // Play click sound
    this.clickSound.currentTime = 0;
    this.clickSound.play().catch(() => {});

    const currentWord = this.shuffledDeck[this.currentIndex];
    
    this.vocabService.ensureWordAndReview(currentWord, rating as any).subscribe({
      next: (res) => {
        if (res && res.id) {
          currentWord.id = res.id;
        }
      }
    });

    // Start transition
    this.isTransitioning = true;
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.nextCard();
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.isTransitioning = false;
        this.cdr.detectChanges();
      }, 50); 
    }, 350); 
  }

  nextCard() {
    if (this.currentIndex < this.shuffledDeck.length - 1) {
      this.currentIndex++;
      this.isRevealed = false;
      this.cardRef?.reset();
    } else {
      this.finishSession();
    }
  }

  finishSession() {
    this.isFinished = true;
    this.playSuccessSound();
    this.triggerConfetti();
  }

  triggerConfetti() {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#22c55e', '#3b82f6', '#ef4444', '#f59e0b']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#22c55e', '#3b82f6', '#ef4444', '#f59e0b']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }

  private playSuccessSound() {
    this.successSound.currentTime = 0;
    this.successSound.play().catch(() => {});
  }

  restart() {
    this.shuffledDeck = [...this.words].sort(() => Math.random() - 0.5);
    this.currentIndex = 0;
    this.isFinished = false;
    this.isRevealed = false;
    this.sessionSummary = { again: 0, hard: 0, good: 0, easy: 0 };
    this.cardRef?.reset();
  }

  onClose() {
    this.close.emit();
  }
}


