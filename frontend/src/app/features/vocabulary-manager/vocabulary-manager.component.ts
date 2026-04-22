import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { VocabularyService } from '../../core/services/vocabulary.service';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { UserVocabulary } from '../../core/models/course.model';
import { map, combineLatest, startWith } from 'rxjs';
import { FlashcardSessionComponent } from '../../shared/components/flashcards/flashcard-session.component';

@Component({
  selector: 'app-vocabulary-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FlashcardSessionComponent],
  template: `
    <div class="vocab-manager">
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">My Vocabulary</h1>
          <p class="page-subtitle">You have {{ allVocab.length }} words in your collection.</p>
        </div>
        
        <div class="header-actions">
          <button *ngIf="allVocab.length > 0" class="primary-btn study-now" (click)="startStudy()">
            <span class="icon">🔥</span>
            Study Now
          </button>
          
          <div class="guest-mode-actions" *ngIf="!auth.isLoggedIn() && allVocab.length > 0">
            <div class="guest-warning">
              <span class="icon">⚠️</span>
              <span>Guest Mode: Words are saved locally.</span>
            </div>
            <div class="action-buttons">
              <a routerLink="/login" class="sync-link">Login to Sync</a>
              <button class="clear-btn" (click)="clearAll()">Clear All</button>
            </div>
          </div>
        </div>
      </div>

      <div class="manager-controls">
        <div class="search-box">
          <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" [(ngModel)]="searchQuery" placeholder="Search words or translations..." (ngModelChange)="updateFilters()">
        </div>

        <div class="filter-group">
          <button 
            *ngFor="let f of filters" 
            class="filter-btn" 
            [class.active]="activeFilter === f.key"
            (click)="setFilter(f.key)"
          >
            {{ f.label }}
          </button>
        </div>
      </div>

      <div class="vocab-grid" *ngIf="filteredVocab.length > 0; else emptyState">
        <div class="vocab-card" *ngFor="let item of displayedVocab">
          <div class="card-top">
            <div class="word-info">
              <h3 class="word-text">{{ item.word }}</h3>
              <span class="word-phonetic">{{ item.phonetic }}</span>
            </div>
            <div class="card-meta">
              <button class="card-fav-btn" [class.active]="item.is_favorite" (click)="toggleFavorite(item)" [title]="item.is_favorite ? 'Remove from favorites' : 'Add to favorites'">
                {{ item.is_favorite ? '❤️' : '♡' }}
              </button>
              <div class="review-status" [title]="'Next review: ' + (item.next_review | date:'mediumDate')">
                <span class="status-dot" [class.due]="isDue(item)"></span>
                {{ isDue(item) ? 'Due' : 'SRS' }}
              </div>
            </div>
          </div>
          
          <div class="card-content">
            <div class="translation-box">
              <label>Translation</label>
              <p>{{ item.translation }}</p>
            </div>
            <div class="example-box" *ngIf="item.example">
              <label>Example</label>
              <p>{{ item.example }}</p>
            </div>
          </div>

          <div class="card-footer">
            <button class="action-btn edit" (click)="editItem(item)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="action-btn delete" (click)="deleteItem(item)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Load More Pagination -->
      <div class="pagination-area" *ngIf="filteredVocab.length > itemsToShow">
        <button class="load-more-btn" (click)="loadMore()">
          <span class="btn-text">Load More</span>
          <span class="count-badge">{{ filteredVocab.length - itemsToShow }} words left</span>
        </button>
      </div>

      <ng-template #emptyState>
        <div class="empty-state">
          <div class="empty-icon">📚</div>
          <h2>No words found</h2>
          <p>{{ searchQuery ? 'Try a different search term.' : 'Start saving words from your lessons to see them here!' }}</p>
          <a routerLink="/" class="primary-btn" *ngIf="!searchQuery">Browse Courses</a>
        </div>
      </ng-template>
    </div>

    <!-- Edit Modal (Simplified for now) -->
    <div class="modal-overlay" *ngIf="editingItem">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Edit Word</h2>
          <button class="close-btn" (click)="editingItem = null">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Word</label>
            <input type="text" [value]="editingItem.word" disabled>
          </div>
          <div class="form-group">
            <label>Translation</label>
            <input type="text" [(ngModel)]="editBuffer.translation">
          </div>
          <div class="form-group">
            <label>Example</label>
            <textarea rows="3" [(ngModel)]="editBuffer.example"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="secondary-btn" (click)="editingItem = null">Cancel</button>
          <button class="primary-btn" (click)="saveEdit()">Save Changes</button>
        </div>
      </div>
    </div>

    <!-- Study Modal -->
    <app-flashcard-session 
      *ngIf="showStudyModal" 
      [words]="studySessionWords" 
      (close)="showStudyModal = false">
    </app-flashcard-session>
  `,
  styles: [`
    .vocab-manager { padding: 32px; max-width: 1200px; margin: 0 auto; }
    
    .page-header { 
      display: flex; justify-content: space-between; align-items: flex-start; 
      margin-bottom: 40px; gap: 24px; 
    }
    .page-title { font-size: 32px; font-weight: 800; color: var(--text-primary); margin-bottom: 8px; }
    .page-subtitle { color: var(--text-muted); font-size: 16px; }

    .header-actions {
      display: flex; align-items: center; gap: 20px;
    }
    
    .study-now {
      padding: 12px 28px; font-size: 16px; font-weight: 700;
      box-shadow: 0 4px 14px 0 rgba(var(--primary-rgb), 0.39);
    }

    .guest-mode-actions {
      display: flex; flex-direction: column; align-items: flex-end; gap: 8px;
    }
    
    .action-buttons {
      display: flex; gap: 12px; align-items: center;
    }

    .sync-link {
      font-size: 13px; font-weight: 600; color: var(--primary); background: none;
      text-decoration: underline; cursor: pointer;
    }

    .clear-btn {
      font-size: 12px; color: var(--text-muted); background: none; cursor: pointer;
      &:hover { color: #ef4444; }
    }

    .manager-controls {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 32px; gap: 24px; flex-wrap: wrap;
    }
    .search-box {
      position: relative; flex: 1; min-width: 300px;
      .search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
      input {
        width: 100%; padding: 12px 16px 12px 48px; border-radius: var(--radius-lg);
        border: 1.5px solid var(--border-color); background: var(--bg-white);
        font-size: 15px; transition: var(--transition);
        &:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 4px var(--primary-light); }
      }
    }

    .filter-group { display: flex; gap: 8px; }
    .filter-btn {
      padding: 10px 20px; border-radius: 20px; font-size: 14px; font-weight: 600;
      background: var(--bg-gray); color: var(--text-secondary); transition: var(--transition);
      cursor: pointer; &:hover { background: var(--border-color); }
      &.active { background: var(--primary); color: white; }
    }

    .vocab-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px;
    }
    .vocab-card {
      background: var(--bg-white); border: 1px solid var(--border-light);
      border-radius: var(--radius-lg); padding: 24px; display: flex; flex-direction: column;
      transition: var(--transition); &:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
    }
    .card-top {
      display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;
    }
    .word-text { font-size: 20px; font-weight: 800; color: var(--primary); margin-bottom: 4px; }
    .word-phonetic { font-size: 13px; color: var(--text-muted); font-family: 'Inter', sans-serif; }
    
    .card-meta { display: flex; align-items: center; gap: 12px; }
    .card-fav-btn {
      background: none; border: none; font-size: 18px; cursor: pointer; padding: 4px;
      line-height: 1; transition: var(--transition);
      color: var(--text-muted);
      &:hover { transform: scale(1.2); color: #ff4757; }
      &.active { color: #ff4757; }
    }
    .review-status {
      display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;
      padding: 4px 8px; background: var(--bg-gray); border-radius: 6px;
      .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; &.due { background: #ef4444; } }
    }

    .card-content { flex: 1; display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
    .card-content label { display: block; font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px; }
    .translation-box p { font-size: 16px; font-weight: 600; color: var(--text-primary); }
    .example-box p { font-size: 14px; color: var(--text-secondary); line-height: 1.5; font-style: italic; border-left: 3px solid var(--bg-gray); padding-left: 12px; }

    .card-footer {
      display: flex; justify-content: flex-end; gap: 12px; padding-top: 16px; border-top: 1px solid var(--bg-gray);
    }
    .action-btn {
      width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center;
      background: var(--bg-gray); color: var(--text-secondary); transition: var(--transition);
      &:hover.edit { background: var(--primary-light); color: var(--primary); }
      &:hover.delete { background: #fef2f2; color: #ef4444; }
    }

    .pagination-area {
      margin-top: 48px; display: flex; justify-content: center; padding-bottom: 40px;
    }
    .load-more-btn {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 16px 48px; border-radius: 20px; background: white;
      border: 1px solid var(--border-color); cursor: pointer; transition: var(--transition);
      box-shadow: var(--shadow-sm);
      &:hover { border-color: var(--primary); transform: translateY(-4px); box-shadow: var(--shadow-md); .btn-text { color: var(--primary); } }
      .btn-text { font-size: 16px; font-weight: 800; color: var(--text-primary); }
      .count-badge { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
    }

    .empty-state {
      padding: 80px 20px; text-align: center; background: var(--bg-white);
      border: 2px dashed var(--border-light); border-radius: var(--radius-xl);
      .empty-icon { font-size: 64px; margin-bottom: 24px; }
      h2 { font-size: 24px; font-weight: 700; color: var(--text-primary); margin-bottom: 12px; }
      p { color: var(--text-muted); margin-bottom: 32px; }
    }

    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px;
    }
    .modal-content {
      width: 100%; max-width: 500px; background: var(--bg-white); border-radius: var(--radius-xl); overflow: hidden;
    }
    .modal-header { padding: 20px 24px; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; }
    .modal-body { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
    .form-group label { display: block; font-size: 14px; font-weight: 600; margin-bottom: 8px; }
    .form-group input, .form-group textarea {
      width: 100%; padding: 12px; border-radius: var(--radius-md); border: 1.5px solid var(--border-color);
    }
    .modal-footer { padding: 20px 24px; border-top: 1px solid var(--border-light); display: flex; justify-content: flex-end; gap: 12px; }

    @media (max-width: 768px) {
      .vocab-manager { padding: 20px; }
      .page-header { flex-direction: column; align-items: stretch; }
      .header-actions { align-items: center; }
      .manager-controls { flex-direction: column; align-items: stretch; }
      .filter-group { overflow-x: auto; padding-bottom: 8px; }
    }
  `]
})
export class VocabularyManagerComponent implements OnInit {
  public vocabService = inject(VocabularyService);
  public auth = inject(AuthService);
  private notification = inject(NotificationService);
  private route = inject(ActivatedRoute);

