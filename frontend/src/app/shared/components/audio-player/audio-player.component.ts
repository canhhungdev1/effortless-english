import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-audio-player',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="audio-player-card">
      <audio #audioElement 
             [src]="audioUrl" 
             (timeupdate)="onTimeUpdate()" 
             (loadedmetadata)="onLoadedMetadata()"
             (ended)="onEnded()"></audio>

      <!-- Left Section: Cover & Info -->
      <div class="player-info">
        <div class="cover-icon">
          <!-- A graduation cap style logo similar to 'e' effortless english -->
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72l5 2.73 5-2.73v3.72z"/>
          </svg>
        </div>
        <div class="meta">
          <h3 class="title">{{ title }}</h3>
          <p class="subtitle">{{ subtitle }}</p>
        </div>
      </div>

      <!-- Center: Progress -->
      <div class="progress-container">
        <div class="progress-bar" (click)="seek($event)">
          <div class="progress-track">
            <div class="progress-fill" [style.width.%]="progress"></div>
            <div class="progress-thumb" [style.left.%]="progress"></div>
          </div>
        </div>
      </div>

      <span class="time">{{ currentTime }}</span>

      <!-- Right Section: Actions -->
      <div class="player-actions">
        <!-- Speed Selection -->
        <div class="speed-control">
          <button class="speed-btn" (click)="toggleSpeedMenu($event)">
            {{ currentSpeed }}x
          </button>
          
          <div class="speed-menu" *ngIf="showSpeedMenu" (click)="$event.stopPropagation()">
            <div 
              *ngFor="let s of speeds" 
              class="speed-item" 
              [class.active]="currentSpeed === s"
              (click)="setSpeed(s)"
            >
              {{ s }}x
            </div>
          </div>
        </div>

        <!-- Loop Button -->
        <button class="control-btn hidden-mobile" [class.active]="isLooping" (click)="toggleLoop()">
          <svg fill="currentColor" width="20" height="20" viewBox="0 0 24 24">
            <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
          </svg>
        </button>

        <!-- Rewind 10s -->
        <button class="control-btn" (click)="rewind(10)">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6" />
            <text x="12" y="15" font-family="Arial, sans-serif" font-size="6.5" font-weight="bold" text-anchor="middle" fill="currentColor" stroke-width="0">10</text>
          </svg>
        </button>

        <button class="play-btn-large" (click)="togglePlay()">
          <!-- Play Icon -->
          <svg *ngIf="!isPlaying" width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M8 5v14l11-7z"/>
          </svg>
          <!-- Pause Icon -->
          <svg *ngIf="isPlaying" width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        </button>

        <!-- Forward 10s -->
        <button class="control-btn" (click)="forward(10)">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6" />
            <text x="12" y="15" font-family="Arial, sans-serif" font-size="6.5" font-weight="bold" text-anchor="middle" fill="currentColor" stroke-width="0">10</text>
          </svg>
        </button>

        <!-- Settings Gear -->
        <button class="control-btn">
          <svg fill="currentColor" width="22" height="22" viewBox="0 0 24 24">
            <path d="M19.43 12.98c.04-.32.07-.64.07-.98 0-.34-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98 0 .33.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
          </svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .audio-player-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 16px;
      background: var(--bg-white, #ffffff);
      border-radius: 16px;
      border: 1px solid var(--border-light, #eaeaea);
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
      width: 100%;
    }

    .player-info {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 180px;
    }

    .cover-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #624479; /* Purple matches effortless english theme */
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow: hidden;
    }

    .title {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
      color: var(--text-primary, #111);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .subtitle {
      margin: 0;
      font-size: 12px;
      font-weight: 400;
      color: var(--text-secondary, #666);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .control-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      color: var(--text-muted, #999);
      background: transparent;
      border: none;
      transition: var(--transition, 0.2s ease);
      cursor: pointer;
      flex-shrink: 0;

      &:hover {
        color: var(--text-primary, #111);
      }

      &.active {
        color: #ff2d55; /* Highlight active loop */
      }
    }

    .progress-container {
      flex: 1;
      display: flex;
      align-items: center;
      padding: 0 8px;
    }

    .progress-bar {
      width: 100%;
      height: 24px;
      display: flex;
      align-items: center;
      cursor: pointer;
    }

    .progress-track {
      width: 100%;
      height: 6px;
      background: #ffe3e8; /* Light red track */
      border-radius: 3px;
      position: relative;
    }

    .progress-fill {
      height: 100%;
      background: #ff2d55; /* Vibrant red */
      border-radius: 3px;
      transition: width 0.1s linear;
      position: absolute;
      top: 0;
      left: 0;
    }

    .progress-thumb {
      width: 16px;
      height: 16px;
      background: #ff2d55;
      border-radius: 50%;
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      box-shadow: 0 2px 4px rgba(255, 45, 85, 0.3);
      transition: left 0.1s linear;
      pointer-events: none;
    }

    .progress-bar:hover .progress-thumb {
      transform: translate(-50%, -50%) scale(1.15);
    }

    .time {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-muted, #999);
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
      width: 40px;
      text-align: right;
    }

    .player-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      position: relative;
    }

    .speed-control {
      position: relative;
    }

    .speed-btn {
      min-width: 48px;
      height: 32px;
      padding: 0 8px;
      border-radius: var(--radius-sm, 6px);
      background: var(--bg-gray, #f5f5f5);
      font-size: 13px;
      font-weight: 700;
      color: var(--text-primary, #111);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid var(--border-light, #eee);

      &:hover {
        background: var(--border-color, #e0e0e0);
        transform: translateY(-1px);
      }
    }

    .speed-menu {
      position: absolute;
      bottom: calc(100% + 12px);
      right: 0;
      background: var(--bg-white, #fff);
      border: 1px solid var(--border-light, #eee);
      border-radius: var(--radius-md, 10px);
      box-shadow: var(--shadow-lg);
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      z-index: 1000;
      min-width: 70px;
      animation: slideUp 0.2s cubic-bezier(0, 0, 0.2, 1);
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .speed-item {
      padding: 8px 12px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary, #666);
      border-radius: var(--radius-sm, 6px);
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;

      &:hover {
        background: var(--primary-light);
        color: var(--primary);
      }

      &.active {
        background: var(--primary);
        color: white;
      }
    }

    .play-btn-large {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #000;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      cursor: pointer;
      transition: all 0.2s ease;
      margin: 0 4px;

      &:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 10px rgba(0,0,0,0.15);
      }
      
      &:active {
        transform: scale(0.95);
      }
    }

    @media (max-width: 768px) {
      .audio-player-card {
        flex-wrap: wrap;
        padding: 16px;
        gap: 12px 8px;
      }
      .player-info {
        width: 100%;
        margin-bottom: 4px;
      }
      .progress-container {
        order: 2;
        /* Flex to take remaining space aside from time */
        width: calc(100% - 56px);
      }
      .time {
        order: 2;
        width: 44px;
        text-align: right;
      }
      .player-actions {
        order: 3;
        width: 100%;
        justify-content: center;
        gap: 16px;
        margin-top: 12px;
      }
      .hidden-mobile {
        display: none !important;
      }
    }
  `]
})
export class AudioPlayerComponent implements OnChanges, OnDestroy {
  @Input() audioUrl: string = '';
  @Input() title: string = 'Effortless Audio';
  @Input() subtitle: string = 'Unknown Track';
  @Output() timeUpdate = new EventEmitter<number>();
  @Output() onPlay = new EventEmitter<void>();
  @Output() onPause = new EventEmitter<void>();
  @ViewChild('audioElement') audioRef!: ElementRef<HTMLAudioElement>;

  isPlaying = false;
  isLooping = false;
  currentTime = '0:00';
  duration = '0:00';
  progress = 0;

  // Playback Speed
  currentSpeed = 1.0;
  showSpeedMenu = false;
  speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['audioUrl'] && !changes['audioUrl'].firstChange) {
      this.currentTime = '0:00';
      this.progress = 0;
      if (this.audioRef?.nativeElement) {
        this.audioRef.nativeElement.load();
        // If it was already playing or we want to force start
        if (this.isPlaying) {
          this.play();
        }
      }
    }
  }

  play() {
    const audio = this.audioRef?.nativeElement;
    if (audio) {
      audio.play().then(() => {
        this.isPlaying = true;
      }).catch(e => {
        console.warn('Autoplay prevented by browser', e);
        this.isPlaying = false;
      });
    }
  }

  ngOnDestroy() {
    if (this.audioRef?.nativeElement) {
      this.audioRef.nativeElement.pause();
    }
    document.removeEventListener('click', this.closeSpeedMenu);
  }

  toggleSpeedMenu(event: MouseEvent) {
    event.stopPropagation();
    this.showSpeedMenu = !this.showSpeedMenu;
    if (this.showSpeedMenu) {
      document.addEventListener('click', this.closeSpeedMenu);
    } else {
      document.removeEventListener('click', this.closeSpeedMenu);
    }
  }

  closeSpeedMenu = () => {
    this.showSpeedMenu = false;
    document.removeEventListener('click', this.closeSpeedMenu);
  };

  setSpeed(speed: number) {
    this.currentSpeed = speed;
    if (this.audioRef?.nativeElement) {
      this.audioRef.nativeElement.playbackRate = speed;
    }
    this.showSpeedMenu = false;
    document.removeEventListener('click', this.closeSpeedMenu);
  }

  togglePlay() {
    const audio = this.audioRef.nativeElement;
    if (audio.paused) {
      audio.play().catch(e => console.error('Audio play failed', e));
      this.isPlaying = true;
      this.onPlay.emit();
    } else {
      audio.pause();
      this.isPlaying = false;
      this.onPause.emit();
    }
  }

  toggleLoop() {
    this.isLooping = !this.isLooping;
    this.audioRef.nativeElement.loop = this.isLooping;
  }

  forward(seconds: number) {
    const audio = this.audioRef.nativeElement;
    if (audio) {
      audio.currentTime = Math.min(audio.currentTime + seconds, audio.duration || 0);
    }
  }

  rewind(seconds: number) {
    const audio = this.audioRef.nativeElement;
    if (audio) {
      audio.currentTime = Math.max(audio.currentTime - seconds, 0);
    }
  }

  seek(event: MouseEvent) {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    const audio = this.audioRef.nativeElement;

    if (audio.duration) {
      audio.currentTime = percent * audio.duration;
      this.progress = percent * 100;
    }
  }

  seekToTime(seconds: number) {
    const audio = this.audioRef.nativeElement;
    if (audio) {
      audio.currentTime = seconds;
      if (audio.paused) {
        this.togglePlay();
      }
    }
  }

  onTimeUpdate() {
    const audio = this.audioRef.nativeElement;
    this.progress = (audio.currentTime / audio.duration) * 100 || 0;
    this.currentTime = this.formatTime(audio.currentTime);
    this.timeUpdate.emit(audio.currentTime);
  }

  onLoadedMetadata() {
    const audio = this.audioRef.nativeElement;
    this.duration = this.formatTime(audio.duration);
    audio.loop = this.isLooping;
    audio.playbackRate = this.currentSpeed;
  }

  onEnded() {
    if (!this.isLooping) {
      this.isPlaying = false;
      this.progress = 0;
      this.onPause.emit();
      if (this.audioRef?.nativeElement) {
        this.audioRef.nativeElement.currentTime = 0;
      }
    }
  }

  private formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }
}
