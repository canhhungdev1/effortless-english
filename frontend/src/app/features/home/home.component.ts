import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CourseService } from '../../core/services/course.service';
import { AuthService } from '../../core/auth/auth.service';
import { Course } from '../../core/models/course.model';
import { VocabularyService } from '../../core/services/vocabulary.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="home">
      <div class="header-row">
        <h1 class="page-title">Library</h1>
        
        <div *ngIf="dueCount() > 0" class="review-banner" routerLink="/review">
          <div class="banner-content">
            <span class="banner-icon">🎴</span>
            <div class="banner-text">
              <span class="banner-label">Study Flashcards</span>
              <span class="banner-sub">You have <strong>{{ dueCount() }}</strong> words due for review</span>
            </div>
          </div>
          <button class="review-btn">Review Now</button>
        </div>
      </div>

      <!-- User Stats Dashboard -->
      <div class="stats-dashboard" *ngIf="userSignal()">
        <div class="stat-card streak">
          <div class="stat-header">
            <span class="stat-icon">🔥</span>
            <span class="stat-label">Daily Streak</span>
          </div>
          <div class="stat-value">{{ studyStats()?.streak || userSignal()?.streak || 0 }} Days</div>
        </div>
        
        <div class="stat-card level">
          <div class="stat-header">
            <span class="stat-icon">⭐</span>
            <span class="stat-label">Level {{ userSignal()?.level || 1 }}</span>
          </div>
          <div class="xp-container">
            <div class="xp-bar-wrapper">
              <div class="xp-bar" [style.width.%]="xpPercentage"></div>
            </div>
            <div class="xp-footer">
               <span class="xp-text">{{ userSignal()?.xp || 0 }} / {{ (userSignal()?.level || 1) * 100 }} XP</span>
            </div>
          </div>
        </div>
      </div>

      <h2 class="section-title">Main Courses</h2>

      <div class="course-grid">
        <a
          *ngFor="let course of courses()"
          [routerLink]="['/courses', course.slug]"
          class="course-card"
        >
          <div class="card-image">
            <img [src]="course.coverImage" [alt]="course.title" />
            <span *ngIf="course.isVip" class="vip-badge">VIP</span>
          </div>
          <div class="card-body">
            <span class="card-level">{{ course.level }}</span>
            <h3 class="card-title">{{ course.title }}</h3>
            <p class="card-desc">{{ course.description }}</p>
          </div>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .home {
      padding-top: 8px;
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      gap: 24px;
    }

    .page-title {
      font-size: 28px;
      font-weight: 800;
      color: var(--primary);
      margin: 0;
    }

    .stats-dashboard {
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 20px;
      margin-bottom: 32px;
      animation: slideIn 0.4s ease;
    }

    .stat-card {
      background: var(--bg-white);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-lg);
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      transition: var(--transition);
      &:hover { border-color: var(--primary-light); transform: translateY(-2px); }
    }

    .stat-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .stat-icon { font-size: 20px; }
    .stat-label { font-size: 13px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-value { font-size: 24px; font-weight: 800; color: var(--text-primary); }

    .xp-container { display: flex; flex-direction: column; gap: 8px; }
    .xp-bar-wrapper { height: 10px; background: var(--bg-gray); border-radius: 5px; overflow: hidden; }
    .xp-bar { height: 100%; background: linear-gradient(90deg, var(--primary), #818cf8); border-radius: 5px; transition: width 0.6s ease; }
    .xp-footer { display: flex; justify-content: flex-end; }
    .xp-text { font-size: 12px; font-weight: 600; color: var(--text-secondary); }

    @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .review-banner {
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      color: white;
      padding: 16px 24px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 32px;
      cursor: pointer;
      transition: var(--transition);
      box-shadow: var(--shadow-md);

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
        filter: brightness(1.1);
      }
    }

    .banner-content { display: flex; align-items: center; gap: 16px; }
    .banner-icon { font-size: 32px; }
    .banner-text { display: flex; flex-direction: column; }
    .banner-label { font-weight: 800; font-size: 16px; color: white; }
    .banner-sub { font-size: 13px; color: #cbd5e1; }
    
    .review-btn {
      background: white;
      color: #1e293b;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
    }

    .section-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 24px;
    }

    .course-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 28px;
    }

    .course-card {
      background: var(--bg-white);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-light);
      overflow: hidden;
      transition: var(--transition);
      cursor: pointer;

      &:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
        border-color: var(--primary-light);
      }
    }

    .card-image {
      position: relative;
      aspect-ratio: 3 / 4;
      overflow: hidden;
      background: var(--bg-gray);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.4s ease;
      }

      .course-card:hover & img {
        transform: scale(1.05);
      }
    }

    .vip-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      background: var(--primary);
      color: white;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      letter-spacing: 0.5px;
    }

    .card-body {
      padding: 16px 20px 20px;
    }

    .card-level {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-muted);
      text-transform: capitalize;
    }

    .card-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 6px 0 8px;
      line-height: 1.3;
    }

    .card-desc {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    @media (max-width: 1024px) {
      .course-grid {
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 20px;
      }
      .stats-dashboard { grid-template-columns: 1fr 1fr; }
    }

    @media (max-width: 600px) {
      .page-title {
        font-size: 24px;
        margin-bottom: 16px;
      }

      .section-title {
        font-size: 18px;
        margin-bottom: 16px;
      }

      .course-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .card-image {
        aspect-ratio: 3 / 3.5;
      }

      .card-body {
        padding: 10px 12px 14px;
      }

      .card-title {
        font-size: 14px;
      }

      .card-desc {
        font-size: 12px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .stats-dashboard { grid-template-columns: 1fr; }
    }

    @media (max-width: 380px) {
      .course-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .card-image {
        aspect-ratio: 3 / 4;
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  private courseService = inject(CourseService);
  private authService = inject(AuthService);
  private vocabService = inject(VocabularyService);

  courses = signal<Course[]>([]);
  dueCount = signal(0);
  userSignal = this.authService.userSignal;
  studyStats = signal<any>(null);

  constructor() {}

  get xpPercentage(): number {
    const user = this.userSignal();
    if (!user) return 0;
    const currentXp = user.xp || 0;
    const level = user.level || 1;
    const xpNeeded = level * 100;
    return Math.min(Math.round((currentXp / xpNeeded) * 100), 100);
  }

  ngOnInit() {
    this.courseService.getCourses().subscribe(courses => {
      this.courses.set(courses);
    });

    // Only sync vocabulary and profile once on init or when user state actually changes
    this.authService.currentUser$.subscribe((user: any) => {
      if (user) {
        this.authService.refreshProfile().subscribe();
        this.vocabService.refreshVocabulary(true).subscribe();
        this.vocabService.getStudyStats(true).subscribe(res => this.studyStats.set(res));
      } else {
        this.vocabService.refreshVocabulary(true).subscribe();
      }
    });

    // Listen to reactive stats stream for UI updates
    this.vocabService.stats$.subscribe(stats => {
      if (stats) this.dueCount.set(stats.dueCount);
    });
  }

  refreshStats() {
    // We can still trigger a refresh if needed, but the subscription above will handle the UI update
    this.vocabService.getReviewStats().subscribe();
  }
}