  allVocab: UserVocabulary[] = [];
  filteredVocab: UserVocabulary[] = [];
  searchQuery = '';
  activeFilter = 'all';
  
  pageSize = 12;
  itemsToShow = 12;

  showStudyModal = false;
  studySessionWords: any[] = [];

  filters = [
    { key: 'all', label: 'All' },
    { key: 'favorites', label: 'Favorites ❤️' },
    { key: 'due', label: 'Due' },
    { key: 'learning', label: 'Learning' }
  ];

  editingItem: UserVocabulary | null = null;
  editBuffer = { translation: '', example: '' };

  ngOnInit() {
    this.vocabService.vocab$.subscribe((data: UserVocabulary[]) => {
      this.allVocab = data;
      this.updateFilters();
    });

    // Listen for query params to set active filter
    this.route.queryParamMap.subscribe(params => {
      const filter = params.get('filter');
      if (filter && this.filters.some(f => f.key === filter)) {
        this.activeFilter = filter;
        this.updateFilters();
      }
    });
  }

  get displayedVocab() {
    return this.filteredVocab.slice(0, this.itemsToShow);
  }

  loadMore() {
    this.itemsToShow += this.pageSize;
  }

  updateFilters() {
    this.itemsToShow = this.pageSize; // Reset pagination
    let result = [...this.allVocab];

    // Search
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(v => 
        v.word.toLowerCase().includes(q) || 
        v.translation.toLowerCase().includes(q)
      );
    }

