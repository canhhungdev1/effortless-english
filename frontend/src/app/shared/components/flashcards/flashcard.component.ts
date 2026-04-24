import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VocabularyWord } from '../../../core/models/course.model';

@Component({
  selector: 'app-flashcard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flashcard-container" [class.flipped]="isFlipped" (click)="toggleFlip()">
      <div class="flashcard-inner">
        <!-- Front Side -->
        <div class="flashcard-front">
          <div class="card-content">
            <div class="top-row">
              <span class="label">English</span>
              <button class="speak-btn" (click)="speak($event)" title="Listen">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"></path>
                </svg>
              </button>
            </div>
            <h2 class="word" [class.long-word]="data.word.length > 15">{{ data.word }}</h2>
            <p class="phonetic" *ngIf="data.phonetic && data.phonetic !== 'Phrase'">{{ data.phonetic }}</p>
            <div class="hint">Click to flip</div>
          </div>
        </div>

        <!-- Back Side -->
        <div class="flashcard-back">
          <div class="card-content">
            <div class="top-row">
              <span class="label">Vietnamese</span>
              <button class="speak-btn" (click)="speak($event)" title="Listen">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"></path>
                </svg>
              </button>
            </div>
            <h3 class="translation">{{ data.translation }}</h3>
            <p class="phonetic back-phonetic" *ngIf="data.phonetic && data.phonetic !== 'Phrase'">{{ data.phonetic }}</p>
            <div class="example-box" *ngIf="data.example">
              <span class="example-label">Example:</span>
              <p class="example-text">{{ data.example }}</p>
            </div>
            <div class="hint back">Click to flip back</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .flashcard-container {
      width: 100%;
      height: 400px;
      perspective: 1500px;
      cursor: pointer;
    }

    .flashcard-inner {
      position: relative;
      width: 100%;
      height: 100%;
      transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      transform-style: preserve-3d;
    }

    .flashcard-container.flipped .flashcard-inner {
      transform: rotateY(180deg);
    }

    .flashcard-front, .flashcard-back {
      position: absolute;
      width: 100%;
      height: 100%;
      backface-visibility: hidden;
      border-radius: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.05);
      border: 1px solid rgba(255,255,255,0.8);
    }

    .flashcard-front {
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
      color: var(--text-primary);
    }

    .flashcard-back {
      background: linear-gradient(135deg, #f1f2f6 0%, #ffffff 100%);
      color: var(--text-primary);
      transform: rotateY(180deg);
    }

    .card-content {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
    }

    .top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      margin-bottom: 20px;
    }

    .speak-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background: var(--bg-gray);
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      &:hover { transform: scale(1.1); background: var(--primary-light); }
    }

    .label {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--text-muted);
      padding: 6px 16px;
      background: rgba(0,0,0,0.04);
      border-radius: 30px;
    }

    .word {
      font-size: 48px;
      font-weight: 900;
      background: linear-gradient(45deg, var(--primary), #ff4757);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0;
      line-height: 1.1;
      text-align: center;
      word-break: break-word;

      &.long-word {
        font-size: 32px;
      }
    }

    .phonetic {
      font-size: 20px;
      color: var(--text-muted);
      font-family: 'Inter', sans-serif;
      margin-top: 8px;
      &.back-phonetic { font-size: 16px; margin-top: 4px; color: var(--primary); }
    }

    .translation {
      font-size: 36px;
      font-weight: 800;
      color: #2f3542;
      margin: 0;
      text-align: center;
    }

    .example-box {
      margin-top: 20px;
      padding: 20px;
      background: rgba(255,255,255,0.6);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      border: 1px solid rgba(0,0,0,0.05);
      border-left: 5px solid var(--primary);
      text-align: left;
      width: 100%;
    }

    .example-label {
      font-size: 12px;
      font-weight: 800;
      color: var(--text-muted);
      text-transform: uppercase;
      margin-bottom: 8px;
      display: block;
    }

    .example-text {
      font-size: 16px;
      line-height: 1.6;
      color: var(--text-secondary);
      margin: 0;
      font-style: italic;
    }

    .hint {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.6;
      &.back { color: var(--primary); opacity: 0.8; }
    }

    @keyframes pulse {
      0% { opacity: 0.6; }
      50% { opacity: 1; }
      100% { opacity: 0.6; }
    }
  `]
})
export class FlashcardComponent {
  @Input({ required: true }) data!: VocabularyWord;
  @Output() flipped = new EventEmitter<boolean>();

  isFlipped = false;

  private flipSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

  toggleFlip() {
    this.isFlipped = !this.isFlipped;
    this.flipped.emit(this.isFlipped);
    
    // Play flip sound
    this.flipSound.currentTime = 0;
    this.flipSound.play().catch(() => {});
  }

  speak(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(this.data.word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }

  reset() {
    this.isFlipped = false;
    this.flipped.emit(false);
  }
}
