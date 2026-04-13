import { Component, Input, Output, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VocabularyWord } from '../../../core/models/course.model';
import { FlashcardComponent } from './flashcard.component';

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
              Card {{ currentIndex + 1 }} of {{ shuffledDeck.length }}
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
          <app-flashcard 
            #cardRef
            *ngIf="shuffledDeck.length > 0 && !isFinished" 
            [data]="shuffledDeck[currentIndex]" />
            
          <div class="finish-screen" *ngIf="isFinished">
            <div class="finish-icon">🏆</div>
            <h2>Session Complete!</h2>
            <p>You've reviewed all {{ shuffledDeck.length }} words.</p>
            <button class="primary-btn" (click)="onClose()">Finish & Exit</button>
            <button class="secondary-btn" (click)="restart()">Review Again</button>
          </div>
        </div>

        <!-- Controls -->
        <div class="session-footer" *ngIf="!isFinished">
          <button 
            class="nav-btn" 
            [disabled]="currentIndex === 0" 
            (click)="prevCard()">
            Previous
          </button>
          
          <button 
            *ngIf="currentIndex < shuffledDeck.length - 1" 
            class="primary-btn" 
            (click)="nextCard()">
            Next Card
          </button>
          
          <button 
            *ngIf="currentIndex === shuffledDeck.length - 1" 
            class="primary-btn finish-btn" 
            (click)="finish()">
            Finish Session
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .flashcard-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .session-container {
      width: 100%;
      max-width: 550px;
      background: var(--bg-white);
      border-radius: var(--radius-xl);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 30px 60px rgba(0,0,0,0.5);
    }

    .session-header {
      padding: 20px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-light);
    }

    .session-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .progress-info {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .close-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      transition: var(--transition);
      &:hover {
        background: var(--bg-gray);
        color: var(--text-primary);
      }
    }

    .progress-container {
      height: 4px;
      background: var(--bg-gray);
      width: 100%;
    }

    .progress-bar {
      height: 100%;
      background: var(--primary);
      transition: width 0.3s ease;
    }

    .card-area {
      padding: 40px 32px;
      min-height: 460px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .session-footer {
      padding: 24px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      border-top: 1px solid var(--border-light);
    }

    .nav-btn {
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-secondary);
      border-radius: var(--radius-md);
      transition: var(--transition);
      &:hover:not(:disabled) {
        background: var(--bg-gray);
      }
      &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
    }

    .primary-btn {
      padding: 12px 32px;
      font-size: 15px;
      font-weight: 700;
      background: var(--primary);
      color: white;
      border-radius: var(--radius-md);
      transition: var(--transition);
      box-shadow: 0 4px 12px rgba(229, 57, 53, 0.2);
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 15px rgba(229, 57, 53, 0.3);
      }
    }

    .finish-btn {
      background: #2e7d32; /* Green for success */
      box-shadow: 0 4px 12px rgba(46, 125, 50, 0.2);
      &:hover {
        box-shadow: 0 6px 15px rgba(46, 125, 50, 0.3);
      }
    }

    .secondary-btn {
      padding: 10px 24px;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-secondary);
      margin-top: 12px;
      &:hover {
        text-decoration: underline;
      }
    }

    .finish-screen {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      animation: zoomIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    @keyframes zoomIn {
      from { transform: scale(0.8); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .finish-icon {
      font-size: 64px;
      margin-bottom: 8px;
    }
  `]
})
export class FlashcardSessionComponent implements OnInit {
  @Input() words: VocabularyWord[] = [];
  @Output() close = new EventEmitter<void>();
  @ViewChild('cardRef') cardRef?: FlashcardComponent;

  shuffledDeck: VocabularyWord[] = [];
  currentIndex = 0;
  isFinished = false;

  ngOnInit() {
    this.restart();
  }

  get progress(): number {
    return ((this.currentIndex + 1) / this.shuffledDeck.length) * 100;
  }

  nextCard() {
    if (this.currentIndex < this.shuffledDeck.length - 1) {
      this.currentIndex++;
      this.cardRef?.reset();
    }
  }

  prevCard() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.cardRef?.reset();
    }
  }

  finish() {
    this.isFinished = true;
  }

  restart() {
    this.shuffledDeck = [...this.words].sort(() => Math.random() - 0.5);
    this.currentIndex = 0;
    this.isFinished = false;
    this.cardRef?.reset();
  }

  onClose() {
    this.close.emit();
  }
}
