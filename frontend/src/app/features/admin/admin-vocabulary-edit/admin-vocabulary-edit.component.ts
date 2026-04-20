import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { NotificationService } from '../../../core/services/notification.service';
import { QuillModule } from 'ngx-quill';
import { HttpClient } from '@angular/common/http';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';


@Component({
  selector: 'app-admin-vocabulary-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, QuillModule, FileUploadComponent, DragDropModule],

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
            <h4 class="section-label">Key Vocabulary Words ({{ keywords.length }})</h4>
            <button type="button" class="add-word-btn" (click)="openAddModal()">+ Add New Word</button>
          </div>
          
          <div class="vocab-table-container">
            <table class="vocab-table" *ngIf="keywords.length > 0">
              <thead>
                <tr>
                  <th style="width: 50px"></th>
                  <th style="width: 60px">#</th>
                  <th>Word / Phrase</th>
                  <th>Phonetic</th>
                  <th>Translation</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody cdkDropList (cdkDropListDropped)="drop($event)">
                <tr *ngFor="let kw of keywords.controls; let i=index" cdkDrag class="drag-row">
                  <td class="drag-handle" cdkDragHandle>⋮⋮</td>
                  <td class="index-col">{{ i + 1 }}</td>
                  <td class="word-col">
                    <div class="word-with-audio">
                      <span>{{ kw.get('word')?.value }}</span>
                      <button *ngIf="kw.get('audio')?.value" type="button" class="inline-play-btn" (click)="playKeywordAudio(i)" title="Listen">🔊</button>
                    </div>
                  </td>
                  <td><span class="phonetic-badge">{{ kw.get('phonetic')?.value || '-' }}</span></td>
                  <td class="translation-col">{{ kw.get('translation')?.value }}</td>
                  <td>
                    <div class="table-actions">
                      <button type="button" class="icon-btn edit" (click)="openEditModal(i)" title="Edit">✏️</button>
                      <button type="button" class="icon-btn delete" (click)="removeKeyword(i)" title="Delete">🗑️</button>
                    </div>
                  </td>

                  <!-- Drag Preview -->
                  <div *cdkDragPreview class="drag-preview">
                    🔤 {{ kw.get('word')?.value }}
                  </div>
                </tr>
              </tbody>
            </table>
            
            <div class="empty-state" *ngIf="keywords.length === 0">
              <p>No keywords added yet. Click "+ Add New Word" to start.</p>
            </div>
          </div>
        </div>
      </form>
    </div>

    <!-- Keyword Modal -->
    <div class="modal-overlay" *ngIf="isModalOpen()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ editingIndex() !== null ? 'Edit Word' : 'Add New Word' }}</h3>
          <button class="close-modal" (click)="closeModal()">×</button>
        </div>
        
        <div class="modal-body" *ngIf="editingIndex() !== null" [formGroup]="getKeywordsFormGroup(editingIndex()!)">
          <div class="card-grid">
            <div class="form-group full-width">
              <div class="label-with-action">
                <label>Word / Phrase</label>
                <button type="button" class="magic-btn" (click)="fetchFromApi(editingIndex()!)" title="Auto-fetch from Dictionary">✨ Auto Fetch Info</button>
              </div>
              <input type="text" formControlName="word" placeholder="e.g. Atmosphere or Break a leg">
            </div>
            
            <div class="form-group">
              <label>Phonetic</label>
              <input type="text" formControlName="phonetic" placeholder="e.g. /ˈætməsfɪər/">
            </div>

            <div class="form-group">
              <label>Audio URL</label>
              <div class="audio-input-group">
                <input type="text" formControlName="audio" placeholder="https://...">
                <button type="button" class="play-btn" *ngIf="keywords.at(editingIndex()!).get('audio')?.value" (click)="playKeywordAudio(editingIndex()!)">🔊</button>
              </div>
            </div>

            <div class="form-group full-width">
              <label>Translation (Vietnamese)</label>
              <input type="text" formControlName="translation" placeholder="Vietnamese meaning">
            </div>

            <div class="form-group full-width">
              <label>Example Sentence</label>
              <textarea formControlName="example" rows="3" placeholder="Example usage in context..."></textarea>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="cancel-btn" (click)="closeModal()">Cancel</button>
          <button type="button" class="confirm-btn" [disabled]="isSaving()" (click)="handleModalSave()">
            {{ isSaving() ? 'Saving...' : 'Save & Close' }}
          </button>
        </div>
      </div>
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

    .add-word-btn { background: var(--primary); color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; &:hover { filter: brightness(1.1); transform: translateY(-1px); } }

    /* Vocab Table Styles */
    .vocab-table-container { background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    .vocab-table { width: 100%; border-collapse: collapse; text-align: left; table-layout: fixed; }
    .vocab-table th, .vocab-table td { padding: 16px; border-bottom: 1px solid #e2e8f0; }
    .vocab-table th { background: #f1f5f9; font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .vocab-table tr:last-child td { border-bottom: none; }
    .vocab-table tr:hover:not(.cdk-drag-placeholder) { background: #f1f5f9; }
    
    .drag-handle { 
      cursor: grab; 
      color: #94a3b8; 
      font-weight: bold; 
      font-size: 18px; 
      user-select: none;
      text-align: center;
      &:active { cursor: grabbing; }
    }

    .drag-row {
      background: white;
      &.cdk-drag-placeholder { opacity: 0.2; background: #f8fafc; }
    }

    .drag-preview {
      padding: 12px 24px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-weight: 600;
      color: #1e293b;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 10px;
      border-left: 4px solid var(--primary);
      z-index: 2000;
      pointer-events: none;
    }

    .index-col { font-weight: 700; color: #64748b; font-family: monospace; }
    .word-col { font-weight: 700; color: #1e293b; font-size: 15px; }

    .word-with-audio {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .inline-play-btn {
      background: none;
      border: none;
      font-size: 14px;
      cursor: pointer;
      opacity: 0.6;
      transition: all 0.2s;
      padding: 2px;
      border-radius: 4px;
      
      &:hover {
        opacity: 1;
        background: #e2e8f0;
        transform: scale(1.2);
      }
    }
    .phonetic-badge { background: #e2e8f0; color: #475569; padding: 4px 8px; border-radius: 6px; font-size: 13px; font-family: monospace; }
    .translation-col { color: #64748b; font-size: 14px; }
    
    .table-actions { display: flex; gap: 8px; }
    .icon-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
    .icon-btn.edit:hover { background: #eff6ff; border-color: #3b82f6; }
    .icon-btn.delete:hover { background: #fef2f2; border-color: #ef4444; }

    .empty-state { padding: 40px; text-align: center; color: #94a3b8; font-style: italic; }

    /* Modal Styles */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(4px); z-index: 1000; display: flex;
      align-items: center; justify-content: center; padding: 20px;
      animation: fadeIn 0.2s ease;
    }
    .modal-content {
      width: 100%; max-width: 600px; background: white; border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .modal-header {
      padding: 20px 24px; border-bottom: 1px solid #e2e8f0;
      display: flex; justify-content: space-between; align-items: center;
      h3 { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0; }
    }
    .close-modal { font-size: 28px; color: #64748b; background: none; border: none; cursor: pointer; &:hover { color: #1e293b; } }
    
    .modal-body { padding: 24px; max-height: 70vh; overflow-y: auto; }
    .label-with-action { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    
    .modal-footer {
      padding: 16px 24px; border-top: 1px solid #e2e8f0;
      display: flex; justify-content: flex-end; gap: 12px;
    }
    .cancel-btn { padding: 10px 20px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; color: #64748b; font-weight: 600; cursor: pointer; }
    .confirm-btn { padding: 10px 24px; border-radius: 8px; background: var(--primary); color: white; border: none; font-weight: 600; cursor: pointer; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    .card-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }

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

  // Modal State
  isModalOpen = signal(false);
  editingIndex = signal<number | null>(null);

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
    private notification: NotificationService,
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
    return this.keywords.length - 1;
  }

  drop(event: CdkDragDrop<any[]>) {
    const from = event.previousIndex;
    const to = event.currentIndex;
    
    if (from === to) return;

    const group = this.keywords.at(from);
    this.keywords.removeAt(from);
    this.keywords.insert(to, group);
    
    // Automatically save order
    this.saveVocabulary();
  }

  // Modal Methods
  openAddModal() {
    const index = this.addKeyword();
    this.editingIndex.set(index);
    this.isModalOpen.set(true);
  }

  openEditModal(index: number) {
    this.editingIndex.set(index);
    this.isModalOpen.set(true);
  }

  handleModalSave() {
    // 1. Close the modal first
    this.isModalOpen.set(false);
    this.editingIndex.set(null);
    
    // 2. Trigger the global save
    this.saveVocabulary();
  }

  closeModal() {
    // If we were adding but didn't enter a word, remove it silently
    const index = this.editingIndex();
    if (index !== null) {
      const word = this.keywords.at(index).get('word')?.value;
      if (!word) {
        this.keywords.removeAt(index);
      }
    }
    this.isModalOpen.set(false);
    this.editingIndex.set(null);
  }

  getKeywordsFormGroup(index: number): FormGroup {
    return this.keywords.at(index) as FormGroup;
  }

  removeKeyword(index: number) {
    if (confirm('Are you sure you want to delete this word?')) {
      this.keywords.removeAt(index);
    }
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
    const wordControl = this.keywords.at(index).get('word');
    const word = wordControl?.value?.trim();
    
    if (!word) {
      alert('Please enter a word or phrase first');
      return;
    }

    const isPhrase = word.includes(' ');
    
    // 1. Fetch Translation (For both word and phrase)
    this.http.get<any>(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|vi`).subscribe({
      next: (res) => {
        if (res?.responseData?.translatedText) {
          this.keywords.at(index).patchValue({
            translation: res.responseData.translatedText
          });
        }
      },
      error: () => console.warn('Translation not found')
    });

    // 2. Fetch Dictionary Info (Only for single words)
    if (!isPhrase) {
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
          }
        },
        error: () => {
          // If word not found in dictionary, we still have the translation from step 1
          console.warn('Word not found in dictionary');
        }
      });
    } else {
      // For phrases, we clear phonetic since it doesn't apply standardly
      this.keywords.at(index).patchValue({
        phonetic: 'Phrase'
      });
    }
  }

  playKeywordAudio(index: number) {
    const url = this.keywords.at(index).get('audio')?.value;
    if (url) {
      const audio = new Audio(url);
      audio.play();
    }
  }

  saveVocabulary() {
    if (this.vocabForm.invalid) {
      console.error('Form invalid:', this.vocabForm.errors);
      this.notification.show('Please fill in all required fields (Word and Translation are mandatory for each entry)', 'error');
      return;
    }

    this.isSaving.set(true);

    const formVal = this.vocabForm.value;
    
    // Standardize paragraphs: split by newlines if it's a string, or treat as one paragraph
    const explanationStr = formVal.explanation || '';
    const paragraphs = explanationStr.trim() !== '' ? [explanationStr] : [];

    const data = {
      title: 'Vocabulary Explanation',
      audioUrl: formVal.audioUrl,
      vttUrl: formVal.vttUrl,
      extraData: {
        paragraphs: paragraphs, 
        keywords: formVal.keywords || []
      }
    };

    console.log('Saving Vocabulary Payload:', data);

    this.courseService.upsertLessonContent(this.lessonId, 'VOCABULARY', data).subscribe({
      next: (res) => {
        console.log('Save result:', res);
        this.isSaving.set(false);
        this.notification.show('Vocabulary saved successfully!');
      },
      error: (err) => {
        console.error('Failed to save vocabulary', err);
        this.isSaving.set(false);
        this.notification.show('Failed to save vocabulary: ' + (err.error?.message || 'Server error'), 'error');
      }
    });
  }
}

