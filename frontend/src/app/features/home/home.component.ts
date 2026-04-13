import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CourseService } from '../../core/services/course.service';
import { Course } from '../../core/models/course.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="home">
      <h1 class="page-title">Library</h1>
      <h2 class="section-title">Main Courses</h2>

      <div class="course-grid">
        <a
          *ngFor="let course of courses()"
          [routerLink]="['/courses', course.id]"
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

    .page-title {
      font-size: 28px;
      font-weight: 800;
      color: var(--primary);
      margin-bottom: 24px;
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

  constructor(private courseService: CourseService) {}

  ngOnInit() {
    this.courseService.getCourses().subscribe(courses => {
      this.courses.set(courses);
    });
  }
}
