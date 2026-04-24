import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserStats {
  history: any[];
  streak: number;
  level: number;
  xp: number;
}

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon_url: string;
  isEarned: boolean;
  earnedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GamificationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/gamification`;

  stats = signal<UserStats | null>(null);
  badges = signal<Badge[]>([]);
  newBadge$ = new Subject<Badge>();

  getStats(): Observable<UserStats> {
    return this.http.get<UserStats>(`${this.apiUrl}/stats`).pipe(
      tap(stats => this.stats.set(stats))
    );
  }

  getBadges(): Observable<Badge[]> {
    return this.http.get<Badge[]>(`${this.apiUrl}/badges`).pipe(
      tap(badges => this.badges.set(badges))
    );
  }

  trackActivity(data: { xp?: number; seconds?: number; words?: number }): Observable<any> {
    // If guest, store in localStorage
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('access_token');
    if (!hasToken) {
      this.trackGuestActivity(data);
      return new Observable(obs => obs.next({ guest: true }));
    }

    return this.http.post<any>(`${this.apiUrl}/track-activity`, data).pipe(
      tap(res => {
        if (res.newBadges?.length > 0) {
          res.newBadges.forEach((b: Badge) => this.newBadge$.next(b));
        }
      })
    );
  }

  private trackGuestActivity(data: { xp?: number; seconds?: number; words?: number }) {
    const guestData = JSON.parse(localStorage.getItem('guest_study_data') || '{"xp":0, "seconds":0, "words":0}');
    guestData.xp += (data.xp || 0);
    guestData.seconds += (data.seconds || 0);
    guestData.words += (data.words || 0);
    localStorage.setItem('guest_study_data', JSON.stringify(guestData));
  }

  syncGuestData(): Observable<any> {
    const guestData = localStorage.getItem('guest_study_data');
    if (!guestData) return new Observable(obs => obs.next(null));

    const data = JSON.parse(guestData);
    return this.http.post(`${this.apiUrl}/sync-guest`, data).pipe(
      tap(() => localStorage.removeItem('guest_study_data'))
    );
  }
}
