import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-admin-article-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, QuillModule],
  template: `
    <div class="edit-header">
      <div class="header-left">
        <a [routerLink]="['/admin/courses', courseId, 'lessons']" (click)="$event.preventDefault(); goBack()" class="back-btn">← Back to Lessons</a>
        <h3 class="section-title">Manage Article: {{ lessonTitle() }}</h3>
      </div>
      <div class="header-actions">
        <button 
          type="button" 
          class="save-btn" 
          [disabled]="articleForm.invalid || isSaving()"
          (click)="saveArticle()"
        >
          {{ isSaving() ? 'Saving...' : 'Save Article' }}
        </button>
      </div>
    </div>

    <div class="edit-container" *ngIf="!isLoading()">
      <form [formGroup]="articleForm" class="article-form">
        <!-- Media Links -->
        <div class="form-section media-section">
          <h4 class="section-label">Media Resources</h4>
          <div class="form-row">
            <div class="form-group">
              <label for="audioUrl">Audio URL</label>
              <input type="text" id="audioUrl" formControlName="audioUrl" placeholder="/media/course/lesson/article.mp3">
            </div>
            <div class="form-group">
              <label for="vttUrl">VTT URL (Optional)</label>
              <input type="text" id="vttUrl" formControlName="vttUrl" placeholder="/media/course/lesson/article.vtt">
            </div>
          </div>
        </div>

        <!-- Content Split View -->
        <div class="content-split">
          <div class="form-group content-box">
            <label>English Text</label>
            <quill-editor 
              formControlName="contentEn"
              [modules]="quillModules"
              placeholder="Enter English content..."
              class="custom-quill"
            ></quill-editor>
          </div>
          <div class="form-group content-box">
            <label>Vietnamese Translation</label>
            <quill-editor 
              formControlName="contentVi"
              [modules]="quillModules"
              placeholder="Enter Vietnamese translation..."
              class="custom-quill"
            ></quill-editor>
          </div>
        </div>
      </form>
    </div>

    <div *ngIf="isLoading()" class="loading-state">
      <div class="spinner"></div>
      <p>Loading article content...</p>
    </div>
  `,
  styles: [`
    .edit-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .back-btn { color: #64748b; text-decoration: none; font-weight: 600; cursor: pointer; }
    .section-title { font-size: 24px; font-weight: 700; color: #1e293b; }

    .save-btn {
      background: var(--primary);
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      &:disabled { opacity: 0.5; cursor: not-allowed; }
      &:hover:not(:disabled) { filter: brightness(1.1); }
    }

    .edit-container {
      background: white;
      padding: 32px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .section-label { font-size: 16px; font-weight: 700; margin-bottom: 16px; color: #334155; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

    .form-group {
      margin-bottom: 20px;
      label { display: block; font-weight: 600; margin-bottom: 8px; color: #475569; font-size: 14px; }
      input {
        width: 100%;
        padding: 12px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        outline: none;
        font-family: inherit;
        &:focus { border-color: var(--primary); }
      }
    }

    .content-split {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-top: 24px;
      border-top: 1px solid #f1f5f9;
      padding-top: 24px;
    }

    ::ng-deep .custom-quill {
      .ql-toolbar {
        border-radius: 8px 8px 0 0;
        border-color: #e2e8f0;
        background: #f8fafc;
      }
      .ql-container {
        border-radius: 0 0 8px 8px;
        border-color: #e2e8f0;
        min-height: 400px;
        font-family: 'Inter', sans-serif;
        font-size: 15px;
      }
    }

    .loading-state {
      padding: 100px;
      text-align: center;
      color: #64748b;
    }
    .spinner { margin: 0 auto 16px; width: 40px; height: 40px; border: 3px solid #f1f5f9; border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class AdminArticleEditComponent implements OnInit {
  articleForm: FormGroup;
  courseId: string = '';
  lessonId: string = '';
  lessonTitle = signal('');
  isLoading = signal(true);
  isSaving = signal(false);

  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ]
  };

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService
  ) {
    this.articleForm = this.fb.group({
      audioUrl: [''],
      vttUrl: [''],
      contentEn: ['', Validators.required],
      contentVi: ['']
    });
  }

  ngOnInit() {
    this.courseId = this.route.snapshot.paramMap.get('courseId') || '';
    this.lessonId = this.route.snapshot.paramMap.get('lessonId') || '';

    if (this.lessonId) {
      this.loadContent();
    }
  }

  loadContent() {
    this.isLoading.set(true);
    // getLesson implementation in backend returns the lesson with its contents mapped
    this.courseService.getLesson(this.courseId, this.lessonId).subscribe({
      next: (lesson) => {
        if (lesson) {
          this.lessonTitle.set(lesson.title);
          if (lesson.mainArticle) {
            this.articleForm.patchValue({
              audioUrl: lesson.mainArticle.audioUrl,
              vttUrl: lesson.mainArticle.vttUrl || '',
              contentEn: lesson.mainArticle.englishText,
              contentVi: lesson.mainArticle.vietnameseText
            });
          }
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load lesson', err);
        this.isLoading.set(false);
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin/courses', this.courseId, 'lessons']);
  }

  saveArticle() {
    if (this.articleForm.invalid) return;
    this.isSaving.set(true);

    this.courseService.upsertLessonContent(this.lessonId, 'ARTICLE', this.articleForm.value).subscribe({
      next: () => {
        this.isSaving.set(false);
        alert('Article saved successfully!');
      },
      error: (err) => {
        console.error('Failed to save article', err);
        this.isSaving.set(false);
        alert('Failed to save article.');
      }
    });
  }
}
