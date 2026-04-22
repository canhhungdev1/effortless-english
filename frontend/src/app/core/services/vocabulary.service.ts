import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap, switchMap, forkJoin, catchError } from 'rxjs';
import { SKIP_LOADING } from '../interceptors/loading.interceptor';
import { environment } from '../../../environments/environment';
import { UserVocabulary, VocabularyWord, ReviewRating } from '../models/course.model';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class VocabularyService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/flashcards`;
  private LOCAL_STORAGE_KEY = 'user_vocabulary_guest';

  // State
  private vocabSubject = new BehaviorSubject<UserVocabulary[]>([]);
  vocab$ = this.vocabSubject.asObservable();

  private statsSubject = new BehaviorSubject<any>(null);
  stats$ = this.statsSubject.asObservable();

  constructor() {
    // Initial load based on auth state
    this.auth.currentUser$.subscribe((user: any) => {
      if (user) {
        // Automatically sync local guest data if it exists when user logs in
        this.syncToCloud().pipe(
          switchMap(() => {
            this.refreshVocabulary();
            return of(null);
          })
        ).subscribe();
      } else {
        this.refreshVocabulary();
      }
    });
  }

  refreshVocabulary(skipLoading: boolean = false) {
    this.refreshStats(); // Always refresh stats when vocabulary is refreshed
    
    if (this.auth.isLoggedIn()) {
      const context = skipLoading ? new HttpContext().set(SKIP_LOADING, true) : new HttpContext();
      this.http.get<UserVocabulary[]>(`${this.apiUrl}/all`, { context }).subscribe(data => {
        this.vocabSubject.next(data);
      });
    } else {
      const localData = this.getLocalVocab();
      this.vocabSubject.next(localData);
    }
  }

  addWord(word: VocabularyWord): Observable<any> {
    if (this.auth.isLoggedIn()) {
      return this.http.post(`${this.apiUrl}/add`, word, {
        context: new HttpContext().set(SKIP_LOADING, true)
      }).pipe(
        tap(() => this.refreshVocabulary(true))
      );
    } else {
      const localData = this.getLocalVocab();
      const newEntry: UserVocabulary = {
        ...word,
        id: crypto.randomUUID(),
        user_id: 'guest',
        is_favorite: true,
        interval: 0,
        repetitions: 0,
        ease_factor: 2.5,
        next_review: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      
      const updated = [newEntry, ...localData.filter(v => v.word !== word.word)];
      this.saveLocalVocab(updated);
      this.vocabSubject.next(updated);
      return of(newEntry);
    }
  }

  toggleFavorite(word: VocabularyWord): Observable<any> {
    if (this.auth.isLoggedIn()) {
      // Optimistic Update
      const currentVocab = this.vocabSubject.value;
      const updatedVocab = currentVocab.map(v => 
        v.word === word.word ? { ...v, is_favorite: !v.is_favorite } : v
      );
      this.vocabSubject.next(updatedVocab);

      return this.http.post(`${this.apiUrl}/toggle-favorite`, word).pipe(
        tap({
          error: () => this.vocabSubject.next(currentVocab),
          next: () => this.refreshVocabulary(true)
        })
      );
    } else {
      const localData = this.getLocalVocab();
      const existing = localData.find(v => v.word === word.word);
      let updated: UserVocabulary[];

      if (existing) {
        updated = localData.map(v => 
          v.word === word.word ? { ...v, is_favorite: !v.is_favorite } : v
        );
      } else {
        const newEntry: UserVocabulary = {
          ...word,
          id: crypto.randomUUID(),
          user_id: 'guest',
          is_favorite: true,
          interval: 0,
          repetitions: 0,
          ease_factor: 2.5,
          next_review: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
        updated = [newEntry, ...localData];
      }

      this.saveLocalVocab(updated);
      this.vocabSubject.next(updated);
      return of(updated.find(v => v.word === word.word));
    }
  }

  deleteWord(id: string): Observable<any> {
    if (this.auth.isLoggedIn()) {
      // Optimistic Update: Remove from local state immediately
      const currentVocab = this.vocabSubject.value;
      const updatedVocab = currentVocab.filter(v => v.id !== id);
      this.vocabSubject.next(updatedVocab);

      return this.http.delete(`${this.apiUrl}/${id}`).pipe(
        tap({
          error: () => {
            // Revert on error
            this.vocabSubject.next(currentVocab);
          },
          next: () => this.refreshVocabulary(true) // Silently refresh in background
        })
      );
    } else {
      const filtered = this.getLocalVocab().filter(v => v.id !== id);
      this.saveLocalVocab(filtered);
      this.vocabSubject.next(filtered);
      return of({ success: true });
    }
  }

  updateWord(id: string, data: Partial<VocabularyWord>): Observable<any> {
    if (this.auth.isLoggedIn()) {
      return this.http.patch(`${this.apiUrl}/${id}`, data).pipe(
        tap(() => this.refreshVocabulary())
      );
    } else {
      const updated = this.getLocalVocab().map(v => 
        v.id === id ? { ...v, ...data } : v
      );
      this.saveLocalVocab(updated);
      this.vocabSubject.next(updated);
      return of({ success: true });
    }
  }

  reviewWord(id: string, rating: ReviewRating): Observable<any> {
    if (this.auth.isLoggedIn()) {
      return this.http.patch(`${this.apiUrl}/review/${id}`, { rating }, {
        context: new HttpContext().set(SKIP_LOADING, true)
      }).pipe(
        tap(() => this.refreshVocabulary(true))
      );
    } else {
      // Simple SM-2 implementation for LocalStorage
      const updated = this.getLocalVocab().map(v => {
        if (v.id === id) {
          const nextDate = new Date();
          // Simplified logic: 0 -> 1h, 1 -> 1d, 2 -> 4d, 3 -> 7d
          const days = rating === 0 ? 0 : (rating === 1 ? 1 : (rating === 2 ? 4 : 7));
          nextDate.setDate(nextDate.getDate() + days);
          return { ...v, next_review: nextDate.toISOString() };
        }
        return v;
      });
      this.saveLocalVocab(updated);
      this.vocabSubject.next(updated);
      return of({ success: true });
    }
  }

  ensureWordAndReview(word: any, rating: ReviewRating): Observable<any> {
    // If the word already has an ID, it's already in the collection
    if (word.id && word.id !== 'guest') {
      return this.reviewWord(word.id, rating);
    }

    // Otherwise, first add it to the collection, then review it
    return this.addWord(word).pipe(
      switchMap(addedWord => {
        // Now that we have an ID, we can review it
        return this.reviewWord(addedWord.id, rating);
      })
    );
  }

  private defaultStats = { dueCount: 0, totalCount: 0, masteredCount: 0, forecast: [] };

  getReviewStats(): Observable<any> {
    if (this.auth.isLoggedIn()) {
      return this.http.get<any>(`${this.apiUrl}/stats`).pipe(
        tap(stats => this.statsSubject.next(stats)),
        catchError(err => {
          console.error('Error fetching review stats:', err);
          this.statsSubject.next(this.defaultStats);
          return of(this.defaultStats);
        })
      );
    } else {
      const localData = this.getLocalVocab();
      const now = new Date();
      const dueCount = localData.filter(v => new Date(v.next_review) <= now).length;
      const stats = {
        dueCount,
        totalCount: localData.length,
        masteredCount: 0, 
        forecast: []
      };
      this.statsSubject.next(stats);
      return of(stats);
    }
  }

  getStudyStats(): Observable<any> {
    if (!this.auth.isLoggedIn()) return of({ streak: 0, heatmap: [] });
    return this.http.get<any>(`${this.apiUrl}/study-stats`).pipe(
      catchError(err => {
        console.error('Error fetching study stats:', err);
        return of({ streak: 0, heatmap: [] });
      })
    );
  }

  refreshStats() {
    this.getReviewStats().subscribe();
  }

  syncToCloud(): Observable<any> {
    const localData = this.getLocalVocab();
    if (localData.length === 0 || !this.auth.isLoggedIn()) return of(null);

    return this.http.post(`${this.apiUrl}/sync`, localData).pipe(
      tap(() => {
        localStorage.removeItem(this.LOCAL_STORAGE_KEY);
        this.refreshVocabulary();
      })
    );
  }

  private getLocalVocab(): UserVocabulary[] {
    const data = localStorage.getItem(this.LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveLocalVocab(data: UserVocabulary[]) {
    localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(data));
  }
}
