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
  },
  {
    path: 'admin',
    loadComponent: () => 
      import('./features/admin/layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => 
          import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'courses',
        loadComponent: () => 
          import('./features/admin/admin-course-list/admin-course-list.component').then(m => m.AdminCourseListComponent)
      },
      {
        path: 'courses/new',
        loadComponent: () => 
          import('./features/admin/admin-course-edit/admin-course-edit.component').then(m => m.AdminCourseEditComponent)
      },
      {
        path: 'courses/edit/:id',
        loadComponent: () => 
          import('./features/admin/admin-course-edit/admin-course-edit.component').then(m => m.AdminCourseEditComponent)
      }
    ]
  }
];
