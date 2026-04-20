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
            <span class="label">English</span>
            <h2 class="word" [class.long-word]="data.word.length > 15">{{ data.word }}</h2>
            <p class="phonetic" *ngIf="data.phonetic && data.phonetic !== 'Phrase'">{{ data.phonetic }}</p>
            <div class="hint">Click to flip</div>
          </div>
        </div>

        <!-- Back Side -->
        <div class="flashcard-back">
          <div class="card-content">
            <span class="label">Vietnamese</span>
            <h3 class="translation">{{ data.translation }}</h3>
            <div class="example-box">
              <span class="example-label">Example:</span>
              <p class="example-text">{{ data.example }}</p>
            </div>
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
      height: 380px;
      perspective: 1000px;
      cursor: pointer;
    }

    .flashcard-inner {
      position: relative;
      width: 100%;
      height: 100%;
      transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
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
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--border-light);
    }

    .flashcard-front {
      background: var(--bg-white);
      color: var(--text-primary);
    }

    .flashcard-back {
      background: var(--bg-light);
      color: var(--text-primary);
      transform: rotateY(180deg);
    }

    .card-content {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--text-muted);
      padding: 4px 12px;
      background: var(--bg-gray);
      border-radius: 20px;
    }

    .word {
      font-size: 42px;
      font-weight: 800;
      color: var(--primary);
      margin: 0;
      line-height: 1.2;
      word-break: break-word;

      &.long-word {
        font-size: 28px;
      }
    }

    .phonetic {
      font-size: 18px;
      color: var(--text-secondary);
      font-family: 'Inter', sans-serif;
    }

    .translation {
      font-size: 32px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .example-box {
      margin-top: 24px;
      padding: 16px;
      background: var(--bg-white);
      border-radius: var(--radius-md);
      border-left: 4px solid var(--primary);
      text-align: left;
      width: 100%;
    }

    .example-label {
      font-size: 12px;
      font-weight: 700;
      color: var(--text-muted);
      margin-bottom: 4px;
      display: block;
    }

    .example-text {
      font-size: 15px;
      line-height: 1.6;
      color: var(--text-secondary);
      margin: 0;
      font-style: italic;
    }

    .hint {
      margin-top: 32px;
      font-size: 13px;
      color: var(--text-muted);
      animation: pulse 2s infinite;
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

  toggleFlip() {
    this.isFlipped = !this.isFlipped;
    this.flipped.emit(this.isFlipped);
  }

  reset() {
    this.isFlipped = false;
    this.flipped.emit(false);
  }
}
