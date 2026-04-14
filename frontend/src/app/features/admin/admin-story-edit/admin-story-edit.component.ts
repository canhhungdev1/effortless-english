import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';

@Component({
  selector: 'app-admin-story-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="edit-header">
      <div class="header-left">
        <a [routerLink]="['/admin/courses', courseId, 'lessons', lessonId, contentType]" class="back-btn">← Back to {{ label }}</a>
        <h3 class="section-title">{{ isEditMode() ? 'Edit ' + singleLabel : 'New ' + singleLabel }}</h3>
      </div>
      <div class="header-actions">
        <button 
          type="button" 
          class="save-btn" 
          [disabled]="storyForm.invalid || isSaving()"
          (click)="saveStory()"
        >
          {{ isSaving() ? 'Saving...' : 'Save Story' }}
        </button>
      </div>
    </div>

    <div class="edit-container" *ngIf="!isLoading()">
      <form [formGroup]="storyForm">
        <div class="form-section">
          <h4 class="section-label">General Info</h4>
          <div class="form-grid">
            <div class="form-group">
              <label>Title</label>
              <input type="text" formControlName="title" placeholder="e.g. Mini-Story A">
            </div>
            <div class="form-group">
              <label>Audio URL</label>
              <input type="text" formControlName="audioUrl" placeholder="/media/...">
            </div>
            <div class="form-group">
              <label>VTT URL (Optional)</label>
              <input type="text" formControlName="vttUrl" placeholder="/media/...">
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="section-header">
            <h4 class="section-label">Script Lines</h4>
            <div class="header-btns">
              <button type="button" class="import-btn" (click)="showBulkImport = !showBulkImport">{{ showBulkImport ? 'Close Import' : 'Bulk Import' }}</button>
              <button type="button" class="add-line-btn" (click)="addLine()">+ Add Line</button>
            </div>
          </div>

          <div *ngIf="showBulkImport" class="bulk-import-area">
             <textarea #bulkText rows="10" placeholder="Paste your script here... (one line per entry)"></textarea>
             <button type="button" class="save-btn" (click)="importLines(bulkText.value)">Import These Lines</button>
          </div>
          
          <div formArrayName="lines" class="lines-list">
            <div *ngFor="let line of lines.controls; let i=index" [formGroupName]="i" class="line-row">
              <span class="line-index">#{{ i + 1 }}</span>
              <div class="line-inputs">
                 <input type="text" formControlName="text" placeholder="Script text...">
                 <label class="highlight-check">
                    <input type="checkbox" formControlName="isHighlighted">
                    <span>Highlight</span>
                 </label>
              </div>
              <button type="button" class="remove-btn" (click)="removeLine(i)">🗑️</button>
            </div>
          </div>
        </div>
      </form>
    </div>

    <div *ngIf="isLoading()" class="loading-state">
      <div class="spinner"></div>
      <p>Loading story content...</p>
    </div>
  `,
  styles: [`
    .edit-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .back-btn { color: #64748b; text-decoration: none; font-weight: 600; &:hover { color: var(--primary); } }
    .section-title { font-size: 24px; font-weight: 700; color: #1e293b; }

    .save-btn {
      background: var(--primary); color: white; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 600;
      cursor: pointer; transition: all 0.2s;
      &:disabled { opacity: 0.5; cursor: not-allowed; }
      &:hover:not(:disabled) { filter: brightness(1.1); }
    }

    .edit-container { background: white; padding: 32px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }

    .form-section { margin-bottom: 32px; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .header-btns { display: flex; gap: 12px; }
    .section-label { font-size: 16px; font-weight: 700; color: #334155; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .form-group {
      margin-bottom: 16px;
      label { display: block; font-weight: 600; font-size: 13px; color: #64748b; margin-bottom: 6px; }
      input { width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; outline: none; transition: border-color 0.2s; &:focus { border-color: var(--primary); } }
    }

    .add-line-btn { background: #f0fdf4; color: #16a34a; border: 1px dashed #16a34a; padding: 6px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; &:hover { background: #dcfce7; } }
    .import-btn { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; padding: 6px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; &:hover { background: #f1f5f9; } }

    .bulk-import-area { margin-bottom: 24px; padding: 16px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; textarea { width: 100%; border: 1px solid #cbd5e1; padding: 12px; margin-bottom: 12px; border-radius: 8px; outline: none; &:focus { border-color: var(--primary); } } }

    .lines-list { display: flex; flex-direction: column; gap: 12px; }
    .line-row {
      display: flex; align-items: center; gap: 12px; background: #f8fafc; padding: 10px 16px; border-radius: 8px; border: 1px solid #f1f5f9;
      .line-index { font-family: monospace; font-weight: 700; color: #94a3b8; width: 40px; }
      .line-inputs { flex: 1; display: flex; align-items: center; gap: 12px; input { flex: 1; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; outline: none; &:focus { border-color: var(--primary); } } }
    }

    .highlight-check { cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #64748b; input { width: 18px; height: 18px; cursor: pointer; } }

    .remove-btn { color: #ef4444; font-size: 18px; filter: grayscale(1); cursor: pointer; &:hover { filter: none; } }

    .loading-state { padding: 80px; text-align: center; color: #64748b; }
    .spinner { margin: 0 auto 16px; width: 40px; height: 40px; border: 3px solid #f1f5f9; border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class AdminStoryEditComponent implements OnInit {
  storyForm: FormGroup;
  courseId: string = '';
  lessonId: string = '';
  contentType: string = 'ministory';
  contentId: string | null = null;
  isEditMode = signal(false);
  isLoading = signal(true);
  isSaving = signal(false);
  showBulkImport = false;

  typeLabels: {[key: string]: string} = {
    'ministory': 'Mini-Stories',
    'commentary': 'Commentaries',
    'pov': 'Point of Views'
  };

  singleLabels: {[key: string]: string} = {
    'ministory': 'Mini-Story',
    'commentary': 'Commentary',
    'pov': 'Point of View'
  };

  get label() { return this.typeLabels[this.contentType] || 'Stories'; }
  get singleLabel() { return this.singleLabels[this.contentType] || 'Story'; }

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService
  ) {
    this.storyForm = this.fb.group({
      title: ['', Validators.required],
      audioUrl: [''],
      vttUrl: [''],
      lines: this.fb.array([])
    });
  }

  get lines() { return this.storyForm.get('lines') as FormArray; }

  ngOnInit() {
    this.courseId = this.route.snapshot.paramMap.get('courseId') || '';
    this.lessonId = this.route.snapshot.paramMap.get('lessonId') || '';
    this.contentId = this.route.snapshot.paramMap.get('id');

    // Get type from URL
    const segments = this.route.snapshot.url;
    const knownTypes = ['ministory', 'commentary', 'pov'];
    const typeSegment = segments.find(s => knownTypes.includes(s.path.toLowerCase()));
    if (typeSegment) this.contentType = typeSegment.path;

    if (this.contentId && this.contentId !== 'new') {
      this.isEditMode.set(true);
      this.loadContent();
    } else {
      this.isLoading.set(false);
    }
  }

  loadContent() {
    this.isLoading.set(true);
    this.courseService.getLesson(this.courseId, this.lessonId).subscribe({
      next: (lesson) => {
        if (lesson) {
          let stories: any[] = [];
          if (this.contentType === 'ministory') stories = lesson.miniStories || [];
          else if (this.contentType === 'commentary') stories = lesson.commentaries || [];
          else if (this.contentType === 'pov') stories = lesson.pointOfViews || [];

          const story = stories.find((s: any) => s.id === this.contentId);
          if (story) {
            this.storyForm.patchValue({
              title: story.title,
              audioUrl: story.audioUrl,
              vttUrl: story.vttUrl || ''
            });
            this.lines.clear();
            if (story.lines) {
               story.lines.forEach((l: any) => this.addLine(l));
            }
          }
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  addLine(data?: any) {
    const lineGroup = this.fb.group({
      text: [data?.text || '', Validators.required],
      isHighlighted: [data?.isHighlighted || false]
    });
    this.lines.push(lineGroup);
  }

  removeLine(index: number) { this.lines.removeAt(index); }

  importLines(text: string) {
    if (!text.trim()) return;
    const lines = text.split('\\n').filter(l => l.trim() !== '');
    lines.forEach(l => this.addLine({ text: l }));
    this.showBulkImport = false;
  }

  saveStory() {
    if (this.storyForm.invalid) return;
    this.isSaving.set(true);

    const formVal = this.storyForm.value;
    
    // Map internal type to backend enum type
    const typeMap: {[key: string]: string} = {
      'ministory': 'MINI_STORY',
      'commentary': 'COMMENTARY',
      'pov': 'POINT_OF_VIEW'
    };

    const data = {
      id: this.contentId === 'new' ? undefined : this.contentId,
      title: formVal.title,
      audioUrl: formVal.audioUrl,
      vttUrl: formVal.vttUrl,
      extraData: { lines: formVal.lines }
    };

    this.courseService.upsertLessonContent(this.lessonId, typeMap[this.contentType], data).subscribe({
      next: () => this.router.navigate(['/admin/courses', this.courseId, 'lessons', this.lessonId, this.contentType]),
      error: () => this.isSaving.set(false)
    });
  }
}
