import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseService } from '../../../core/services/course.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-grid" *ngIf="stats()">
      <div class="stat-card">
        <div class="stat-icon courses">📚</div>
        <div class="stat-info">
          <span class="stat-label">Total Courses</span>
          <span class="stat-value">{{ stats().courses }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon lessons">📝</div>
        <div class="stat-info">
          <span class="stat-label">Total Lessons</span>
          <span class="stat-value">{{ stats().lessons }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon contents">🧩</div>
        <div class="stat-info">
          <span class="stat-label">Content Items</span>
          <span class="stat-value">{{ stats().contents }}</span>
        </div>
      </div>
    </div>

    <div class="main-content-grid">
      <div class="activity-section">
        <div class="section-header">
          <h3>Recent Activity</h3>
          <p>Latest lesson updates and additions</p>
        </div>
        
        <div class="activity-list" *ngIf="recentLessons().length > 0; else noActivity">
          <div class="activity-item" *ngFor="let lesson of recentLessons()">
            <div class="item-icon">📄</div>
            <div class="item-info">
              <div class="item-title">{{ lesson.title }}</div>
              <div class="item-meta">
                Course: <strong>{{ lesson.courseTitle }}</strong> • Updated {{ lesson.updatedAt | date:'short' }}
              </div>
            </div>
            <a [routerLink]="['/admin/courses', lesson.courseId, 'lessons']" class="view-btn">View</a>
          </div>
        </div>
        <ng-template #noActivity>
           <p class="empty-msg">No recent activity found.</p>
        </ng-template>
      </div>

      <div class="quick-links">
        <h3>Quick Actions</h3>
        <div class="link-grid">
          <a routerLink="/admin/courses/new" class="q-link">Add New Course</a>
          <a routerLink="/admin/courses" class="q-link">Browse Lessons</a>
        </div>

        <div class="maintenance-section" *ngIf="mediaStats()">
           <div class="m-divider"></div>
           <h4>Media Storage</h4>
           <div class="m-stats">
              <div class="m-stat">
                 <span>Total Usage:</span>
                 <strong>{{ mediaStats().totalSize }}</strong>
              </div>
              <div class="m-stat highlight" *ngIf="mediaStats().unusedFilesCount > 0">
                 <span>Unused Files:</span>
                 <strong>{{ mediaStats().unusedFilesCount }} ({{ mediaStats().unusedSize }})</strong>
              </div>
           </div>
           <button 
             class="cleanup-btn" 
             [disabled]="isCleaning() || mediaStats().unusedFilesCount === 0"
             (click)="cleanupMedia()"
           >
             {{ isCleaning() ? 'Cleaning...' : 'Cleanup Storage' }}
           </button>
        </div>
      </div>
    </div>

  `,
  styles: [`
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: white;
      padding: 24px;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }

    .stat-icon.courses { background: #eff6ff; }
    .stat-icon.lessons { background: #fdf2f8; }
    .stat-icon.contents { background: #f0fdf4; }

    .stat-info { display: flex; flex-direction: column; }
    .stat-label { font-size: 14px; color: #64748b; font-weight: 500; }
    .stat-value { font-size: 24px; font-weight: 700; color: #1e293b; }

    .main-content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 32px;
    }

    .activity-section {
      background: white;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      padding: 24px;
    }

    .section-header {
      margin-bottom: 24px;
      h3 { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
      p { font-size: 14px; color: #64748b; }
    }

    .activity-list { display: flex; flex-direction: column; gap: 16px; }
    .activity-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px;
      border-radius: 12px;
      &:hover { background: #f8fafc; }
      
      .item-icon { width: 40px; height: 40px; background: #f1f5f9; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
      .item-info { flex: 1; }
      .item-title { font-weight: 600; color: #1e293b; font-size: 14px; }
      .item-meta { font-size: 12px; color: #64748b; margin-top: 2px; }
      
      .view-btn { font-size: 13px; color: var(--primary); font-weight: 600; text-decoration: none; padding: 4px 12px; border: 1px solid var(--primary); border-radius: 6px; }
    }

    .quick-links {
      background: #1e293b;
      padding: 24px;
      border-radius: 16px;
      color: white;
      h3 { font-size: 18px; margin-bottom: 20px; }
      .link-grid { display: flex; flex-direction: column; gap: 12px; }
      .q-link {
        background: rgba(255,255,255,0.1);
        padding: 12px 16px;
        border-radius: 8px;
        text-decoration: none;
        color: white;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
        &:hover { background: rgba(255,255,255,0.2); transform: translateX(4px); }
      }
    }

    .maintenance-section {
      margin-top: 24px;
      h4 { font-size: 14px; margin-bottom: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
      .m-divider { height: 1px; background: rgba(255,255,255,0.1); margin-bottom: 20px; }
      .m-stats { margin-bottom: 20px; }
      .m-stat { 
        display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; 
        &.highlight { color: #fbbf24; }
      }
      .cleanup-btn {
        width: 100%; padding: 10px; border-radius: 8px; border: none; background: #ef4444; color: white;
        font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s;
        &:hover:not(:disabled) { background: #dc2626; }
        &:disabled { opacity: 0.5; cursor: not-allowed; }
      }
    }

    .empty-msg { text-align: center; color: #94a3b8; padding: 40px 0; font-style: italic; }

  `]
})
export class AdminDashboardComponent implements OnInit {
  stats = signal<any>(null);
  recentLessons = signal<any[]>([]);
  mediaStats = signal<any>(null);
  isLoading = signal(true);
  isCleaning = signal(false);

  constructor(private courseService: CourseService) {}

  ngOnInit() {
    this.loadStats();
    this.loadMediaStats();
  }

  loadStats() {
    this.courseService.getAdminStats().subscribe({
      next: (data) => {
        this.stats.set(data.stats);
        this.recentLessons.set(data.recentLessons);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load stats', err);
        this.isLoading.set(false);
      }
    });
  }

  loadMediaStats() {
    this.courseService.getMediaStatus().subscribe({
      next: (data) => this.mediaStats.set(data),
      error: (err) => console.error('Failed to load media stats', err)
    });
  }

  cleanupMedia() {
    if (!confirm('This will permanently delete all files not referenced in the database. Are you sure?')) {
      return;
    }

    this.isCleaning.set(true);
    this.courseService.cleanupMedia().subscribe({
      next: (res) => {
        alert(res.message);
        this.loadMediaStats();
        this.isCleaning.set(false);
      },
      error: (err) => {
        alert('Cleanup failed');
        console.error(err);
        this.isCleaning.set(false);
      }
    });
  }
}


