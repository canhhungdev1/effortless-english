import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { Course } from '../../../core/models/course.model';

@Component({
  selector: 'app-admin-course-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="header-actions">
      <h3 class="section-title">Course Management</h3>
      <button class="add-btn" routerLink="/admin/courses/new">
        <span class="icon">＋</span>
        Create New Course
      </button>
    </div>

    <div class="table-container">
      <div *ngIf="isLoading()" class="loading-state">
        <div class="spinner"></div>
        <p>Loading courses...</p>
      </div>

      <table class="admin-table" *ngIf="!isLoading()">
        <thead>
          <tr>
            <th>Course</th>
            <th>Slug</th>
            <th>Level</th>
            <th>Lessons</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let course of courses()">
            <td>
              <div class="course-cell">
                <img [src]="course.coverImage" [alt]="course.title" class="table-thumb">
                <span class="course-name">{{ course.title }}</span>
              </div>
            </td>
            <td><code>{{ course.slug }}</code></td>
            <td><span class="badge level">{{ course.level }}</span></td>
            <td>{{ course.lessonCount }} lessons</td>
            <td><span class="badge status">Active</span></td>
            <td>
              <div class="actions">
                <button (click)="editCourse(course)" class="action-icon edit" title="Edit">✏️</button>
                <button (click)="viewLessons(course)" class="action-icon view" title="View Lessons">👁️</button>
                <button (click)="deleteCourse(course)" class="action-icon delete" title="Delete">🗑️</button>
              </div>
            </td>
          </tr>
          <tr *ngIf="courses().length === 0">
            <td colspan="6" class="empty-state">No courses found. Add your first course!</td>
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
      transition: all 0.2s;

      &:hover { filter: brightness(1.1); }
    }

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
        letter-spacing: 0.5px;
        border-bottom: 1px solid #e2e8f0;
      }

      td {
        padding: 16px 24px;
        border-bottom: 1px solid #f1f5f9;
        font-size: 14px;
        color: #475569;
      }
    }

    .course-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .table-thumb {
      width: 40px;
      height: 48px;
      object-fit: cover;
      border-radius: 4px;
      background: #f1f5f9;
    }

    .course-name { font-weight: 600; color: #1e293b; }

    code {
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 13px;
    }

    .badge {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;

      &.level { background: #eff6ff; color: #3b82f6; }
      &.status { background: #f0fdf4; color: #22c55e; }
    }

    .actions {
      display: flex;
      gap: 8px;
    }

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
      font-size: 14px;

      &:hover { background: #f8fafc; border-color: #cbd5e1; }
      &.delete:hover { background: #fff1f2; border-color: #fecaca; }
    }

    .loading-state {
      padding: 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      color: #64748b;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f1f5f9;
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-state {
      padding: 40px !important;
      text-align: center;
      color: #94a3b8;
      font-style: italic;
    }
  `]
})
export class AdminCourseListComponent implements OnInit {
  courses = signal<Course[]>([]);
  isLoading = signal(false);

  constructor(
    private courseService: CourseService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCourses();
  }

  loadCourses() {
    this.isLoading.set(true);
    this.courseService.getCourses().subscribe({
      next: (courses) => {
        this.courses.set(courses);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load courses', err);
        this.isLoading.set(false);
      }
    });
  }

  deleteCourse(course: Course) {
    if (confirm(`Are you sure you want to delete "${course.title}"?`)) {
      this.courseService.deleteCourse(course.id).subscribe({
        next: () => {
          this.loadCourses();
        },
        error: (err) => {
          alert('Failed to delete course');
          console.error(err);
        }
      });
    }
  }

  viewLessons(course: Course) {
    this.router.navigate(['/admin/courses', course.id, 'lessons']);
  }

  editCourse(course: Course) {
    this.router.navigate(['/admin/courses/edit', course.id]);
  }
}
