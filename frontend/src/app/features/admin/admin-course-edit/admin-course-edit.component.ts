import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { Course } from '../../../core/models/course.model';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';

@Component({
  selector: 'app-admin-course-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, FileUploadComponent],
  template: `
    <div class="edit-header">
      <div class="header-left">
        <a routerLink="/admin/courses" class="back-btn">← Back</a>
        <h3 class="section-title">{{ isEditMode() ? 'Edit Course' : 'Create New Course' }}</h3>
      </div>
      <div class="header-actions">
        <button type="button" class="cancel-btn" routerLink="/admin/courses">Cancel</button>
        <button 
          type="submit" 
          class="save-btn" 
          [disabled]="courseForm.invalid || isSaving()"
          (click)="saveCourse()"
        >
          {{ isSaving() ? 'Saving...' : 'Save Course' }}
        </button>
      </div>
    </div>

    <form [formGroup]="courseForm" class="edit-form">
      <div class="form-grid">
        <!-- Main Info -->
        <div class="form-section main-info">
          <div class="form-group">
            <label for="title">Course Title</label>
            <input type="text" id="title" formControlName="title" placeholder="e.g. Effortless English Original">
            <div class="error" *ngIf="courseForm.get('title')?.touched && courseForm.get('title')?.invalid">
              Title is required.
            </div>
          </div>

          <div class="form-group">
            <label for="slug">URL Slug</label>
            <input type="text" id="slug" formControlName="slug" placeholder="e.g. effortless-english">
            <div class="error" *ngIf="courseForm.get('slug')?.touched && courseForm.get('slug')?.invalid">
              Valid slug is required.
            </div>
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea id="description" formControlName="description" rows="5" placeholder="Course description..."></textarea>
          </div>
        </div>

        <!-- Meta Info -->
        <div class="form-section meta-info">
          <div class="form-group">
            <label for="level">Level</label>
            <select id="level" formControlName="level">
              <option value="Beginner">Beginner</option>
              <option value="Pre-Intermediate">Pre-Intermediate</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div class="form-group">
            <label for="coverImage">Cover Image URL</label>
            <div class="input-with-upload">
              <input type="text" id="coverImage" formControlName="coverImage" placeholder="assets/images/...">
              <app-file-upload accept="image/*" label="Image" (uploaded)="courseForm.get('coverImage')?.setValue($event)"></app-file-upload>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group checkbox-group">
              <label class="checkbox-container">
                <input type="checkbox" formControlName="isVip">
                <span class="checkmark"></span>
                VIP Course
              </label>
            </div>
            <div class="form-group">
              <label for="stage">Stage</label>
              <input type="number" id="stage" formControlName="stage" min="1" max="10">
            </div>
          </div>

          <div class="preview-card" *ngIf="courseForm.get('coverImage')?.value">
            <label>Cover Preview</label>
            <img [src]="courseForm.get('coverImage')?.value" alt="Preview" class="preview-img">
          </div>
        </div>
      </div>
    </form>
  `,
  styles: [`
    .edit-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .back-btn {
      color: #64748b;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      &:hover { color: var(--primary); }
    }

    .section-title { font-size: 24px; font-weight: 700; color: #1e293b; }

    .header-actions {
      display: flex;
      gap: 12px;
    }

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

    .cancel-btn {
      background: white;
      color: #64748b;
      border: 1px solid #e2e8f0;
      padding: 10px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      &:hover { background: #f8fafc; }
    }

    .edit-form {
      background: white;
      padding: 32px;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 40px;
    }

    .form-group {
      margin-bottom: 24px;
      
      label {
        display: block;
        font-size: 14px;
        font-weight: 600;
        color: #475569;
        margin-bottom: 8px;
      }

      input[type="text"],
      input[type="number"],
      select,
      textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;

        &:focus { border-color: var(--primary); }
      }
    }

    .input-with-upload {
      display: flex;
      gap: 12px;
      align-items: center;
      input { flex: 1; }
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      align-items: center;
    }

    .checkbox-group {
      margin-bottom: 0;
      display: flex;
      align-items: center;
      height: 100%;
    }

    .checkbox-container {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-weight: 600;
      color: #475569;
      
      input { width: 18px; height: 18px; cursor: pointer; }
    }

    .preview-card {
      margin-top: 24px;
      padding: 16px;
      background: #f8fafc;
      border-radius: 12px;
      border: 1px dashed #cbd5e1;

      label { font-size: 13px; color: #64748b; margin-bottom: 8px; display: block; }
    }

    .preview-img {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }

    .error {
      color: var(--primary);
      font-size: 12px;
      margin-top: 4px;
      font-weight: 500;
    }
  `]
})
export class AdminCourseEditComponent implements OnInit {
  courseForm: FormGroup;
  isEditMode = signal(false);
  isSaving = signal(false);
  courseId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private courseService: CourseService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.courseForm = this.fb.group({
      title: ['', Validators.required],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      description: [''],
      level: ['Beginner', Validators.required],
      coverImage: ['assets/images/course-default.webp'],
      isVip: [false],
      stage: [1, [Validators.min(1), Validators.max(10)]]
    });
  }

  ngOnInit() {
    this.courseId = this.route.snapshot.paramMap.get('id');
    if (this.courseId && this.courseId !== 'new') {
      this.isEditMode.set(true);
      this.courseService.getCourse(this.courseId).subscribe(course => {
        if (course) {
          this.courseForm.patchValue(course);
        }
      });
    }

    // Auto-generate slug from title
    this.courseForm.get('title')?.valueChanges.subscribe(title => {
      if (!this.isEditMode()) {
        const slug = title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
        this.courseForm.get('slug')?.patchValue(slug, { emitEvent: false });
      }
    });
  }

  saveCourse() {
    if (this.courseForm.invalid) return;

    this.isSaving.set(true);
    const formData = this.courseForm.value;

    if (this.isEditMode()) {
      this.courseService.updateCourse(this.courseId!, formData).subscribe({
        next: () => this.handleSuccess(),
        error: (err) => this.handleError(err)
      });
    } else {
      this.courseService.createCourse(formData).subscribe({
        next: () => this.handleSuccess(),
        error: (err) => this.handleError(err)
      });
    }
  }

  private handleSuccess() {
    this.isSaving.set(false);
    this.router.navigate(['/admin/courses']);
  }

  private handleError(err: any) {
    this.isSaving.set(false);
    console.error('Failed to save course', err);
    alert('Failed to save course. Check console for details.');
  }
}
