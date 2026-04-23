import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SKIP_LOADING } from '../interceptors/loading.interceptor';

@Injectable({
  providedIn: 'root'
})
export class GamificationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/gamification`;

  addXp(amount: number): Observable<any> {
    const context = new HttpContext().set(SKIP_LOADING, true);
    return this.http.post(`${this.apiUrl}/add-xp`, { amount }, { context });
  }
}
