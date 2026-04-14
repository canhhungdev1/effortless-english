import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';

@Component({
  selector: 'app-admin-lesson-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="edit-header">
      <div class="header-left">
        <a [routerLink]="['/admin/courses', courseId, 'lessons']" class="back-btn">← Back to Lessons</a>
        <h3 class="section-title">{{ isEditMode() ? 'Edit Lesson' : 'Add New Lesson' }}</h3>
      </div>
      <div class="header-actions">
        <button 
          type="submit" 
          class="save-btn" 
          [disabled]="lessonForm.invalid || isSaving()"
          (click)="saveLesson()"
        >
          {{ isSaving() ? 'Saving...' : 'Save Lesson' }}
        </button>
      </div>
    </div>

    <form [formGroup]="lessonForm" class="edit-form">
      <div class="form-group">
        <label for="title">Lesson Title</label>
        <input type="text" id="title" formControlName="title" placeholder="e.g. Day Of The Dead">
      </div>

      <div class="form-group">
        <label for="slug">Slug</label>
        <input type="text" id="slug" formControlName="slug" placeholder="e.g. day-of-the-dead">
      </div>

      <div class="form-group">
        <label for="order">Sort Order</label>
        <input type="number" id="order" formControlName="order">
      </div>
    </form>
  `,
  styles: [`
    .edit-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .back-btn { color: #64748b; text-decoration: none; font-weight: 600; }
    .section-title { font-size: 24px; font-weight: 700; color: #1e293b; }

    .save-btn {
      background: var(--primary);
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      &:disabled { opacity: 0.5; }
    }

    .edit-form {
      background: white;
      padding: 32px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      max-width: 600px;
    }

    .form-group {
      margin-bottom: 20px;
      label { display: block; font-weight: 600; margin-bottom: 8px; color: #475569; }
      input {
        width: 100%;
        padding: 10px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        outline: none;
        &:focus { border-color: var(--primary); }
      }
    }
  `]
})
export class AdminLessonEditComponent implements OnInit {
  lessonForm: FormGroup;
  isEditMode = signal(false);
  isSaving = signal(false);
  courseId: string = '';
  lessonId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService
  ) {
    this.lessonForm = this.fb.group({
      title: ['', Validators.required],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      order: [0, Validators.required]
    });
  }

  ngOnInit() {
    this.courseId = this.route.snapshot.paramMap.get('courseId') || '';
    this.lessonId = this.route.snapshot.paramMap.get('id');

    if (this.lessonId && this.lessonId !== 'new') {
      this.isEditMode.set(true);
      // Wait, getLesson normally expects courseSlug and lessonSlug.
      // But for admin editing, we might need ID.
      // Let's check getLesson frontend implementation.
      this.courseService.getLesson(this.courseId, this.lessonId).subscribe(lesson => {
        if (lesson) {
          this.lessonForm.patchValue({
            title: lesson.title,
            slug: lesson.slug,
            order: lesson.order
          });
        }
      });
    }

    // Auto-slug
    this.lessonForm.get('title')?.valueChanges.subscribe(title => {
      if (!this.isEditMode()) {
        const slug = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        this.lessonForm.get('slug')?.patchValue(slug, { emitEvent: false });
      }
    });
  }

  saveLesson() {
    if (this.lessonForm.invalid) return;
    this.isSaving.set(true);
    const data = this.lessonForm.value;

    if (this.isEditMode()) {
      this.courseService.updateLesson(this.lessonId!, data).subscribe({
        next: () => this.router.navigate(['/admin/courses', this.courseId, 'lessons']),
        error: () => this.isSaving.set(false)
      });
    } else {
      this.courseService.createLesson(this.courseId, data).subscribe({
        next: () => this.router.navigate(['/admin/courses', this.courseId, 'lessons']),
        error: () => this.isSaving.set(false)
      });
    }
  }
}
