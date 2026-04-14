import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';

@Component({
  selector: 'app-admin-story-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="header-actions">
      <div class="header-left">
        <a [routerLink]="['/admin/courses', courseId, 'lessons']" class="back-btn">← Back to Lessons</a>
        <h3 class="section-title">Manage {{ label }}: {{ lessonTitle() }}</h3>
      </div>
      <button class="add-btn" (click)="addStory()">
        <span class="icon">＋</span>
        Add New Item
      </button>
    </div>

    <div class="table-container">
      <div *ngIf="isLoading()" class="loading-state">
        <div class="spinner"></div>
        <p>Loading stories...</p>
      </div>

      <table class="admin-table" *ngIf="!isLoading()">
        <thead>
          <tr>
            <th>Title</th>
            <th>Audio URL</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let story of stories()">
            <td><span class="story-name">{{ story.title }}</span></td>
            <td><code>{{ story.audioUrl || 'No audio' }}</code></td>
            <td>
              <div class="actions">
                <button (click)="editStory(story)" class="action-icon edit" title="Edit">✏️</button>
                <button (click)="deleteStory(story)" class="action-icon delete" title="Delete">🗑️</button>
              </div>
            </td>
          </tr>
          <tr *ngIf="stories().length === 0">
            <td colspan="3" class="empty-state">No stories found. Add Mini-Story A to get started!</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .header-left { display: flex; flex-direction: column; gap: 8px; }
    .back-btn { color: #64748b; text-decoration: none; font-size: 14px; &:hover { color: var(--primary); } }
    .section-title { font-size: 20px; font-weight: 700; color: #1e293b; }

    .add-btn {
      background: var(--primary); color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600;
      display: flex; align-items: center; gap: 8px; cursor: pointer;
      &:hover { filter: brightness(1.1); }
    }

    .table-container { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    .admin-table {
      width: 100%; border-collapse: collapse; text-align: left;
      th { padding: 16px 24px; background: #f8fafc; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0; }
      td { padding: 16px 24px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    }

    .story-name { font-weight: 600; color: #1e293b; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; }
    .actions { display: flex; gap: 8px; }
    .action-icon {
      width: 32px; height: 32px; border-radius: 6px; border: 1px solid #e2e8f0; background: white;
      display: flex; align-items: center; justify-content: center; cursor: pointer;
      &:hover { background: #f8fafc; }
      &.delete:hover { border-color: #fecaca; color: var(--primary); }
    }

    .loading-state { padding: 60px; text-align: center; }
    .spinner { margin: 0 auto 16px; width: 40px; height: 40px; border: 3px solid #f1f5f9; border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state { padding: 40px !important; text-align: center; color: #94a3b8; font-style: italic; }
  `]
})
export class AdminStoryListComponent implements OnInit {
  courseId: string = '';
  lessonId: string = '';
  contentType: string = 'ministory'; // 'ministory', 'commentary', 'pov'
  lessonTitle = signal('');
  stories = signal<any[]>([]);
  isLoading = signal(true);

  typeLabels: {[key: string]: string} = {
    'ministory': 'Mini-Stories',
    'commentary': 'Commentaries',
    'pov': 'Point of Views'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService
  ) {}

  ngOnInit() {
    this.courseId = this.route.snapshot.paramMap.get('courseId') || '';
    this.lessonId = this.route.snapshot.paramMap.get('lessonId') || '';
    
    // Determine type from URL path (it's the last segment before 'new' or id)
    const segments = this.route.snapshot.url;
    if (segments.length > 0) {
      this.contentType = segments[segments.length - 1].path;
    }

    this.loadStories();
  }

  loadStories() {
    this.isLoading.set(true);
    this.courseService.getLesson(this.courseId, this.lessonId).subscribe({
      next: (lesson) => {
        if (lesson) {
          this.lessonTitle.set(lesson.title);
          
          // Map backend arrays to the signal
          if (this.contentType === 'ministory') this.stories.set(lesson.miniStories || []);
          else if (this.contentType === 'commentary') this.stories.set(lesson.commentaries || []);
          else if (this.contentType === 'pov') this.stories.set(lesson.pointOfViews || []);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  get label() { return this.typeLabels[this.contentType] || 'Stories'; }

  addStory() {
    this.router.navigate(['/admin/courses', this.courseId, 'lessons', this.lessonId, this.contentType, 'new']);
  }

  editStory(story: any) {
    this.router.navigate(['/admin/courses', this.courseId, 'lessons', this.lessonId, this.contentType, story.id]);
  }

  deleteStory(story: any) {
    if (confirm(`Are you sure you want to delete this ${this.contentType}?`)) {
      this.courseService.deleteLessonContent(story.id).subscribe(() => this.loadStories());
    }
  }
}
