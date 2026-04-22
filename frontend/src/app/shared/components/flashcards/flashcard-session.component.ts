import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VocabularyWord } from '../../../core/models/course.model';
import { FlashcardComponent } from './flashcard.component';
import { VocabularyService } from '../../../core/services/vocabulary.service';

@Component({
  selector: 'app-flashcard-session',
  standalone: true,
  imports: [CommonModule, FlashcardComponent],
  template: `
    <div class="flashcard-overlay">
      <div class="session-container">
        <!-- Header -->
        <div class="session-header">
          <div class="header-left">
            <h2 class="session-title">Flashcard Study</h2>
            <div class="progress-info">
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
        <div class="progress-container">
          <div class="progress-bar" [style.width.%]="progress"></div>
        </div>

        <!-- Card Area -->
        <div class="card-area">
          <div class="card-wrapper" [class.exit]="isTransitioning" [class.enter]="!isTransitioning && !isFinished">
            <app-flashcard 
              #cardRef
              *ngIf="shuffledDeck.length > 0 && !isFinished" 
              [data]="shuffledDeck[currentIndex]"
              (flipped)="onCardFlipped($event)" />
          </div>
            
          <div class="finish-screen" *ngIf="isFinished">
            <div class="finish-icon">🏆</div>
            <h2>Session Complete!</h2>
            <p>You've reviewed all {{ shuffledDeck.length }} words.</p>
            <button class="primary-btn" (click)="onClose()">Finish & Exit</button>
            <button class="secondary-btn" (click)="restart()">Review Again</button>
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
    }

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

    .card-wrapper.exit {
      transform: translateX(150%) rotate(15deg);
      opacity: 0;
      filter: blur(4px);
    }

    .card-wrapper.enter {
      animation: cardEnter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }

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

    .primary-btn {
      padding: 16px 48px; font-size: 16px; font-weight: 800; background: var(--primary);
      color: white; border-radius: 20px; transition: all 0.3s;
      box-shadow: 0 10px 25px rgba(229, 57, 53, 0.3);
      &:hover { transform: scale(1.05); box-shadow: 0 15px 35px rgba(229, 57, 53, 0.4); }
    }

    .secondary-btn { 
      padding: 12px 24px; font-size: 15px; font-weight: 700; color: #636e72; 
      margin-top: 16px; transition: color 0.2s;
      &:hover { color: var(--primary); text-decoration: none; } 
    }

    .finish-screen { 
      text-align: center; display: flex; flex-direction: column; align-items: center; gap: 16px; 
      animation: slideUp 0.6s cubic-bezier(0.23, 1, 0.32, 1); 
    }
    @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .finish-icon { font-size: 80px; margin-bottom: 16px; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.1)); }
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

  onCardFlipped(flipped: boolean) {
    this.isRevealed = flipped;
  }

  onRate(rating: number) {
    if (this.isTransitioning) return;

    // Play click sound
    this.clickSound.currentTime = 0;
    this.clickSound.play().catch(() => {});

    const currentWord = this.shuffledDeck[this.currentIndex];
    
    this.vocabService.ensureWordAndReview(currentWord, rating as any).subscribe({
      next: (res) => {
        // If it was a new word, it now has an ID returned from server/local
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
      }, 50); // Small delay to trigger Enter animation
    }, 350); // Matches CSS exit duration
  }

  nextCard() {
    if (this.currentIndex < this.shuffledDeck.length - 1) {
      this.currentIndex++;
      this.isRevealed = false;
      this.cardRef?.reset();
    } else {
      this.isFinished = true;
      this.playSuccessSound();
    }
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
    this.cardRef?.reset();
  }

  onClose() {
    this.close.emit();
  }
}

