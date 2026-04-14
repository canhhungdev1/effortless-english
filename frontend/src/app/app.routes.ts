import { Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/layouts/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'courses/:courseSlug',
        loadComponent: () =>
          import('./features/course-detail/course-detail.component').then(m => m.CourseDetailComponent)
      },
      {
        path: 'courses/:courseSlug/lessons/:lessonSlug',
        loadComponent: () =>
          import('./features/lesson-detail/lesson-detail.component').then(m => m.LessonDetailComponent)
      }
    ]
  }
];
