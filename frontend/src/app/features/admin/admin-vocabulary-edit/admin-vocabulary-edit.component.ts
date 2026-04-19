import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { QuillModule } from 'ngx-quill';
import { HttpClient } from '@angular/common/http';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';


@Component({
  selector: 'app-admin-vocabulary-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, QuillModule, FileUploadComponent],

  template: `
    <div class="edit-header">
      <div class="header-left">
        <a [routerLink]="['/admin/courses', courseId, 'lessons']" class="back-btn">← Back to Lessons</a>
        <h3 class="section-title">Manage Vocabulary: {{ lessonTitle() }}</h3>
      </div>
      <div class="header-actions">
        <button 
          type="button" 
          class="save-btn" 
          [disabled]="vocabForm.invalid || isSaving()"
          (click)="saveVocabulary()"
        >
          {{ isSaving() ? 'Saving...' : 'Save Vocabulary' }}
        </button>
      </div>
    </div>

    <div class="edit-container" *ngIf="!isLoading()">
      <form [formGroup]="vocabForm">
        <!-- Media Section -->
        <div class="form-section">
          <h4 class="section-label">Media Resources</h4>
          <div class="form-row">
            <div class="form-group">
              <label>Audio URL</label>
              <div class="input-with-upload">
                <input type="text" formControlName="audioUrl" placeholder="/media/...">
                <app-file-upload accept="audio/*" label="Audio" [courseId]="courseId" [lessonId]="lessonId" (uploaded)="vocabForm.get('audioUrl')?.setValue($event)"></app-file-upload>
              </div>
            </div>
            <div class="form-group">
              <label>VTT URL (Optional)</label>
              <div class="input-with-upload">
                <input type="text" formControlName="vttUrl" placeholder="/media/...">
                <app-file-upload accept=".vtt" label="VTT" [courseId]="courseId" [lessonId]="lessonId" (uploaded)="vocabForm.get('vttUrl')?.setValue($event)"></app-file-upload>
              </div>
            </div>

          </div>
        </div>

        <!-- Explanation Section -->
        <div class="form-section">
          <h4 class="section-label">Vocabulary Explanation (Supports HTML)</h4>
          <quill-editor 
            formControlName="explanation"
            [modules]="quillModules"
            placeholder="Enter vocabulary explanation paragraphs..."
            class="custom-quill"
          ></quill-editor>
        </div>

        <!-- Keywords Section -->
        <div class="form-section">
          <div class="section-header">
            <h4 class="section-label">Key Vocabulary Words</h4>
            <button type="button" class="add-word-btn" (click)="addKeyword()">+ Add Word</button>
          </div>
          
          <div formArrayName="keywords" class="keywords-list">
            <div *ngFor="let kw of keywords.controls; let i=index" [formGroupName]="i" class="keyword-card">
              <div class="card-header">
                <h5>Word #{{ i + 1 }}</h5>
                <div class="header-actions">
                  <button type="button" class="magic-btn" (click)="fetchFromApi(i)" title="Auto-fetch from Dictionary">✨ Fetch</button>
                  <button type="button" class="remove-btn" (click)="removeKeyword(i)">🗑️</button>
                </div>
              </div>
              <div class="card-grid">
                <div class="form-group">
                  <label>Word</label>
                  <input type="text" formControlName="word" placeholder="e.g. Atmosphere">
                </div>
                <div class="form-group">
                  <label>Phonetic</label>
                  <input type="text" formControlName="phonetic" placeholder="e.g. /ˈætməsfɪər/">
                </div>
                <div class="form-group full-width">
                  <label>Audio URL (Auto-fetched or Manual)</label>
                  <div class="audio-input-group">
                    <input type="text" formControlName="audio" placeholder="https://...">
                    <button type="button" class="play-btn" *ngIf="keywords.at(i).get('audio')?.value" (click)="playKeywordAudio(i)">🔊</button>
                  </div>
                </div>
                <div class="form-group full-width">
                  <label>Translation</label>
                  <input type="text" formControlName="translation" placeholder="Vietnamese meaning">
                </div>
                <div class="form-group full-width">
                  <label>Example Sentence</label>
                  <textarea formControlName="example" rows="2" placeholder="Example usage..."></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>

    <div *ngIf="isLoading()" class="loading-state">
      <div class="spinner"></div>
      <p>Loading vocabulary content...</p>
    </div>
  `,
  styles: [`
    .edit-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .back-btn { color: #64748b; text-decoration: none; font-weight: 600; &:hover { color: var(--primary); } }
    .section-title { font-size: 24px; font-weight: 700; color: #1e293b; }

    .save-btn {
      background: var(--primary);
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      &:disabled { opacity: 0.5; cursor: not-allowed; }
      &:hover:not(:disabled) { filter: brightness(1.1); }
    }

    .edit-container { display: flex; flex-direction: column; gap: 32px; background: white; padding: 32px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }

    .form-section { margin-bottom: 32px; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .section-label { font-size: 16px; font-weight: 700; color: #334155; }

    .form-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
    .form-group {
      margin-bottom: 16px;
      label { display: block; font-weight: 600; font-size: 13px; color: #64748b; margin-bottom: 6px; }
      input, textarea {
        width: 100%;
        padding: 10px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        outline: none;
        transition: border-color 0.2s;
        &:focus { border-color: var(--primary); }
      }
      &.full-width { grid-column: span 2; }
    }

    .input-with-upload {
      display: flex;
      gap: 12px;
      align-items: center;
      input { flex: 1; }
    }

    .audio-input-group {

      display: flex;
      gap: 10px;
      align-items: center;
      input { flex: 1; }
    }

    .play-btn {
      background: #f1f5f9; border: 1px solid #e2e8f0; padding: 8px; border-radius: 8px; cursor: pointer; font-size: 18px;
      &:hover { background: #e2e8f0; }
    }

    .magic-btn {
      background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer;
      &:hover { background: #dcfce7; }
    }

    .add-word-btn { background: #f0f9ff; color: #0284c7; border: 1px dashed #0284c7; padding: 6px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; &:hover { background: #e0f2fe; } }

    .keywords-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
    .keyword-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 20px;
      border-radius: 12px;
      .card-header { 
        display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; 
        h5 { font-weight: 700; color: #1e293b; }
        .header-actions { display: flex; gap: 10px; align-items: center; }
      }
      .card-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    }

    .remove-btn { color: #ef4444; font-size: 18px; filter: grayscale(1); cursor: pointer; &:hover { filter: none; } }

    ::ng-deep .custom-quill {
      width: 100%;
      display: block;
      .ql-toolbar { border-radius: 8px 8px 0 0; background: #f8fafc; }
      .ql-container { border-radius: 0 0 8px 8px; min-height: 250px; font-size: 15px; }
    }

    .loading-state { padding: 80px; text-align: center; color: #64748b; }
    .spinner { margin: 0 auto 16px; width: 40px; height: 40px; border: 3px solid #f1f5f9; border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 1200px) {
      .keywords-list {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 768px) {
      .form-row, .card-grid {
        grid-template-columns: 1fr;
      }
      .form-group.full-width {
        grid-column: auto;
      }
    }
  `]
})
export class AdminVocabularyEditComponent implements OnInit {
  vocabForm: FormGroup;
  courseId: string = '';
  lessonId: string = '';
  lessonTitle = signal('');
  isLoading = signal(true);
  isSaving = signal(false);

  quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean']
    ]
  };

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private http: HttpClient
  ) {
    this.vocabForm = this.fb.group({
      audioUrl: [''],
      vttUrl: [''],
      explanation: [''],
      keywords: this.fb.array([])
    });
  }

  get keywords() {
    return this.vocabForm.get('keywords') as FormArray;
  }

  ngOnInit() {
    this.courseId = this.route.snapshot.paramMap.get('courseId') || '';
    this.lessonId = this.route.snapshot.paramMap.get('lessonId') || '';

    if (this.lessonId) {
      this.loadContent();
    }
  }

  addKeyword(data?: any) {
    const kwGroup = this.fb.group({
      word: [data?.word || '', Validators.required],
      phonetic: [data?.phonetic || ''],
      audio: [data?.audio || ''],
      translation: [data?.translation || '', Validators.required],
      example: [data?.example || '']
    });
    this.keywords.push(kwGroup);
  }

  removeKeyword(index: number) {
    this.keywords.removeAt(index);
  }

  loadContent() {
    this.isLoading.set(true);
    this.courseService.getLesson(this.courseId, this.lessonId).subscribe({
      next: (lesson) => {
        if (lesson) {
          this.lessonTitle.set(lesson.title);
          if (lesson.vocabulary) {
            this.vocabForm.patchValue({
              audioUrl: lesson.vocabulary.audioUrl,
              vttUrl: lesson.vocabulary.vttUrl || '',
              explanation: lesson.vocabulary.paragraphs.join('')
            });
            
            this.keywords.clear();
            if (lesson.vocabulary.keywords) {
              lesson.vocabulary.keywords.forEach(kw => this.addKeyword(kw));
            }
          }
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  fetchFromApi(index: number) {
    const word = this.keywords.at(index).get('word')?.value;
    if (!word) {
      alert('Please enter a word first');
      return;
    }

    this.http.get<any>(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`).subscribe({
      next: (res) => {
        if (res && res.length > 0) {
          const entry = res[0];
          const phonetic = entry.phonetic || (entry.phonetics.find((p: any) => p.text)?.text);
          const audio = entry.phonetics.find((p: any) => p.audio && p.audio !== '')?.audio;
          
          this.keywords.at(index).patchValue({
            phonetic: phonetic || '',
            audio: audio || ''
          });

          // Optional: if translation is empty, we could fill it with the first definition (in English)
          // But since we need Vietnamese, we leave it to the admin or integrate translation API later
        }
      },
      error: () => alert('Word not found in dictionary')
    });
  }

  playKeywordAudio(index: number) {
    const url = this.keywords.at(index).get('audio')?.value;
    if (url) {
      const audio = new Audio(url);
      audio.play();
    }
  }

  saveVocabulary() {
    if (this.vocabForm.invalid) return;
    this.isSaving.set(true);

    const formVal = this.vocabForm.value;
    const data = {
      audioUrl: formVal.audioUrl,
      vttUrl: formVal.vttUrl,
      extraData: {
        paragraphs: [formVal.explanation], 
        keywords: formVal.keywords
      }
    };

    this.courseService.upsertLessonContent(this.lessonId, 'VOCABULARY', data).subscribe({
      next: () => {
        this.isSaving.set(false);
        alert('Vocabulary saved successfully!');
      },
      error: (err) => {
        console.error('Failed to save vocabulary', err);
        this.isSaving.set(false);
        alert('Failed to save vocabulary.');
      }
    });
  }
}

