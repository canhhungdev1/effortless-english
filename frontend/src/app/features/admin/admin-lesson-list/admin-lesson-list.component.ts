import { Component, OnInit, signal, computed } from '@angular/core';
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
          <tr *ngFor="let lesson of displayedLessons()" cdkDrag class="lesson-row">
            <td class="drag-handle" cdkDragHandle>⋮⋮</td>
            <td><span class="order-badge">#{{ lesson.order }}</span></td>
            <td><span class="lesson-name">{{ lesson.title }}</span></td>
            <td><code>{{ lesson.slug }}</code></td>
            <td>
              <div class="actions">
                <button (click)="editLesson(lesson)" class="action-icon edit" title="Edit Info">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 16px; height: 16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.89 1.14l-2.8.93a.75.75 0 01-.95-.95l.93-2.8a4.5 4.5 0 011.14-1.89l8.931-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                </button>
                <div class="divider"></div>
                <button (click)="manageArticle(lesson)" class="action-icon content" title="Manage Article">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 16px; height: 16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                </button>
                <button (click)="manageVocabulary(lesson)" class="action-icon vocab" title="Manage Vocabulary">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 16px; height: 16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" /></svg>
                </button>
                <button (click)="manageMiniStory(lesson)" class="action-icon story" title="Manage Mini-Stories">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 16px; height: 16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
                </button>
                <button (click)="manageCommentary(lesson)" class="action-icon commentary" title="Manage Commentary">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 16px; height: 16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
                </button>
                <button (click)="managePOV(lesson)" class="action-icon pov" title="Manage Point of View">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 16px; height: 16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                </button>
                <div class="divider"></div>
                <button (click)="deleteLesson(lesson)" class="action-icon delete" title="Delete">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 16px; height: 16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                </button>
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
      
      <!-- Load More Button -->
      <div class="load-more-container" *ngIf="visibleCount() < lessons().length">
        <button class="load-more-btn" (click)="loadMore()">
          <span>Show More Lessons</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>
      </div>
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
      color: #64748b;
      transition: all 0.2s;
      
      &:hover { background: #f8fafc; border-color: #cbd5e1; }
      &.delete:hover { border-color: #fecaca; color: #ef4444; background: #fff1f2; }
      &.edit:hover { border-color: #bbf7d0; background: #f0fdf4; color: #22c55e; }
      &.content:hover { border-color: #bfdbfe; background: #eff6ff; color: #3b82f6; }
      &.vocab:hover { border-color: #fde047; background: #fef9c3; color: #ca8a04; }
      &.story:hover { border-color: #bae6fd; background: #f0f9ff; color: #0284c7; }
      &.commentary:hover { border-color: #e9d5ff; background: #faf5ff; color: #9333ea; }
      &.pov:hover { border-color: #fed7aa; background: #fff7ed; color: #ea580c; }
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

    /* Load More */
    .load-more-container {
      padding: 24px;
      display: flex;
      justify-content: center;
      border-top: 1px solid #f1f5f9;
    }

    .load-more-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 24px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      color: #475569;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s;
      cursor: pointer;

      &:hover {
        border-color: var(--primary);
        color: var(--primary);
        background: #f0f9ff;
        transform: translateY(-1px);
      }

      svg { transition: transform 0.3s ease; }
      &:hover svg { transform: translateY(2px); }
    }
  `]
})
export class AdminLessonListComponent implements OnInit {
  course = signal<Course | null>(null);
  lessons = signal<Lesson[]>([]);
  isLoading = signal(false);
  isSavingOrder = signal(false);
  courseId: string = '';

  pageSize = 5;
  visibleCount = signal(this.pageSize);

  displayedLessons = computed(() => {
    return this.lessons().slice(0, this.visibleCount());
  });


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
        this.visibleCount.set(this.pageSize); // Reset visible count on load
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load lessons', err);
        this.isLoading.set(false);
      }
    });

  }

  loadMore() {
    this.visibleCount.update(count => count + this.pageSize);
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
