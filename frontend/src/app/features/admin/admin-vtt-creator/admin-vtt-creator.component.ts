import { Component, signal, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { NotificationService } from '../../../core/services/notification.service';

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
        <h2 class="title">🎞️ VTT Sync Studio</h2>
        <p class="subtitle">Create synchronized subtitles for your lessons in minutes.</p>
      </div>

      <!-- Step 1: Input Configuration -->
      <div class="card" *ngIf="step() === 1">
        <div class="section-title">Step 1: Configuration</div>
        
        <div class="form-grid">
          <div class="form-group">
            <label>Audio Source</label>
            <div class="audio-input-group">
              <input type="text" [(ngModel)]="audioUrl" placeholder="Audio URL or select local file...">
              <input type="file" #fileInput (change)="onFileSelected($event)" accept="audio/*" style="display: none">
              <button type="button" class="select-file-btn" (click)="fileInput.click()">📁 Choose File</button>
            </div>
            <small class="hint">Recommended: Select the local audio file for faster syncing.</small>
          </div>

          <div class="form-group">
            <label>Target Local Directory Path (Absolute Path)</label>
            <div class="path-input-group">
              <input type="text" [(ngModel)]="targetPath" placeholder="e.g., D:/EffortlessEnglish/DayOfTheDead/">
            </div>
            <small class="hint">
              <strong>Tip:</strong> Open the folder in <b>Windows Explorer</b>, click the address bar, copy, and paste here.
            </small>
          </div>
        </div>

        <div class="form-group">
          <label>Transcript (Plain Text)</label>
          <textarea [(ngModel)]="rawText" rows="10" placeholder="Paste your English text transcript here..."></textarea>
        </div>

        <div class="actions">
          <button class="primary-btn" [disabled]="!rawText || !audioUrl || !targetPath" (click)="goToStep2()">
            Prepare Lines →
          </button>
        </div>
      </div>

      <!-- Quick Tips Section -->
      <div class="guide-card" *ngIf="step() === 1">
        <div class="guide-title">📖 Quick Start Guide</div>
        <div class="guide-steps">
          <div class="step-item">
            <span class="step-badge">1</span>
            <div class="step-content">
              <strong>Paste & Path:</strong> Dán nội dung bài học và điền đường dẫn thư mục lưu file (Ví dụ: <code>D:/English/Lesson1/</code>).
            </div>
          </div>
          <div class="step-item">
            <span class="step-badge">2</span>
            <div class="step-content">
              <strong>Review:</strong> Kiểm tra các ngắt câu. Bạn có thể nhấn Enter để chia nhỏ câu dài hoặc xóa bớt câu không cần thiết.
            </div>
          </div>
          <div class="step-item">
            <span class="step-badge">3</span>
            <div class="step-content">
              <strong>Sync:</strong> Nhấn Play Audio. Mỗi khi nghe hết một câu, nhấn phím <b>[Space]</b> để đánh dấu. Cực kỳ nhanh!
            </div>
          </div>
          <div class="step-item">
            <span class="step-badge">4</span>
            <div class="step-content">
              <strong>Save:</strong> Sau khi hoàn tất câu cuối, nút Save sẽ hiện ra để lưu file trực tiếp vào thư mục bạn đã chọn.
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Line Preview & Editing -->
      <div class="card" *ngIf="step() === 2">
        <div class="section-title">Step 2: Review Sentence Breaks</div>
        <p class="instructions">Each block below will appear as one subtitle line. Edit or combine them as needed.</p>
        
        <div class="lines-preview">
          <div *ngFor="let line of lines; let i = index" class="line-item">
            <span class="line-num">{{ i + 1 }}</span>
            <textarea [(ngModel)]="line.text" rows="2"></textarea>
            <button class="remove-btn" (click)="removeLine(i)" title="Remove line">×</button>
          </div>
        </div>

        <div class="actions">
          <button class="secondary-btn" (click)="step.set(1)">← Back</button>
          <button class="primary-btn" (click)="startSync()">Start Syncing Audio →</button>
        </div>
      </div>

      <!-- Step 3: Synchronization Studio -->
      <div class="card studio-card" *ngIf="step() === 3">
        <div class="studio-layout">
          <div class="studio-main">
            <div class="audio-control">
              <audio #audioPlayer [src]="audioUrl" controls class="w-100"></audio>
            </div>

            <div class="sync-instructions">
              <p>Press <strong>[SPACEBAR]</strong> or click <strong>"MARK END"</strong> when the current line finishes playing.</p>
            </div>

            <div class="lines-sync-list" #linesList>
              <div *ngFor="let line of lines; let i = index" 
                   class="sync-item" 
                   [class.active]="i === currentLineIndex()"
                   [class.completed]="i < currentLineIndex()">
                <div class="sync-info">
                  <span class="sync-num">{{ i + 1 }}</span>
                  <div class="sync-text">{{ line.text }}</div>
                </div>
                <div class="sync-times" *ngIf="line.start !== undefined">
                  {{ formatTime(line.start) }} → {{ line.end ? formatTime(line.end) : '...' }}
                </div>
              </div>
            </div>
          </div>

          <div class="studio-sidebar">
             <div class="sidebar-scroll-content">
               <div class="progress-box">
                  <div class="progress-label">Progress</div>
                  <div class="progress-val">{{ currentLineIndex() }} / {{ lines.length }}</div>
                  <div class="progress-bar">
                    <div class="fill" [style.width.%]="(currentLineIndex() / lines.length) * 100"></div>
                  </div>
               </div>

               <div class="sync-controls">
                  <button class="mark-btn" (click)="markNext()" [disabled]="currentLineIndex() >= lines.length">
                     {{ currentLineIndex() >= lines.length ? 'COMPLETED' : 'MARK END (Space)' }}
                  </button>
                  <button class="reset-btn" (click)="resetSync()">Reset Progress</button>
               </div>
             </div>

             <div class="final-actions">
                <button class="save-btn" (click)="saveVtt()" [disabled]="isSaving() || currentLineIndex() < lines.length">
                   {{ isSaving() ? 'Saving...' : '💾 SAVE VTT FILE' }}
                </button>
                <p class="save-hint" *ngIf="currentLineIndex() < lines.length">Finish marking all lines to save.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .vtt-creator-container { max-width: 1200px; margin: 0 auto; padding: 20px; font-family: 'Inter', sans-serif; }
    .header { margin-bottom: 32px; }
    .title { font-size: 28px; font-weight: 800; color: #1e293b; margin-bottom: 8px; }
    .subtitle { color: #64748b; font-size: 16px; }

    .card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .section-title { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 2px solid #f1f5f9; }

    .form-group { margin-bottom: 24px; }
    .form-group label { display: block; font-weight: 600; color: #475569; margin-bottom: 8px; font-size: 14px; }
    .form-group input, .form-group textarea { width: 100%; padding: 12px 16px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 15px; outline: none; transition: border-color 0.2s; }
    .form-group input:focus, .form-group textarea:focus { border-color: #3b82f6; }
    .hint { display: block; margin-top: 6px; color: #94a3b8; font-size: 12px; }

    .audio-input-group, .path-input-group { display: flex; gap: 10px; }
    .select-file-btn { background: #f1f5f9; color: #475569; border: 1.5px solid #e2e8f0; padding: 0 16px; border-radius: 10px; font-weight: 600; font-size: 13px; cursor: pointer; white-space: nowrap; &:hover { background: #e2e8f0; } }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }

    .guide-card { margin-top: 24px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 16px; padding: 24px; }
    .guide-title { font-weight: 700; color: #0369a1; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .guide-steps { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .step-item { display: flex; gap: 12px; }
    .step-badge { width: 22px; height: 22px; background: #0369a1; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    .step-content { font-size: 13px; color: #0c4a6e; line-height: 1.5; }

    .instructions { color: #64748b; margin-bottom: 20px; font-size: 14px; }
    .lines-preview { max-height: 500px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; padding: 12px; background: #f8fafc; border-radius: 12px; }
    .line-item { display: flex; gap: 12px; align-items: flex-start; }
    .line-num { width: 30px; height: 30px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #475569; flex-shrink: 0; margin-top: 8px; }
    .line-item textarea { flex: 1; min-height: 60px; resize: vertical; padding: 8px 12px; border-radius: 8px; font-size: 14px; }
    .remove-btn { color: #94a3b8; font-size: 24px; border: none; background: none; cursor: pointer; padding: 4px 8px; &:hover { color: #ef4444; } }

    .actions { display: flex; gap: 16px; justify-content: flex-end; }
    .primary-btn { background: #3b82f6; color: white; border: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s; &:hover { background: #2563eb; transform: translateY(-1px); } &:disabled { opacity: 0.5; cursor: not-allowed; } }
    .secondary-btn { background: white; color: #475569; border: 1.5px solid #e2e8f0; padding: 12px 28px; border-radius: 10px; font-weight: 600; cursor: pointer; &:hover { background: #f8fafc; } }

    /* Studio Layout */
    .studio-card { padding: 0; overflow: hidden; margin-top: -10px; }
    .studio-layout { display: grid; grid-template-columns: 1fr 340px; height: calc(100vh - 280px); min-height: 600px; }
    .studio-main { padding: 32px; display: flex; flex-direction: column; gap: 20px; border-right: 1px solid #e2e8f0; overflow: hidden; }
    .studio-sidebar { 
      background: #f8fafc; 
      display: flex; 
      flex-direction: column; 
      position: relative;
    }
    
    .sidebar-scroll-content {
      flex: 1;
      overflow-y: auto;
      padding: 32px;
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .final-actions {
      padding: 24px 32px;
      background: white;
      border-top: 1px solid #e2e8f0;
      box-shadow: 0 -4px 12px rgba(0,0,0,0.03);
      position: sticky;
      bottom: 0;
    }

    .audio-control { background: #f1f5f9; padding: 16px; border-radius: 12px; }
    .w-100 { width: 100%; }
    .sync-instructions { font-size: 13px; color: #64748b; background: #eff6ff; padding: 12px; border-radius: 8px; border-left: 4px solid #3b82f6; }

    .lines-sync-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding: 8px; }
    .sync-item { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; transition: all 0.3s; }
    .sync-item.active { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 131, 246, 0.1); transform: scale(1.02); background: #f0f7ff; }
    .sync-item.completed { opacity: 0.6; background: #f8fafc; border-style: dashed; }

    .sync-info { display: flex; gap: 16px; align-items: center; }
    .sync-num { font-weight: 700; color: #94a3b8; width: 24px; }
    .sync-text { font-size: 15px; color: #1e293b; font-weight: 500; }
    .sync-times { font-family: monospace; font-size: 12px; color: #3b82f6; background: #eff6ff; padding: 4px 8px; border-radius: 4px; }

    .progress-box { background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
    .progress-label { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; }
    .progress-val { font-size: 24px; font-weight: 800; color: #1e293b; margin-bottom: 12px; }
    .progress-bar { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
    .progress-bar .fill { height: 100%; background: #3b82f6; transition: width 0.3s; }

    .sync-controls { display: flex; flex-direction: column; gap: 12px; }
    .mark-btn { background: #1e293b; color: white; border: none; padding: 20px; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s; &:hover:not(:disabled) { background: #0f172a; transform: translateY(-2px); } &:active { transform: translateY(0); } &:disabled { opacity: 0.5; cursor: not-allowed; } }
    .reset-btn { background: none; border: 1px solid #cbd5e1; color: #64748b; padding: 10px; border-radius: 8px; font-size: 13px; cursor: pointer; &:hover { background: #f1f5f9; } }

    .save-btn { background: #10b981; color: white; border: none; padding: 20px; border-radius: 12px; width: 100%; font-size: 16px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); transition: all 0.2s; &:hover:not(:disabled) { background: #059669; transform: scale(1.02); } &:disabled { background: #cbd5e1; box-shadow: none; cursor: not-allowed; } }
    .save-hint { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 8px; }
  `]
})
export class AdminVttCreatorComponent {
  step = signal(1);
  rawText = '';
  audioUrl = '';
  targetPath = '';
  lines: VttLine[] = [];
  currentLineIndex = signal(0);
  isSaving = signal(false);

  @ViewChild('audioPlayer') audioPlayer?: ElementRef<HTMLAudioElement>;
  @ViewChild('linesList') linesList?: ElementRef<HTMLDivElement>;

  constructor(private http: HttpClient, private notification: NotificationService) {
    // Try to restore last used path from localStorage
    const savedPath = localStorage.getItem('vtt_last_path');
    if (savedPath) this.targetPath = savedPath;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Create a local blob URL for the audio file
      this.audioUrl = URL.createObjectURL(file);
      this.notification.show('Local audio file selected');
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (this.step() === 3 && event.code === 'Space') {
      event.preventDefault(); // Prevent page scroll
      this.markNext();
    }
  }

  goToStep2() {
    if (!this.rawText) return;
    
    // Split text into lines: only when a punctuation mark is followed by a space, or on newlines
    const sentences = this.rawText
      .split(/(?<=[.!?])\s+|\n+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    this.lines = sentences.map(text => ({ text }));
    this.step.set(2);
    
    // Save path for next time
    localStorage.setItem('vtt_last_path', this.targetPath);
  }

  removeLine(index: number) {
    this.lines.splice(index, 1);
  }

  startSync() {
    this.currentLineIndex.set(0);
    // Initialize first line start at 0
    if (this.lines.length > 0) {
      this.lines[0].start = 0;
    }
    this.step.set(3);
  }

  markNext() {
    if (!this.audioPlayer || this.currentLineIndex() >= this.lines.length) return;
    
    const time = this.audioPlayer.nativeElement.currentTime;
    const index = this.currentLineIndex();

    // End current line
    this.lines[index].end = time;
    
    // Set start for next line (0 for first line)
    const nextIndex = index + 1;
    if (nextIndex < this.lines.length) {
      this.lines[nextIndex].start = time;
      this.currentLineIndex.set(nextIndex);
      this.scrollToActive();
    } else {
      // Finished last line
      this.currentLineIndex.set(this.lines.length);
    }
  }

  resetSync() {
    this.lines.forEach(l => { delete l.start; delete l.end; });
    this.currentLineIndex.set(0);
    if (this.audioPlayer) {
      this.audioPlayer.nativeElement.currentTime = 0;
      this.audioPlayer.nativeElement.pause();
    }
  }

  scrollToActive() {
    setTimeout(() => {
      const activeEl = document.querySelector('.sync-item.active') as HTMLElement;
      if (activeEl && this.linesList) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
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
        console.log('Saved to:', res.path);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.notification.show('Failed to save file. Check console.', 'error');
        console.error('Save error:', err);
      }
    });
  }
}
