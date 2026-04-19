import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { Course, Lesson } from '../../../core/models/course.model';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-admin-lesson-list',
  standalone: true,
  imports: [CommonModule, RouterLink, DragDropModule],
  template: `
    <div class="header-actions">
      <div class="header-left">
        <a routerLink="/admin/courses" class="back-btn">← Back to Courses</a>
        <h3 class="section-title">Lessons: {{ course()?.title }}</h3>
      </div>
      <div class="header-right-btns">
        <span class="saving-badge" *ngIf="isSavingOrder()">Saving order...</span>
        <button class="add-btn" (click)="addLesson()">
          <span class="icon">＋</span>
          Add New Lesson
        </button>
      </div>

    </div>

    <div class="table-container">
      <div *ngIf="isLoading()" class="loading-state">
        <div class="spinner"></div>
        <p>Loading lessons...</p>
      </div>

      <table class="admin-table" *ngIf="!isLoading()">
        <thead>
          <tr>
            <th style="width: 50px"></th>
            <th style="width: 80px">Order</th>
            <th>Lesson Title</th>
            <th>Slug</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody cdkDropList (cdkDropListDropped)="drop($event)">
          <tr *ngFor="let lesson of lessons()" cdkDrag class="lesson-row">
            <td class="drag-handle" cdkDragHandle>⋮⋮</td>
            <td><span class="order-badge">#{{ lesson.order }}</span></td>
            <td><span class="lesson-name">{{ lesson.title }}</span></td>
            <td><code>{{ lesson.slug }}</code></td>
            <td>
              <div class="actions">
                <button (click)="editLesson(lesson)" class="action-icon edit" title="Edit Info">✏️</button>
                <div class="divider"></div>
                <button (click)="manageArticle(lesson)" class="action-icon content" title="Manage Article">📄</button>
                <button (click)="manageVocabulary(lesson)" class="action-icon vocab" title="Manage Vocabulary">🔤</button>
                <button (click)="manageMiniStory(lesson)" class="action-icon story" title="Manage Mini-Stories">🎭</button>
                <button (click)="manageCommentary(lesson)" class="action-icon commentary" title="Manage Commentary">🗣️</button>
                <button (click)="managePOV(lesson)" class="action-icon pov" title="Manage Point of View">🔄</button>
                <div class="divider"></div>
                <button (click)="deleteLesson(lesson)" class="action-icon delete" title="Delete">🗑️</button>
              </div>
            </td>

            <!-- Drag Preview (Giống Course) -->
            <div *cdkDragPreview class="drag-preview">
               📄 {{ lesson.title }}
            </div>
          </tr>

          <tr *ngIf="lessons().length === 0">
            <td colspan="5" class="empty-state">No lessons found. Add your first lesson!</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .header-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    
    .header-right-btns { display: flex; gap: 12px; }

    .header-left {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .back-btn {
      color: #64748b;
      text-decoration: none;
      font-size: 14px;
      &:hover { color: var(--primary); }
    }

    .section-title { font-size: 20px; font-weight: 700; color: #1e293b; }

    .add-btn {
      background: var(--primary);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      &:hover { filter: brightness(1.1); }
    }
    
    .saving-badge {
      background: #fef9c3;
      color: #854d0e;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      animation: pulse 1.5s infinite;
      display: flex;
      align-items: center;
    }
    @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }


    .table-container {
      background: white;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }

    .admin-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;

      th {
        padding: 16px 24px;
        background: #f8fafc;
        font-size: 13px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        border-bottom: 1px solid #e2e8f0;
      }

      td {
        padding: 16px 24px;
        border-bottom: 1px solid #f1f5f9;
        font-size: 14px;
      }
    }

    .drag-handle { 
      cursor: grab; 
      color: #94a3b8; 
      font-weight: bold; 
      font-size: 18px; 
      user-select: none;
      text-align: center;
      &:active { cursor: grabbing; }
    }

    .lesson-row {
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
    }


    .order-badge {
      background: #eff6ff;
      color: #3b82f6;
      padding: 4px 8px;
      border-radius: 6px;
      font-weight: 700;
      font-family: monospace;
    }

    .lesson-name { font-weight: 600; color: #1e293b; }

    code {
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 13px;
    }

    .actions { display: flex; gap: 8px; }

    .action-icon {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover { background: #f8fafc; }
      &.delete:hover { border-color: #fecaca; color: var(--primary); }
      &.content:hover { border-color: #cbd5e1; background: #f0fdf4; }
      &.vocab:hover { border-color: #cbd5e1; background: #fef9c3; }
      &.story:hover { border-color: #cbd5e1; background: #f0f9ff; }
      &.commentary:hover { border-color: #cbd5e1; background: #faf5ff; }
      &.pov:hover { border-color: #cbd5e1; background: #fff7ed; }
    }

    .divider {
      width: 1px;
      height: 24px;
      background: #e2e8f0;
      margin: 0 4px;
    }

    .loading-state {
      padding: 60px;
      text-align: center;
      color: #64748b;
    }

    .spinner {
      margin: 0 auto 16px;
      width: 40px;
      height: 40px;
      border: 3px solid #f1f5f9;
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state {
      padding: 40px !important;
      text-align: center;
      color: #94a3b8;
      font-style: italic;
    }
  `]
})
export class AdminLessonListComponent implements OnInit {
  course = signal<Course | null>(null);
  lessons = signal<Lesson[]>([]);
  isLoading = signal(false);
  isSavingOrder = signal(false);
  courseId: string = '';


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService
  ) {}

  ngOnInit() {
    this.courseId = this.route.snapshot.paramMap.get('courseId') || '';
    if (this.courseId) {
      this.loadData();
    }
  }

  loadData() {
    this.isLoading.set(true);
    // Get Course details
    this.courseService.getCourse(this.courseId).subscribe(course => {
      this.course.set(course);
    });

    // Get Lessons
    this.courseService.getLessons(this.courseId).subscribe({
      next: (lessons) => {
        this.lessons.set(lessons);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load lessons', err);
        this.isLoading.set(false);
      }
    });

  }

  drop(event: CdkDragDrop<Lesson[]>) {
    const lessonsArray = [...this.lessons()];
    moveItemInArray(lessonsArray, event.previousIndex, event.currentIndex);
    
    // Update temporary orders for UI feedback
    lessonsArray.forEach((lesson, index) => {
      lesson.order = index + 1;
    });
    
    this.lessons.set(lessonsArray);
    this.saveOrder();
  }

  saveOrder() {
    this.isSavingOrder.set(true);
    const orderData = this.lessons().map(l => ({ id: l.id, order: l.order }));
    
    this.courseService.updateLessonsOrder(orderData).subscribe({
      next: () => {
        setTimeout(() => this.isSavingOrder.set(false), 1000);
      },
      error: (err) => {
        console.error('Failed to save order', err);
        this.isSavingOrder.set(false);
        this.loadData(); // Revert
        alert('Failed to save order.');
      }
    });
  }


  addLesson() {
    this.router.navigate(['/admin/courses', this.courseId, 'lessons', 'new']);
  }

  editLesson(lesson: Lesson) {
    this.router.navigate(['/admin/courses', this.courseId, 'lessons', 'edit', lesson.id]);
  }

  manageArticle(lesson: Lesson) {
    this.router.navigate(['/admin/courses', this.courseId, 'lessons', lesson.id, 'article']);
  }

  manageVocabulary(lesson: Lesson) {
    this.router.navigate(['/admin/courses', this.courseId, 'lessons', lesson.id, 'vocabulary']);
  }

  manageMiniStory(lesson: Lesson) {
    this.router.navigate(['/admin/courses', this.courseId, 'lessons', lesson.id, 'ministory']);
  }

  manageCommentary(lesson: Lesson) {
    this.router.navigate(['/admin/courses', this.courseId, 'lessons', lesson.id, 'commentary']);
  }

  managePOV(lesson: Lesson) {
    this.router.navigate(['/admin/courses', this.courseId, 'lessons', lesson.id, 'pov']);
  }

  deleteLesson(lesson: Lesson) {
    if (confirm(`Are you sure you want to delete "${lesson.title}"?`)) {
      this.courseService.deleteLesson(lesson.id).subscribe({
        next: () => this.loadData(),
        error: (err) => {
          alert('Failed to delete lesson');
          console.error(err);
        }
      });
    }
  }
}
