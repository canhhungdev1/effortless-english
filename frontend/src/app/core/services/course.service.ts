import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Course, Lesson } from '../models/course.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/courses`);
  }

  getCourse(id: string): Observable<Course> {
    return this.http.get<Course>(`${this.apiUrl}/courses/${id}`);
  }

  getLessons(courseId: string): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.apiUrl}/lessons/${courseId}`);
  }

  getLesson(courseId: string, lessonId: string): Observable<Lesson> {
    return this.http.get<Lesson>(`${this.apiUrl}/lessons/${courseId}/${lessonId}`);
  }

  deleteCourse(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/courses/${id}`);
  }

  createCourse(course: any): Observable<Course> {
    return this.http.post<Course>(`${this.apiUrl}/courses`, course);
  }

  updateCourse(id: string, course: any): Observable<Course> {
    return this.http.patch<Course>(`${this.apiUrl}/courses/${id}`, course);
  }

  updateCoursesOrder(courses: { id: string; order: number }[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/courses/reorder`, courses);
  }


  createLesson(courseId: string, lesson: any): Observable<Lesson> {
    return this.http.post<Lesson>(`${this.apiUrl}/lessons/${courseId}`, lesson);
  }

  updateLesson(id: string, lesson: any): Observable<Lesson> {
    return this.http.patch<Lesson>(`${this.apiUrl}/lessons/${id}`, lesson);
  }

  deleteLesson(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/lessons/${id}`);
  }

  upsertLessonContent(lessonId: string, type: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/lessons/${lessonId}/content/${type}`, data);
  }

  deleteLessonContent(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/lessons/content/${id}`);
  }

  getAdminStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/stats`);
  }

  updateLessonsOrder(lessons: { id: string; order: number }[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/lessons/reorder`, lessons);
  }

  // Flashcards
  getDueFlashcards(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/flashcards/due`);
  }

  addToFlashcards(wordData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/flashcards/add`, wordData);
  }

  reviewFlashcard(id: string, rating: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/flashcards/review/${id}`, { rating });
  }

  getMediaStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/media/maintenance/status`);
  }

  cleanupMedia(): Observable<any> {
    return this.http.post(`${this.apiUrl}/media/maintenance/cleanup`, {});
  }
}

