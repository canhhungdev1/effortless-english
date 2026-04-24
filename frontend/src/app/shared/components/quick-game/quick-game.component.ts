import { Component, Input, Output, EventEmitter, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamificationService } from '../../../core/services/gamification.service';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import confetti from 'canvas-confetti';

interface QuizOption {
  text: string;
  isCorrect: boolean;
  isWord?: boolean;
}

@Component({
  selector: 'app-quick-game',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="game-overlay">
      <div class="game-container" [class.summary-mode]="isFinished">
        <!-- Header -->
        <div class="game-header">
          <div class="header-left">
            <h2 class="game-title">{{ isFinished ? 'Game Summary' : 'Vocabulary Quiz' }}</h2>
            <div class="game-stats" *ngIf="!isFinished">
              <span class="stat-item">Question {{ currentIndex + 1 }}/{{ quizDeck.length }}</span>
              <span class="stat-item score">Score: {{ score }}</span>
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

        <!-- Animation Container -->
        <div class="game-content" [class.shake]="isWrong" [class.correct-anim]="isCorrect">
          
          <!-- Quiz Screen -->
          <ng-container *ngIf="!isFinished">
            <div class="question-card">
              <span class="question-label">What is the meaning of:</span>
              <h1 class="target-word">{{ currentQuestion?.word }}</h1>
              <div class="phonetic" *ngIf="currentQuestion?.phonetic">[{{ currentQuestion.phonetic }}]</div>
            </div>

            <div class="options-grid">
              <button 
                *ngFor="let option of options; let i = index" 
                class="option-btn"
                [class.selected]="selectedOption === i"
                [class.correct]="showResult && option.isCorrect"
                [class.wrong]="showResult && selectedOption === i && !option.isCorrect"
                [disabled]="showResult"
                (click)="onSelectOption(i)"
              >
                <span class="option-index">{{ getOptionLabel(i) }}</span>
                <span class="option-text">{{ option.text }}</span>
              </button>
            </div>
          </ng-container>

          <!-- Summary Screen -->
          <div class="summary-screen" *ngIf="isFinished">
            <div class="result-icon">{{ masteryIcon }}</div>
            <h2 class="result-title">{{ masteryTitle }}</h2>
            <div class="result-info-box">
              <p class="result-subtitle">You got <strong>{{ score }}</strong> / <strong>{{ quizDeck.length }}</strong> correct!</p>
              <div class="xp-reward" *ngIf="score > 0">
                <span class="xp-plus">+</span>
                <span class="xp-val">{{ score * 10 }}</span>
                <span class="xp-lab">XP Gained</span>
              </div>
            </div>
            
            <div class="stats-circle-container">
               <div class="stats-circle" [style.--percentage]="accuracy">
                 <span class="percentage">{{ accuracy }}%</span>
                 <span class="label">Accuracy</span>
               </div>
            </div>

            <div class="summary-actions">
              <button class="primary-btn" (click)="onClose()">Collect Rewards</button>
              <button class="secondary-btn" (click)="restart()">Play Again</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .game-overlay {
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(12px); z-index: 9999; display: flex;
      align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.4s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .game-container {
      width: 100%; max-width: 650px; background: #ffffff;
      border-radius: 32px; overflow: hidden; display: flex;
      flex-direction: column; box-shadow: 0 40px 100px rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.1);
      transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .game-container.summary-mode { max-width: 500px; }

    .game-header { 
      padding: 20px 32px; display: flex; align-items: center; justify-content: space-between; 
      background: #f8fafc; border-bottom: 1px solid #e2e8f0;
    }
    .game-title { font-size: 18px; font-weight: 800; color: #1e293b; margin: 0; letter-spacing: -0.5px; }
    .game-stats { display: flex; gap: 16px; margin-top: 4px; }
    .stat-item { font-size: 13px; font-weight: 600; color: #64748b; }
    .stat-item.score { color: #22c55e; }
    
    .close-btn { 
      width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; 
      color: #64748b; transition: all 0.2s; background: #f1f5f9;
      &:hover { background: #e2e8f0; color: #1e293b; transform: rotate(90deg); } 
    }

    .progress-container { height: 6px; background: #e2e8f0; width: 100%; }
    .progress-bar { 
      height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); 
      border-radius: 0 3px 3px 0; transition: width 0.4s ease; 
    }

    .game-content { 
      padding: 40px; min-height: 500px; display: flex; flex-direction: column; align-items: center;
      position: relative;
    }

    .question-card {
      text-align: center; margin-bottom: 40px; animation: slideDown 0.5s cubic-bezier(0.23, 1, 0.32, 1);
    }
    .question-label { font-size: 14px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
    .target-word { font-size: 56px; font-weight: 900; color: #1e293b; margin: 12px 0; letter-spacing: -2px; }
    .phonetic { font-size: 18px; color: #64748b; font-family: 'Inter', sans-serif; }

    .options-grid {
      display: grid; grid-template-columns: 1fr; gap: 16px; width: 100%;
    }

    .option-btn {
      display: flex; align-items: center; gap: 20px; padding: 20px 24px;
      background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 20px;
      cursor: pointer; transition: all 0.2s; text-align: left;
      position: relative; overflow: hidden;

      &:hover:not(:disabled) {
        border-color: #3b82f6; background: #eff6ff; transform: translateY(-2px);
        box-shadow: 0 8px 15px rgba(59, 130, 246, 0.1);
      }

      &:active:not(:disabled) { transform: scale(0.98); }

      &.correct { border-color: #22c55e; background: #f0fdf4; color: #15803d; font-weight: 700; box-shadow: 0 0 20px rgba(34, 197, 94, 0.2); }
      &.wrong { border-color: #ef4444; background: #fef2f2; color: #b91c1b; }
      
      .option-index {
        width: 36px; height: 36px; border-radius: 10px; background: #e2e8f0;
        display: flex; align-items: center; justify-content: center;
        font-weight: 800; font-size: 16px; color: #475569; transition: all 0.2s;
      }

      &:hover .option-index { background: #3b82f6; color: white; }
      &.correct .option-index { background: #22c55e; color: white; }
      &.wrong .option-index { background: #ef4444; color: white; }

      .option-text { font-size: 18px; font-weight: 600; flex: 1; }
    }

    /* Summary Styles */
    .summary-screen {
      text-align: center; display: flex; flex-direction: column; align-items: center; gap: 24px; 
      animation: zoomIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .result-icon { font-size: 80px; margin-bottom: 8px; }
    .result-title { font-size: 32px; font-weight: 900; color: #1e293b; margin: 0; }
    .result-info-box { margin: 16px 0; display: flex; flex-direction: column; gap: 8px; align-items: center; }
    .result-subtitle { font-size: 18px; color: #64748b; margin: 0; }
    
    .xp-reward {
      background: #f0fdf4; border: 1px solid #bbfcce; padding: 8px 16px; border-radius: 12px;
      display: flex; align-items: center; gap: 4px; animation: bounce 1s infinite alternate;
      .xp-plus { color: #16a34a; font-weight: 800; font-size: 18px; }
      .xp-val { color: #16a34a; font-weight: 900; font-size: 24px; }
      .xp-lab { color: #15803d; font-weight: 700; font-size: 13px; margin-left: 4px; }
    }
    @keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-4px); } }

    .stats-circle-container { margin: 20px 0; }
    .stats-circle {
      width: 160px; height: 160px; border-radius: 50%;
      background: conic-gradient(#3b82f6 calc(var(--percentage) * 1%), #e2e8f0 0);
      display: flex; align-items: center; justify-content: center;
      position: relative;
      &::after {
        content: ''; position: absolute; inset: 12px; background: white; border-radius: 50%;
      }
      .percentage { position: relative; z-index: 1; font-size: 36px; font-weight: 900; color: #1e293b; line-height: 1; }
      .label { position: relative; z-index: 1; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-top: 4px; display: block; border-top: none; }
      display: flex; flex-direction: column;
    }

    .summary-actions { display: flex; flex-direction: column; gap: 12px; width: 100%; }
    .primary-btn { 
      width: 100%; padding: 18px; border-radius: 16px; border: none;
      background: #3b82f6; color: white; font-size: 18px; font-weight: 700;
      cursor: pointer; transition: all 0.2s;
      box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4);
      &:hover { transform: translateY(-2px); background: #2563eb; box-shadow: 0 15px 30px rgba(59, 130, 246, 0.5); }
    }
    .secondary-btn { 
      background: none; border: none; font-size: 16px; font-weight: 700; color: #64748b; 
      cursor: pointer; padding: 12px; &:hover { color: #3b82f6; } 
    }

    /* Animations */
    .shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
    @keyframes shake {
      10%, 90% { transform: translate3d(-1px, 0, 0); }
      20%, 80% { transform: translate3d(2px, 0, 0); }
      30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
      40%, 60% { transform: translate3d(4px, 0, 0); }
    }

    .correct-anim { animation: pulse 0.5s ease-in-out; }
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.02); }
      100% { transform: scale(1); }
    }

    @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes zoomIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `]
})
export class QuickGameComponent implements OnInit {
  @Input() words: any[] = [];
  @Input() quizSelection: any[] = []; // NEW: Specify which words to actually quiz
  @Output() results = new EventEmitter<{ vocabularyId: string, isCorrect: boolean }[]>();
  @Output() close = new EventEmitter<void>();

  quizDeck: any[] = [];
  gameResults: { vocabularyId: string, isCorrect: boolean }[] = [];
  currentIndex = 0;
  score = 0;
  options: QuizOption[] = [];
  selectedOption: number | null = null;
  showResult = false;
  isFinished = false;

  // Animation states
  isWrong = false;
  isCorrect = false;

  private correctSound = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
  private wrongSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
  private clickSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

  private cdr = inject(ChangeDetectorRef);
  private gamificationService = inject(GamificationService);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);

  ngOnInit() {
    this.restart();
  }

  get currentQuestion() {
    return this.quizDeck[this.currentIndex];
  }

  get progress() {
    return (this.currentIndex / this.quizDeck.length) * 100;
  }

  get accuracy() {
    if (this.quizDeck.length === 0) return 0;
    return Math.round((this.score / this.quizDeck.length) * 100);
  }

  get masteryIcon() {
    if (this.accuracy >= 90) return '🔥';
    if (this.accuracy >= 70) return '⭐';
    if (this.accuracy >= 50) return '👍';
    return '📚';
  }

  get masteryTitle() {
    if (this.accuracy >= 90) return 'Legendary!';
    if (this.accuracy >= 70) return 'Great Job!';
    if (this.accuracy >= 50) return 'Well Done!';
    return 'Keep Practicing!';
  }

  restart() {
    const targetPool = (this.quizSelection && this.quizSelection.length > 0) 
      ? this.quizSelection 
      : this.words;

    if (!targetPool || targetPool.length === 0) {
      console.warn('No words to quiz');
      this.quizDeck = [];
    } else {
      this.quizDeck = [...targetPool].sort(() => Math.random() - 0.5);
    }
    
    this.currentIndex = 0;
    this.score = 0;
    this.gameResults = [];
    this.isFinished = false;
    this.nextQuestion();
  }

  nextQuestion() {
    this.showResult = false;
    this.selectedOption = null;
    this.isWrong = false;
    this.isCorrect = false;
    this.generateOptions();
    this.cdr.detectChanges();
  }

  generateOptions() {
    const current = this.currentQuestion;
    if (!current) return;

    const correctOption: QuizOption = { text: current.translation, isCorrect: true };
    
    // Use the full 'words' pool to find distractors, excluding the current target word
    const fieldOptions = this.words
      .filter(w => w.word !== current.word && w.translation !== current.translation)
      .map(w => ({ text: w.translation, isCorrect: false }));

    // Fallback distractors if we don't have enough words in the pool
    const fallbacks = [
      'Không xác định', 'Cái bàn', 'Học tập', 'Vui vẻ', 'Thành công', 
      'Cố gắng', 'Trải nghiệm', 'Kiến thức'
    ].map(t => ({ text: t, isCorrect: false }));

    const distractorPool = [...fieldOptions, ...fallbacks];

    // Shuffle and pick 3 unique distractors
    const distractors: QuizOption[] = [];
    const usedTexts = new Set([correctOption.text]);
    
    const shuffledPool = distractorPool.sort(() => Math.random() - 0.5);
    for (const d of shuffledPool) {
      if (distractors.length >= 3) break;
      if (!usedTexts.has(d.text)) {
        distractors.push(d);
        usedTexts.add(d.text);
      }
    }
    
    // Combine and shuffle all 4
    this.options = [correctOption, ...distractors].sort(() => Math.random() - 0.5);
  }

  onSelectOption(index: number) {
    if (this.showResult) return;
    
    this.selectedOption = index;
    const isCorrect = this.options[index].isCorrect;
    this.showResult = true;

    if (isCorrect) {
      this.score++;
      this.isCorrect = true;
      this.playSound(this.correctSound);
    } else {
      this.isWrong = true;
      this.playSound(this.wrongSound);
    }
    
    // Track detailed result
    if (this.currentQuestion.id) {
      this.gameResults.push({ vocabularyId: this.currentQuestion.id, isCorrect });
    }

    this.cdr.detectChanges();

    // Small delay before next question
    setTimeout(() => {
      if (this.currentIndex < this.quizDeck.length - 1) {
        this.currentIndex++;
        this.nextQuestion();
      } else {
        this.finishGame();
      }
    }, 1200);
  }

  finishGame() {
    this.isFinished = true;
    
    // Reward XP based on score
    if (this.score > 0) {
      const xpToGain = this.score * 10; // 10 XP per correct answer
      this.gamificationService.trackActivity({ xp: xpToGain }).subscribe({
        next: () => {
          this.notification.show(`Awesome! You earned ${xpToGain} XP!`, 'success');
          this.authService.refreshProfile().subscribe();
        },
        error: (err: any) => console.error('Failed to update XP', err)
      });
    }

    if (this.accuracy >= 70) {
      this.triggerConfetti();
    }
    
    // Emit results for parent components (SRS integration)
    if (this.gameResults.length > 0) {
      this.results.emit(this.gameResults);
    }
    
    this.cdr.detectChanges();
  }

  getOptionLabel(index: number) {
    return String.fromCharCode(65 + index); // A, B, C, D
  }

  private playSound(audio: HTMLAudioElement) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  triggerConfetti() {
    const scalar = 2;
    const triangle = confetti.shapeFromPath({ path: 'M0 10 L5 0 L10 10z' });

    confetti({
      shapes: [triangle],
      particleCount: 40,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b']
    });
  }

  onClose() {
    this.close.emit();
  }
}
