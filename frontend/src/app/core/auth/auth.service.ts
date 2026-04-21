import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError } from 'rxjs/operators';
import { of, BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  avatar?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  
  // Using BehaviorSubject for backward compatibility and RxJS streams
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  // Using Signals for modern Angular UI binding
  public userSignal = signal<User | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    this.checkInitialToken();
  }

  private checkInitialToken() {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');
    if (token && userData) {
      const user = JSON.parse(userData);
      this.currentUserSubject.next(user);
      this.userSignal.set(user);
    }
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => this.handleAuthSuccess(response))
    );
  }

  register(userData: { email: string; password: string; name: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => this.handleAuthSuccess(response))
    );
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    this.currentUserSubject.next(null);
    this.userSignal.set(null);
    this.router.navigate(['/']);
  }

  private handleAuthSuccess(response: AuthResponse) {
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('user_data', JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
    this.userSignal.set(response.user);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'ADMIN';
  }
}
