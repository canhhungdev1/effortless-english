import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CourseService } from '../../core/services/course.service';
import { Course } from '../../core/models/course.model';
import { FlashcardSessionComponent } from '../../shared/components/flashcards/flashcard-session.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FlashcardSessionComponent],
  template: `
    <div class="home">
      <div class="header-row">
        <h1 class="page-title">Library</h1>
        
        <div *ngIf="dueCount() > 0" class="review-banner" (click)="openReview()">
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

    <!-- Flashcard Review Overlay -->
    <app-flashcard-session 
      *ngIf="showReview()" 
      [words]="dueWords()" 
      (close)="closeReview()" />
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
  courses = signal<Course[]>([]);
  dueWords = signal<any[]>([]);
  dueCount = signal(0);
  showReview = signal(false);

  constructor(private courseService: CourseService) {}

  ngOnInit() {
    this.courseService.getCourses().subscribe(courses => {
      this.courses.set(courses);
    });

    this.loadDueFlashcards();
  }

  loadDueFlashcards() {
    this.courseService.getDueFlashcards().subscribe(words => {
      this.dueWords.set(words);
      this.dueCount.set(words.length);
    });
  }

  openReview() {
    if (this.dueCount() > 0) {
      this.showReview.set(true);
    }
  }

  closeReview() {
    this.showReview.set(false);
    this.loadDueFlashcards(); // Refresh count
  }
}
