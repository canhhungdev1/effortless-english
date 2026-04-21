import { Component, signal, HostListener, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { NotificationService } from '../../../core/services/notification.service';
import { LUCIDE_ICONS } from '../../../core/constants/icons.constants';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import WaveSurfer from 'wavesurfer.js';

interface VttLine {
  text: string;
  start?: number;
  end?: number;
}

@Component({
  selector: 'app-admin-vtt-creator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="vtt-creator-container">
      <div class="header">
        <div class="header-content">
          <h2 class="title"><span class="icon-vtt" [innerHTML]="icons.WAND"></span> VTT Sync Studio Pro</h2>
          <p class="subtitle">Precision subtitle synchronization with integrated waveform analysis.</p>
        </div>
        <div class="header-badges">
           <span class="badge" [class.active]="step() === 1">1. Config</span>
           <span class="badge" [class.active]="step() === 2">2. Review</span>
           <span class="badge" [class.active]="step() === 3">3. Studio</span>
        </div>
      </div>

      <!-- Step 1: Input Configuration -->
      <div class="card fade-in" *ngIf="step() === 1">
        <div class="section-title">
           <span class="icon-small" [innerHTML]="icons.ZAP"></span>
           Basic Configuration
        </div>
        
        <div class="form-grid">
          <div class="form-group">
            <label>Audio Source</label>
            <div class="audio-input-group">
              <input type="text" [(ngModel)]="audioUrl" placeholder="Audio URL or select local file...">
              <input type="file" #fileInput (change)="onFileSelected($event)" accept="audio/*" style="display: none">
              <button type="button" class="select-file-btn" (click)="fileInput.click()">
                 <span class="btn-icon" [innerHTML]="icons.FILE"></span> Choose File
              </button>
            </div>
            <small class="hint">Recommended: Select the local audio file for faster syncing.</small>
          </div>

          <div class="form-group">
            <label>Target Local Directory Path (Absolute Path)</label>
            <div class="path-input-group">
              <input type="text" [(ngModel)]="targetPath" placeholder="e.g., D:/EffortlessEnglish/DayOfTheDead/">
            </div>
            <small class="hint">
              <strong>Tip:</strong> Open the folder in Windows Explorer, copy the address path.
            </small>
          </div>
        </div>

        <div class="form-group">
          <label>Transcript (Plain Text)</label>
          <textarea [(ngModel)]="rawText" rows="8" placeholder="Paste your English text transcript here..."></textarea>
        </div>

        <div class="actions">
          <button class="primary-btn" [disabled]="!rawText || !audioUrl || !targetPath" (click)="goToStep2()">
            Review Sentence Breaks <span class="btn-icon-right" [innerHTML]="icons.SKIP_FORWARD"></span>
          </button>
        </div>
      </div>

      <!-- Quick Tips Section -->
      <div class="guide-grid" *ngIf="step() === 1">
        <div class="guide-card">
          <div class="guide-title"><span [innerHTML]="icons.LIST"></span> 1. Prepare</div>
          <p>Paste text and set save path. Use <b>/</b> in paths (e.g., <code>D:/Courses/</code>).</p>
        </div>
        <div class="guide-card">
          <div class="guide-title"><span [innerHTML]="icons.WAND"></span> 2. Split</div>
          <p>Each block is one subtitle line. Use Enter to split long sentences.</p>
        </div>
        <div class="guide-card">
          <div class="guide-title"><span [innerHTML]="icons.PLAY"></span> 3. Sync</div>
          <p>Press <b>Spacebar</b> every time a sentence ends. The waveform helps you see silence.</p>
        </div>
      </div>

      <!-- Step 2: Line Preview & Editing -->
      <div class="card fade-in" *ngIf="step() === 2">
        <div class="section-title">
           <span class="icon-small" [innerHTML]="icons.LIST"></span>
           Step 2: Review Sentence Breaks
        </div>
        <p class="instructions">Each block below will appear as one subtitle line. You can manually edit or merge them.</p>
        
        <div class="lines-preview">
          <div *ngFor="let line of lines; let i = index" class="line-item">
            <span class="line-num">{{ i + 1 }}</span>
            <textarea [(ngModel)]="line.text" rows="2"></textarea>
            <button class="remove-btn" (click)="removeLine(i)" title="Remove line" [innerHTML]="icons.TRASH"></button>
          </div>
        </div>

        <div class="actions">
          <button class="secondary-btn" (click)="step.set(1)">
             <span class="btn-icon" [innerHTML]="icons.SKIP_BACK"></span> Back
          </button>
          <button class="primary-btn" (click)="startSync()">
             Enter Studio <span class="btn-icon-right" [innerHTML]="icons.WAND"></span>
          </button>
        </div>
      </div>

      <!-- Step 3: Synchronization Studio -->
      <div class="card studio-card fade-in" *ngIf="step() === 3">
        <div class="studio-layout">
          <div class="studio-main">
            <!-- Waveform Container -->
            <div class="waveform-outer">
               <div id="waveform" #waveformContainer></div>
               <div class="waveform-controls">
                  <div class="playback-btns">
                    <button class="icon-btn" (click)="rewind()" title="Rewind 3s" [innerHTML]="icons.SKIP_BACK"></button>
                    <button class="play-pause-btn" (click)="togglePlay()" [title]="isPlaying() ? 'Pause' : 'Play'">
                       <span [innerHTML]="isPlaying() ? icons.PAUSE : icons.PLAY"></span>
                    </button>
                    <button class="icon-btn" (click)="forward()" title="Forward 3s" [innerHTML]="icons.SKIP_FORWARD"></button>
                  </div>
                  <div class="zoom-controls">
                     <span class="zoom-label">Zoom</span>
                     <input type="range" min="10" max="500" value="100" (input)="onZoomChange($event)">
                  </div>
                  <div class="time-display">{{ currentTimeFormatted() }} / {{ totalTimeFormatted() }}</div>
               </div>
            </div>

            <div class="lines-sync-list" #linesList>
              <div *ngFor="let line of lines; let i = index" 
                   class="sync-item" 
                   [id]="'line-' + i"
                   [class.active]="i === currentLineIndex()"
                   [class.completed]="i < currentLineIndex()">
                <div class="sync-info">
                  <span class="sync-num">{{ i + 1 }}</span>
                  <div class="sync-text">{{ line.text }}</div>
                </div>
                <div class="sync-footer" *ngIf="line.start !== undefined">
                   <span class="sync-badge">
                      <span class="icon-xxs" [innerHTML]="icons.CLOCK"></span>
                      {{ formatTime(line.start) }}
                   </span>
                   <span class="sync-separator"></span>
                   <span class="sync-badge" [class.incomplete]="!line.end">
                      <span class="icon-xxs" [innerHTML]="icons.CHECK"></span>
                      {{ line.end ? formatTime(line.end) : '--:--:--' }}
                   </span>
                </div>
              </div>
            </div>
          </div>

          <div class="studio-sidebar">
             <div class="sidebar-scroll-content">
               <div class="progress-box">
                  <div class="progress-header">
                    <span class="progress-label">Sync Progress</span>
                    <span class="progress-pct">{{ lines.length > 0 ? Math.round((currentLineIndex() / lines.length) * 100) : 0 }}%</span>
                  </div>
                  <div class="progress-val">{{ currentLineIndex() }} / {{ lines.length }}</div>
                  <div class="progress-bar">
                    <div class="fill" [style.width.%]="lines.length > 0 ? (currentLineIndex() / lines.length) * 100 : 0"></div>
                  </div>
               </div>

               <div class="sync-controls">
                  <button class="mark-btn" 
                          [class.pulse]="isPlaying() && currentLineIndex() < lines.length"
                          (click)="markNext()" 
                          [disabled]="currentLineIndex() >= lines.length">
                     {{ currentLineIndex() >= lines.length ? 'ALL SYNCED ✓' : 'MARK END (Space)' }}
                  </button>
                  
                  <div class="secondary-actions">
                     <button class="action-btn" (click)="undoMark()" [disabled]="currentLineIndex() === 0">
                        <span class="action-icon" [innerHTML]="icons.UNDO"></span> Undo Last
                     </button>
                     <button class="action-btn danger" (click)="resetSync()">
                        <span class="action-icon" [innerHTML]="icons.TRASH"></span> Full Reset
                     </button>
                  </div>
               </div>
               
               <div class="shortcuts-help">
                  <div class="help-title">Controls</div>
                  <div class="shortcut"><kbd>Space</kbd> <span>Mark / Pause</span></div>
                  <div class="shortcut"><kbd>←</kbd> <kbd>→</kbd> <span>Seek 3s</span></div>
               </div>
             </div>

             <div class="final-actions">
                <button class="save-btn" (click)="saveVtt()" [disabled]="isSaving() || currentLineIndex() < lines.length">
                   <span class="save-icon" [innerHTML]="icons.SAVE"></span>
                   {{ isSaving() ? 'Saving...' : 'SAVE VTT FILE' }}
                </button>
                <div class="save-info" *ngIf="currentLineIndex() < lines.length">
                   Mark all sentences to enable saving.
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { --primary: #3b82f6; --primary-dark: #2563eb; --success: #10b981; --danger: #ef4444; --bg: #f8fafc; --text-main: #1e293b; --text-sub: #64748b; --border: #e2e8f0; }
    .vtt-creator-container { max-width: 1300px; margin: 0 auto; padding: 24px; font-family: 'Inter', sans-serif; color: var(--text-main); }
    
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .title { font-size: 26px; font-weight: 850; color: var(--text-main); margin: 0; display: flex; align-items: center; gap: 12px; }
    .subtitle { color: var(--text-sub); font-size: 14px; margin: 4px 0 0 0; }
    .header-badges { display: flex; gap: 8px; }
    .badge { padding: 6px 12px; background: #fff; border: 1px solid var(--border); border-radius: 20px; font-size: 12px; font-weight: 600; color: var(--text-sub); transition: all 0.3s; }
    .badge.active { background: var(--primary); color: #fff; border-color: var(--primary); box-shadow: 0 4px 10px rgba(59, 131, 246, 0.2); }

    .card { background: white; border-radius: 20px; border: 1px solid var(--border); padding: 28px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.04); }
    .section-title { font-size: 17px; font-weight: 800; color: var(--text-main); margin-bottom: 24px; display: flex; align-items: center; gap: 10px; }
    
    .guide-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 20px; }
    .guide-card { background: #fff; border: 1px solid var(--border); border-radius: 16px; padding: 16px; }
    .guide-title { font-weight: 750; font-size: 14px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; color: var(--primary); }
    .guide-card p { font-size: 13px; color: var(--text-sub); margin: 0; line-height: 1.5; }

    .form-group { margin-bottom: 20px; }
    .form-group label { display: block; font-weight: 700; color: #475569; margin-bottom: 6px; font-size: 13px; }
    .form-group input, .form-group textarea { width: 100%; padding: 12px 14px; border: 1.5px solid var(--border); border-radius: 12px; font-size: 14px; outline: none; transition: all 0.2s; background: #fcfcfc; }
    .form-group input:focus, .form-group textarea:focus { border-color: var(--primary); background: #fff; box-shadow: 0 0 0 4px rgba(59, 131, 246, 0.05); }
    .hint { display: block; margin-top: 6px; color: var(--text-sub); font-size: 11px; }

    .audio-input-group { display: flex; gap: 10px; }
    .select-file-btn { background: #f1f5f9; color: #475569; border: 1.5px solid var(--border); padding: 0 16px; border-radius: 12px; font-weight: 700; font-size: 13px; cursor: pointer; white-space: nowrap; display: flex; align-items: center; gap: 8px; &:hover { background: #e2e8f0; } }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

    .lines-preview { max-height: 400px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; padding: 12px; background: #f8fafc; border-radius: 16px; border: 1px solid var(--border); }
    .line-item { display: flex; gap: 12px; align-items: flex-start; background: #fff; padding: 10px; border-radius: 12px; border: 1px solid var(--border); }
    .line-num { width: 24px; height: 24px; background: #f1f5f9; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: var(--text-sub); flex-shrink: 0; margin-top: 8px; }
    .line-item textarea { flex: 1; min-height: 50px; resize: none; padding: 8px; border: none; font-size: 14px; background: transparent; }
    .remove-btn { color: #94a3b8; border: none; background: none; cursor: pointer; padding: 8px; border-radius: 8px; &:hover { color: var(--danger); background: #fee2e2; } }

    .actions { display: flex; gap: 12px; justify-content: flex-end; }
    .primary-btn { background: var(--primary); color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 750; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 10px; &:hover { background: var(--primary-dark); transform: translateY(-1px); box-shadow: 0 10px 15px -3px rgba(59, 131, 246, 0.2); } &:disabled { opacity: 0.5; cursor: not-allowed; } }
    .secondary-btn { background: white; color: #475569; border: 1.5px solid var(--border); padding: 12px 24px; border-radius: 12px; font-weight: 750; cursor: pointer; display: flex; align-items: center; gap: 8px; &:hover { background: #f8fafc; border-color: #cbd5e1; } }

    /* Studio Layout */
    .studio-card { padding: 0; overflow: hidden; }
    .studio-layout { display: grid; grid-template-columns: 1fr 340px; height: calc(100vh - 220px); min-height: 550px; }
    .studio-main { padding: 0; display: flex; flex-direction: column; border-right: 1px solid var(--border); overflow: hidden; background: #fff; }
    
    /* Improved Waveform Area */
    .waveform-outer { padding: 24px; background: #0f172a; color: #fff; }
    #waveform { width: 100%; height: 128px; background: rgba(255,255,255,0.02); border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); }
    .waveform-controls { display: flex; align-items: center; justify-content: space-between; margin-top: 16px; padding: 0 4px; }
    .playback-btns { display: flex; align-items: center; gap: 12px; }
    .play-pause-btn { width: 44px; height: 44px; border-radius: 50%; background: var(--primary); color: #fff; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; &:hover { transform: scale(1.1); background: #60a5fa; } }
    .icon-btn { background: rgba(255,255,255,0.1); border: none; color: #fff; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; &:hover { background: rgba(255,255,255,0.2); } }
    .zoom-controls { display: flex; align-items: center; gap: 12px; }
    .zoom-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
    .zoom-controls input { width: 100px; accent-color: var(--primary); }
    .time-display { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #94a3b8; }

    .lines-sync-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; padding: 0; background: #f1f5f9; }
    .sync-item { padding: 18px 24px; background: #fff; border-bottom: 1px solid var(--border); transition: all 0.3s; position: relative; }
    .sync-item.active { background: #eff6ff; border-left: 4px solid var(--primary); z-index: 10; scroll-margin: 100px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .sync-item.completed { background: #fcfcfc; }
    .sync-item.completed .sync-text { color: var(--text-sub); }
    
    .sync-info { display: flex; gap: 16px; margin-bottom: 4px; }
    .sync-num { font-weight: 850; color: #cbd5e1; font-size: 12px; width: 20px; }
    .sync-text { font-size: 15px; color: var(--text-main); font-weight: 550; flex: 1; line-height: 1.4; }
    
    .sync-footer { display: flex; align-items: center; gap: 12px; margin-left: 36px; margin-top: 8px; }
    .sync-badge { display: flex; align-items: center; gap: 6px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--primary); background: #eff6ff; padding: 2px 8px; border-radius: 6px; }
    .sync-badge.incomplete { color: #94a3b8; background: #f1f5f9; }
    .sync-separator { width: 1px; height: 10px; background: var(--border); }

    .studio-sidebar { background: #f8fafc; display: flex; flex-direction: column; }
    .sidebar-scroll-content { flex: 1; overflow-y: auto; padding: 28px; display: flex; flex-direction: column; gap: 28px; }
    
    .progress-box { background: #fff; padding: 20px; border-radius: 16px; border: 1px solid var(--border); }
    .progress-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 8px; }
    .progress-label { font-size: 11px; color: var(--text-sub); font-weight: 800; text-transform: uppercase; }
    .progress-pct { font-size: 12px; font-weight: 800; color: var(--primary); }
    .progress-val { font-size: 26px; font-weight: 900; color: var(--text-main); margin-bottom: 12px; letter-spacing: -1px; }
    .progress-bar { height: 8px; background: #f1f5f9; border-radius: 10px; overflow: hidden; }
    .progress-bar .fill { height: 100%; background: var(--primary); transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }

    .sync-controls { display: flex; flex-direction: column; gap: 16px; }
    .mark-btn { background: var(--text-main); color: white; border: none; padding: 22px; border-radius: 16px; font-size: 16px; font-weight: 800; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 12px rgba(30, 41, 59, 0.2); &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(30, 41, 59, 0.3); } &:active { transform: translateY(0); } &:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; } }
    .mark-btn.pulse { animation: pulse-shadow 1.5s infinite; }
    @keyframes pulse-shadow { 0% { box-shadow: 0 0 0 0 rgba(30, 41, 59, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(30, 41, 59, 0); } 100% { box-shadow: 0 0 0 0 rgba(30, 41, 59, 0); } }

    .secondary-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .action-btn { background: #fff; border: 1px solid var(--border); color: var(--text-sub); padding: 10px; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s; &:hover:not(:disabled) { background: #f8fafc; color: var(--text-main); border-color: #cbd5e1; } &:disabled { opacity: 0.5; cursor: not-allowed; } }
    .action-btn.danger:hover { color: var(--danger); border-color: #fecaca; background: #fff1f1; }

    .shortcuts-help { padding-top: 10px; border-top: 1px dashed var(--border); }
    .help-title { font-size: 11px; font-weight: 800; color: var(--text-sub); text-transform: uppercase; margin-bottom: 12px; }
    .shortcut { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px; color: #475569; }
    .shortcut kbd { background: #f1f5f9; padding: 2px 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-family: monospace; font-weight: 700; font-size: 10px; box-shadow: 0 1px 0 rgba(0,0,0,0.1); }

    .final-actions { padding: 24px 28px; background: white; border-top: 1px solid var(--border); }
    .save-btn { background: var(--success); color: white; border: none; padding: 18px; border-radius: 14px; width: 100%; font-size: 16px; font-weight: 850; cursor: pointer; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 10px; &:hover:not(:disabled) { background: #059669; transform: scale(1.02); box-shadow: 0 8px 15px rgba(16, 185, 129, 0.3); } &:disabled { background: #cbd5e1; box-shadow: none; cursor: not-allowed; } }
    .save-info { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 10px; font-weight: 500; }
    
    .fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .icon-vtt { width: 32px; height: 32px; color: var(--primary); }
    .icon-small { width: 20px; height: 20px; color: var(--primary); }
    .icon-xxs { width: 12px; height: 12px; }
    .btn-icon, .btn-icon-right { width: 18px; height: 18px; }
    .action-icon { width: 16px; height: 16px; }
    .save-icon { width: 20px; height: 20px; }
  `]
})
export class AdminVttCreatorComponent implements AfterViewInit, OnDestroy {
  step = signal(1);
  rawText = '';
  audioUrl = '';
  targetPath = '';
  lines: VttLine[] = [];
  currentLineIndex = signal(0);
  isSaving = signal(false);
  isPlaying = signal(false);
  
  // Real-time audio stats
  currentTimeFormatted = signal('00:00:00');
  totalTimeFormatted = signal('00:00:00');

  // Icons and Math
  icons: any = {};
  Math = Math;

  private wavesurfer?: WaveSurfer;
  @ViewChild('waveformContainer') waveformContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('linesList') linesList?: ElementRef<HTMLDivElement>;

  constructor(
    private http: HttpClient, 
    private notification: NotificationService,
    private sanitizer: DomSanitizer
  ) {
    // Sanitize all icons
    Object.keys(LUCIDE_ICONS).forEach(key => {
      this.icons[key] = this.sanitizer.bypassSecurityTrustHtml((LUCIDE_ICONS as any)[key]);
    });

    // Try to restore last used path
    const savedPath = localStorage.getItem('vtt_last_path');
    if (savedPath) this.targetPath = savedPath;
  }

  ngAfterViewInit() {
    if (this.step() === 3) {
      this.initWaveSurfer();
    }
  }

  ngOnDestroy() {
    this.destroyWaveSurfer();
  }

  private initWaveSurfer() {
    if (!this.waveformContainer) return;

    this.wavesurfer = WaveSurfer.create({
      container: this.waveformContainer.nativeElement,
      waveColor: '#334155',
      progressColor: '#3b82f6',
      cursorColor: '#fff',
      cursorWidth: 2,
      barWidth: 2,
      barGap: 3,
      barRadius: 2,
      height: 128,
      normalize: true,
      minPxPerSec: 100,
    });

    this.wavesurfer.load(this.audioUrl);

    this.wavesurfer.on('play', () => this.isPlaying.set(true));
    this.wavesurfer.on('pause', () => this.isPlaying.set(false));
    
    this.wavesurfer.on('timeupdate', (currentTime) => {
      this.currentTimeFormatted.set(this.formatTimePadded(currentTime));
    });

    this.wavesurfer.on('ready', (duration) => {
      this.totalTimeFormatted.set(this.formatTimePadded(duration));
    });

    this.wavesurfer.on('finish', () => this.isPlaying.set(false));
  }

  private destroyWaveSurfer() {
    if (this.wavesurfer) {
      this.wavesurfer.destroy();
      this.wavesurfer = undefined;
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.audioUrl = URL.createObjectURL(file);
      this.notification.show('Audio loaded: ' + file.name);
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (this.step() !== 3) return;

    if (event.code === 'Space') {
      event.preventDefault();
      if (this.currentLineIndex() < this.lines.length) {
        this.markNext();
      } else {
        this.togglePlay();
      }
    } else if (event.code === 'ArrowLeft') {
      this.rewind();
    } else if (event.code === 'ArrowRight') {
      this.forward();
    }
  }

  goToStep2() {
    if (!this.rawText) return;
    
    const sentences = this.rawText
      .split(/\n+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    this.lines = sentences.map(text => ({ text }));
    this.step.set(2);
    localStorage.setItem('vtt_last_path', this.targetPath);
    
    // Auto-restore previous progress if matching transcript
    this.restoreProgress();
  }

  startSync() {
    this.step.set(3);
    setTimeout(() => {
      this.initWaveSurfer();
      if (this.lines.length > 0 && this.currentLineIndex() === 0) {
        this.lines[0].start = 0;
      }
    }, 100);
  }

  // WaveSurfer Actions
  togglePlay() {
    this.wavesurfer?.playPause();
  }

  rewind() {
    if (!this.wavesurfer) return;
    this.wavesurfer.setTime(Math.max(0, this.wavesurfer.getCurrentTime() - 3));
  }

  forward() {
    if (!this.wavesurfer) return;
    this.wavesurfer.setTime(Math.min(this.wavesurfer.getDuration(), this.wavesurfer.getCurrentTime() + 3));
  }

  onZoomChange(event: any) {
    this.wavesurfer?.zoom(Number(event.target.value));
  }

  markNext() {
    if (!this.wavesurfer || this.currentLineIndex() >= this.lines.length) return;
    
    const time = this.wavesurfer.getCurrentTime();
    const index = this.currentLineIndex();

    this.lines[index].end = time;
    
    const nextIndex = index + 1;
    if (nextIndex < this.lines.length) {
      this.lines[nextIndex].start = time;
      this.currentLineIndex.set(nextIndex);
      this.scrollToActive();
      this.saveToLocal();
    } else {
      this.currentLineIndex.set(this.lines.length);
      this.wavesurfer.pause();
      this.saveToLocal();
    }
  }

  undoMark() {
    const currentIndex = this.currentLineIndex();
    if (currentIndex === 0) return;

    const prevIndex = currentIndex - 1;
    delete this.lines[prevIndex].end;
    
    if (currentIndex < this.lines.length) {
      delete this.lines[currentIndex].start;
    }

    this.currentLineIndex.set(prevIndex);
    this.wavesurfer?.setTime(this.lines[prevIndex].start || 0);
    this.saveToLocal();
  }

  resetSync() {
    if (!confirm('Are you sure you want to reset all progress?')) return;
    this.lines.forEach(l => { delete l.start; delete l.end; });
    this.currentLineIndex.set(0);
    if (this.wavesurfer) {
      this.wavesurfer.setTime(0);
      this.wavesurfer.pause();
    }
    this.saveToLocal();
  }

  private saveToLocal() {
    const key = `vtt_progress_${this.audioUrl.substring(0, 50)}`;
    localStorage.setItem(key, JSON.stringify({
      index: this.currentLineIndex(),
      lines: this.lines
    }));
  }

  private restoreProgress() {
    const key = `vtt_progress_${this.audioUrl.substring(0, 50)}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const data = JSON.parse(saved);
      if (data.lines?.length === this.lines.length) {
        this.lines = data.lines;
        this.currentLineIndex.set(data.index);
        this.notification.show('Restored previous progress');
      }
    }
  }

  private scrollToActive() {
    setTimeout(() => {
      const activeEl = document.getElementById(`line-${this.currentLineIndex()}`);
      if (activeEl && this.linesList) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  }

  private formatTimePadded(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }

  generateVttContent(): string {
    let content = 'WEBVTT\n\n';
    this.lines.forEach(line => {
      if (line.start !== undefined && line.end !== undefined) {
        content += `${this.formatTime(line.start)} --> ${this.formatTime(line.end)}\n`;
        content += `${line.text}\n\n`;
      }
    });
    return content;
  }

  saveVtt() {
    const vttContent = this.generateVttContent();
    const fileName = `transcript_${Date.now()}.vtt`;
    
    this.isSaving.set(true);
    this.http.post(`${environment.apiUrl}/media/save-vtt-external`, {
      content: vttContent,
      targetPath: this.targetPath,
      fileName: fileName
    }).subscribe({
      next: (res: any) => {
        this.isSaving.set(false);
        this.notification.show(`Success! File saved to: ${res.path}`);
        
        // Clear progress after successful save
        const key = `vtt_progress_${this.audioUrl.substring(0, 50)}`;
        localStorage.removeItem(key);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.notification.show('Failed to save file. Check path permission.', 'error');
        console.error('Save error:', err);
      }
    });
  }

  removeLine(index: number) {
    this.lines.splice(index, 1);
  }
}
