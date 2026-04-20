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
      },
      {
        path: "flashcards",
        loadComponent: () =>
          import("./features/vocabulary-manager/vocabulary-manager.component").then(m => m.VocabularyManagerComponent)
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
      },
      {
        path: 'courses/:courseId/lessons',
        loadComponent: () => 
          import('./features/admin/admin-lesson-list/admin-lesson-list.component').then(m => m.AdminLessonListComponent)
      },
      {
        path: 'courses/:courseId/lessons/new',
        loadComponent: () => 
          import('./features/admin/admin-lesson-edit/admin-lesson-edit.component').then(m => m.AdminLessonEditComponent)
      },
      {
        path: 'courses/:courseId/lessons/edit/:id',
        loadComponent: () => 
          import('./features/admin/admin-lesson-edit/admin-lesson-edit.component').then(m => m.AdminLessonEditComponent)
      },
      {
        path: 'courses/:courseId/lessons/:lessonId/article',
        loadComponent: () => 
          import('./features/admin/admin-article-edit/admin-article-edit.component').then(m => m.AdminArticleEditComponent)
      },
      {
        path: 'courses/:courseId/lessons/:lessonId/vocabulary',
        loadComponent: () => 
          import('./features/admin/admin-vocabulary-edit/admin-vocabulary-edit.component').then(m => m.AdminVocabularyEditComponent)
      },
      {
        path: 'courses/:courseId/lessons/:lessonId/ministory',
        loadComponent: () => 
          import('./features/admin/admin-story-list/admin-story-list.component').then(m => m.AdminStoryListComponent)
      },
      {
        path: 'courses/:courseId/lessons/:lessonId/ministory/:id',
        loadComponent: () => 
          import('./features/admin/admin-story-edit/admin-story-edit.component').then(m => m.AdminStoryEditComponent)
      },
      {
        path: 'courses/:courseId/lessons/:lessonId/commentary',
        loadComponent: () => 
          import('./features/admin/admin-story-list/admin-story-list.component').then(m => m.AdminStoryListComponent)
      },
      {
        path: 'courses/:courseId/lessons/:lessonId/commentary/:id',
        loadComponent: () => 
          import('./features/admin/admin-story-edit/admin-story-edit.component').then(m => m.AdminStoryEditComponent)
      },
      {
        path: 'courses/:courseId/lessons/:lessonId/pov',
        loadComponent: () => 
          import('./features/admin/admin-story-list/admin-story-list.component').then(m => m.AdminStoryListComponent)
      },
      {
        path: 'courses/:courseId/lessons/:lessonId/pov/:id',
        loadComponent: () => 
          import('./features/admin/admin-story-edit/admin-story-edit.component').then(m => m.AdminStoryEditComponent)
      }
    ]
  }
];
