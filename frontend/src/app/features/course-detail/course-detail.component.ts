import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CourseService } from '../../core/services/course.service';
import { Course, Lesson } from '../../core/models/course.model';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="course-detail" *ngIf="course()">
      <!-- Hero Banner -->
      <div class="hero-banner">
        <img [src]="course()?.coverImage" [alt]="course()?.title" class="hero-bg" />
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <a routerLink="/" class="back-btn">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/>
            </svg>
          </a>
          <h1 class="hero-title">{{ course()?.title }}</h1>
          <span class="hero-level">{{ course()?.level }}</span>
          <p class="hero-desc">{{ course()?.description }}</p>
        </div>
      </div>

      <!-- Lesson List -->
      <div class="lesson-section">
        <div class="lesson-header">
          <h2 class="lesson-title">
            Lesson
            <span class="lesson-count">{{ lessons().length }}</span>
          </h2>
          <button class="download-btn">Download Textbook</button>
        </div>

        <div class="lesson-list">
          <a
            *ngFor="let lesson of lessons(); let i = index"
            [routerLink]="['/courses', course()?.slug, 'lessons', lesson.slug]"
            class="lesson-item"
          >
            <div class="lesson-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.5 5.5v9l7-4.5-7-4.5z"/>
              </svg>
            </div>
            <div class="lesson-info">
              <span class="lesson-number">LESSON {{ lesson.order }}</span>
              <h3 class="lesson-name">{{ lesson.title }}</h3>
            </div>
            <div class="lesson-progress">
              <span class="progress-text">{{ lesson.progress }}%</span>
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="lesson.progress"></div>
              </div>
            </div>
            <button class="learn-btn">Learn</button>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .course-detail {
      margin: 0;
      overflow-x: hidden;
    }

    /* Hero Banner */
    .hero-banner {
      position: relative;
      height: 320px;
      overflow: hidden;
      border-radius: 0 0 var(--radius-lg) var(--radius-lg);
    }

    .hero-bg {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to right,
        rgba(0, 0, 0, 0.7) 0%,
        rgba(0, 0, 0, 0.4) 60%,
        rgba(0, 0, 0, 0.2) 100%
      );
    }

    .hero-content {
      position: absolute;
      inset: 0;
      padding: 40px 48px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .back-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      margin-bottom: 16px;
      transition: var(--transition);
      cursor: pointer;

      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    }

    .hero-title {
      font-size: 36px;
      font-weight: 800;
      color: white;
      margin-bottom: 12px;
      line-height: 1.2;
    }

    .hero-level {
      display: inline-block;
      background: var(--primary);
      color: white;
      font-size: 12px;
      font-weight: 600;
      padding: 5px 14px;
      border-radius: var(--radius-xl);
      margin-bottom: 12px;
      width: fit-content;
    }

    .hero-desc {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.85);
      max-width: 500px;
      line-height: 1.5;
    }

    /* Lesson Section */
    .lesson-section {
      padding: 32px 48px 48px;
    }

    .lesson-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .lesson-title {
      font-size: 22px;
      font-weight: 700;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .lesson-count {
      font-size: 13px;
      font-weight: 600;
      background: var(--bg-gray);
      color: var(--text-secondary);
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .download-btn {
      padding: 10px 24px;
      border: 1.5px solid var(--primary);
      border-radius: var(--radius-xl);
      color: var(--primary);
      font-size: 14px;
      font-weight: 600;
      transition: var(--transition);

      &:hover {
        background: var(--primary);
        color: white;
      }
    }

    /* Lesson Items */
    .lesson-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .lesson-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px 24px;
      background: var(--bg-white);
      border: 1.5px solid var(--border-color);
      border-radius: var(--radius-md);
      transition: var(--transition);
      cursor: pointer;
      text-decoration: none;
    }

    .lesson-item:hover {
      border-color: var(--primary);
      background: var(--primary-light);
      box-shadow: var(--shadow-sm);
    }

    .lesson-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      background: var(--bg-gray);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      flex-shrink: 0;
      transition: var(--transition);
    }

    .lesson-item:hover .lesson-icon {
      background: var(--primary);
      color: white;
    }

    .lesson-info {
      flex: 1;
      min-width: 0;
    }

    .lesson-number {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted);
      letter-spacing: 0.8px;
    }

    .lesson-name {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-primary);
      margin-top: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .lesson-progress {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }

    .progress-text {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
    }

    .progress-bar {
      width: 100px;
      height: 4px;
      background: var(--border-color);
      border-radius: 2px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--primary);
      border-radius: 2px;
    }

    .learn-btn {
      padding: 8px 24px;
      background: var(--primary-light);
      color: var(--primary);
      font-size: 14px;
      font-weight: 600;
      border-radius: var(--radius-xl);
      transition: var(--transition);
      flex-shrink: 0;
    }

    .lesson-item:hover .learn-btn {
      background: var(--primary);
      color: white;
    }

    /* Tablet */
    @media (max-width: 1024px) {
      .hero-content {
        padding: 32px 28px;
      }

      .hero-title {
        font-size: 28px;
      }

      .lesson-section {
        padding: 24px 20px 32px;
      }
    }

    /* Mobile */
    @media (max-width: 600px) {
      .hero-banner {
        height: 240px;
        border-radius: 0;
      }

      .hero-overlay {
        background: linear-gradient(
          to top,
          rgba(0, 0, 0, 0.8) 0%,
          rgba(0, 0, 0, 0.3) 100%
        );
      }

      .hero-content {
        padding: 20px;
        justify-content: flex-end;
      }

      .back-btn {
        position: absolute;
        top: 16px;
        left: 16px;
        margin-bottom: 0;
      }

      .hero-title {
        font-size: 22px;
        margin-bottom: 8px;
      }

      .hero-level {
        font-size: 11px;
        padding: 4px 10px;
        margin-bottom: 8px;
      }

      .hero-desc {
        font-size: 13px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .lesson-section {
        padding: 20px 16px 24px;
      }

      .lesson-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .download-btn {
        width: 100%;
        text-align: center;
        padding: 10px;
      }

      .lesson-item {
        padding: 14px 16px;
        gap: 12px;
        flex-wrap: wrap;
      }

      .lesson-icon {
        width: 38px;
        height: 38px;
      }

      .lesson-name {
        font-size: 14px;
      }

      .lesson-progress {
        order: 4;
        width: 100%;
        padding-left: 50px;

        .progress-bar {
          flex: 1;
        }
      }

      .learn-btn {
        padding: 8px 18px;
        font-size: 13px;
      }
    }
  `]
})
export class CourseDetailComponent implements OnInit {
  course = signal<Course | undefined>(undefined);
  lessons = signal<Lesson[]>([]);

  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService
  ) {}

  ngOnInit() {
    const courseSlug = this.route.snapshot.paramMap.get('courseSlug')!;
    this.courseService.getCourse(courseSlug).subscribe(course => {
      this.course.set(course);
    });
    this.courseService.getLessons(courseSlug).subscribe(lessons => {
      this.lessons.set(lessons);
    });
  }
}