    // Filter
    if (this.activeFilter === 'due') {
      result = result.filter(v => this.isDue(v));
    } else if (this.activeFilter === 'learning') {
      result = result.filter(v => !this.isDue(v));
    } else if (this.activeFilter === 'favorites') {
      result = result.filter(v => v.is_favorite);
    }

    this.filteredVocab = result;
  }

  toggleFavorite(item: UserVocabulary) {
    this.vocabService.toggleFavorite(item).subscribe({
      next: () => {
        // State is updated via service subscription
      },
      error: () => this.notification.show('Lỗi khi cập nhật yêu thích', 'error')
    });
  }

  setFilter(key: string) {
    this.activeFilter = key;
    this.updateFilters();
  }

  isDue(item: UserVocabulary): boolean {
    return new Date(item.next_review) <= new Date();
  }

  editItem(item: UserVocabulary) {
    this.editingItem = item;
    this.editBuffer = {
      translation: item.translation,
      example: item.example || ''
    };
  }

  saveEdit() {
    if (this.editingItem) {
      this.vocabService.updateWord(this.editingItem.id, this.editBuffer).subscribe({
        next: () => {
          this.editingItem = null;
          this.notification.show('Đã cập nhật từ vựng!');
        },
        error: () => this.notification.show('Lỗi khi cập nhật', 'error')
      });
    }
  }

  deleteItem(item: UserVocabulary) {
    if (confirm(`Bạn có chắc muốn xóa "${item.word}"?`)) {
      this.vocabService.deleteWord(item.id).subscribe({
        next: () => this.notification.show(`Đã xóa "${item.word}"`),
        error: () => this.notification.show('Lỗi khi xóa', 'error')
      });
    }
  }

  syncToCloud() {
    this.vocabService.syncToCloud().subscribe({
      next: () => this.notification.show('Đã đồng bộ dữ liệu thành công!'),
      error: () => this.notification.show('Lỗi đồng bộ dữ liệu', 'error')
    });
  }

  clearAll() {
    if (confirm('Bạn có chắc muốn xóa TẤT CẢ từ vựng không? Hành động này không thể hoàn tác.')) {
      localStorage.removeItem('user_vocabulary_guest');
      this.vocabService.refreshVocabulary();
      this.notification.show('Đã xóa bộ sưu tập từ vựng', 'info');
    }
  }

  startStudy() {
    // Determine which words to study based on filter or all
    if (this.activeFilter === 'due') {
      this.studySessionWords = this.allVocab.filter(v => this.isDue(v));
    } else {
      this.studySessionWords = [...this.allVocab];
    }
    
    if (this.studySessionWords.length === 0) {
      this.notification.show('Bạn không có từ nào cần ôn tập lúc này!', 'info');
      return;
    }
    
    this.showStudyModal = true;
  }
}
