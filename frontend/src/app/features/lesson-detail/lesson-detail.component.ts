import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CourseService } from '../../core/services/course.service';
import { Lesson, StoryLine, StoryContent } from '../../core/models/course.model';
import { AudioPlayerComponent } from '../../shared/components/audio-player/audio-player.component';
import { FlashcardSessionComponent } from '../../shared/components/flashcards/flashcard-session.component';

type StoryCategory = 'miniStories' | 'commentaries' | 'pointOfViews';

@Component({
  selector: 'app-lesson-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, AudioPlayerComponent, FlashcardSessionComponent],
  template: `
    <div class="lesson-detail" *ngIf="lesson()">
      <!-- Lesson Header -->
      <div class="lesson-header">
        <a [routerLink]="['/courses', courseSlug]" class="back-link">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/>
          </svg>
        </a>
        <div>
          <h1 class="lesson-title">{{ lesson()?.title }}</h1>
          <span class="lesson-course">Course Activity</span>
        </div>
      </div>

      <!-- Tab Navigation -->
      <nav class="tab-nav">
        <div class="tab-scroll">
          <button
            *ngFor="let tab of availableTabs"
            class="tab-btn"
            [class.active]="activeTab === tab.key"
            (click)="setActiveTab(tab.key)"
          >
            {{ tab.label }}
          </button>
        </div>
      </nav>

      <!-- Tab Content -->
      <div class="tab-content">

        <!-- Main Article -->
        <div *ngIf="activeTab === 'mainArticle'" class="content-card">
          <div class="content-header">
            <app-audio-player title="Main Article" [subtitle]="lesson()?.title || ''" [audioUrl]="lesson()?.mainArticle?.audioUrl || ''" />
          </div>
          <div class="article-body">
            <div class="article-english">
              <div class="article-text" [innerHTML]="lesson()?.mainArticle?.englishText"></div>
            </div>
            <div class="article-vietnamese">
              <div class="article-text" [innerHTML]="lesson()?.mainArticle?.vietnameseText"></div>
            </div>
          </div>
        </div>

        <!-- Vocabulary -->
        <div *ngIf="activeTab === 'vocabulary'" class="vocabulary-layout">
          <div class="content-card vocabulary-main">
            <div class="content-header">
              <app-audio-player #vocabPlayer title="Vocabulary" [subtitle]="lesson()?.title || ''" [audioUrl]="lesson()?.vocabulary?.audioUrl || ''" (timeUpdate)="onAudioTimeUpdate($event, 'vocabulary')" />
              <button 
                *ngIf="lesson()?.vocabulary?.keywords?.length"
                class="study-btn" 
                (click)="showFlashcards = true">
                <span class="icon">🎴</span>
                Study Flashcards
              </button>
            </div>
            <div class="vocab-paragraphs">
              <ng-container *ngIf="lesson()?.vocabulary?.lines?.length; else plainVocab">
                <div
                  *ngFor="let line of lesson()?.vocabulary?.lines"
                  class="vocab-paragraph clickable-line"
                  [class.highlighted]="line.isHighlighted"
                  (click)="onLineClick(line, vocabPlayer)"
                >
                  <p>{{ line.text }}</p>
                </div>
              </ng-container>
              <ng-template #plainVocab>
                <div
                  *ngFor="let p of lesson()?.vocabulary?.paragraphs; let i = index"
                  class="vocab-paragraph"
                  [class.highlighted]="i === 0"
                >
                  <p>{{ p }}</p>
                </div>
              </ng-template>
            </div>
          </div>

          <div class="keywords-panel">
            <h3 class="keywords-title">Keywords</h3>
            <div class="keywords-list">
              <div
                *ngFor="let kw of lesson()?.vocabulary?.keywords; let i = index"
                class="keyword-card"
              >
                <div class="kw-header">
                  <div class="kw-main-info">
                    <span class="kw-word">{{ kw.word }}</span>
                    <span class="kw-phonetic">{{ kw.phonetic }}</span>
                  </div>
                  <div class="kw-actions">
                    <button class="kw-audio-btn" (click)="saveToFlashcards(kw); $event.stopPropagation()" title="Add to Flashcards">❤️</button>
                    <button *ngIf="kw.audio" class="kw-audio-btn" (click)="playAudio(kw.audio); $event.stopPropagation()" title="Listen pronunciation">🔊</button>
                  </div>
                </div>
                <p class="kw-translation">{{ kw.translation }}</p>
                <p class="kw-example"><strong>Example:</strong> {{ kw.example }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Story Sections (Mini-Story, Point of View, Commentary) -->
        <div *ngIf="isStoryTab(activeTab)" class="content-card">
          <div class="content-header">
            <app-audio-player 
              #storyPlayer 
              [title]="getTabLabel(activeTab)" 
              [subtitle]="getActiveStory(activeTab)?.title || lesson()?.title || ''" 
              [audioUrl]="getActiveStory(activeTab)?.audioUrl || ''" 
              (timeUpdate)="onStoryTimeUpdate($event, activeTab)" />
          </div>

          <div class="story-body">
            <div class="story-card">
              <div
                *ngFor="let line of getActiveStory(activeTab)?.lines"
                class="story-line clickable-line"
                [class.highlighted]="line.isHighlighted"
                (click)="onLineClick(line, storyPlayer)"
              >
                <p>{{ line.text }}</p>
              </div>
              <div *ngIf="!getActiveStory(activeTab)?.lines?.length" class="empty-state">
                No transcript available for this part.
              </div>
            </div>
          </div>
        </div>
        
        <!-- Flashcard Study Overlay -->
        <app-flashcard-session 
          *ngIf="showFlashcards && lesson()?.vocabulary?.keywords" 
          [words]="lesson()!.vocabulary!.keywords" 
          (close)="showFlashcards = false" />
      </div>
    </div>
  `,
  styles: [`
    .lesson-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 24px; padding-top: 8px; }
    .back-link { width: 36px; height: 36px; border-radius: 50%; background: var(--bg-gray); display: flex; align-items: center; justify-content: center; color: var(--text-primary); transition: var(--transition); &:hover { background: var(--border-color); } }
    .lesson-title { font-size: 28px; font-weight: 800; color: var(--text-primary); line-height: 1.2; }
    .lesson-course { font-size: 13px; color: var(--text-muted); }
    .tab-nav { margin-bottom: 24px; border-bottom: 1px solid var(--border-light); }
    .tab-scroll { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; &::-webkit-scrollbar { display: none; } }
    .tab-btn { padding: 10px 20px; font-size: 14px; font-weight: 500; color: var(--text-secondary); border-radius: var(--radius-md) var(--radius-md) 0 0; transition: var(--transition); white-space: nowrap; &:hover { color: var(--text-primary); background: var(--bg-gray); } &.active { background: var(--primary); color: white; font-weight: 600; } }
    .sub-tabs { display: flex; gap: 8px; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px dashed var(--border-light); }
    .sub-tab-btn { padding: 6px 16px; font-size: 13px; font-weight: 600; border-radius: 20px; background: var(--bg-gray); color: var(--text-secondary); transition: var(--transition); &.active { background: var(--primary-light); color: var(--primary); } &:hover:not(.active) { background: var(--border-light); } }
    .content-card { 
      background: var(--bg-white); 
      border: 1px solid var(--border-light); 
      border-radius: var(--radius-lg); 
      padding: 28px 32px; 
    }
    .content-header { 
      display: flex; 
      align-items: center; 
      justify-content: space-between; 
      margin-bottom: 24px; 
      gap: 20px; 
    }
    .study-btn { 
      display: flex; 
      align-items: center; 
      gap: 8px; 
      padding: 10px 18px; 
      background: var(--bg-gray); 
      border: 1px solid var(--border-color); 
      color: var(--text-primary); 
      font-weight: 600; 
      font-size: 14px; 
      border-radius: var(--radius-md); 
      transition: var(--transition);
      white-space: nowrap;
      height: fit-content;
    }
    .article-body { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 40px; 
    }
    .article-english .article-text { font-size: 16px; line-height: 1.8; color: var(--text-primary); }
    .article-vietnamese .article-text { font-size: 15px; line-height: 1.8; color: var(--text-secondary); font-style: italic; }
    .vocabulary-layout { 
      display: flex;
      flex-direction: column;
      gap: 24px; 
    }
    .vocab-paragraphs { 
      display: flex; 
      flex-direction: column; 
      gap: 8px; 
      max-height: 450px; 
      overflow-y: auto; 
      padding: 24px; 
      background: var(--bg-white); 
      border: 1px solid var(--border-light); 
      border-radius: var(--radius-lg);
      position: relative; /* Add this to fix offsetTop calculation */
    }
    .vocab-paragraph { padding: 14px 20px; border-radius: var(--radius-sm); &.highlighted { border-left: 3px solid var(--highlight-border); background: var(--highlight-bg); p { color: var(--highlight-text); font-weight: 600; } } &.clickable-line { cursor: pointer; } }
    .keywords-panel { 
      background: var(--bg-white); 
      border: 1px solid var(--border-light); 
      border-radius: var(--radius-lg); 
      padding: 28px 32px; 
      box-shadow: var(--shadow-sm);
    }
    .keywords-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid var(--primary-light);
    }
    .keywords-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }
    .keyword-card {
      padding: 16px;
      border: 1.5px solid var(--border-color);
      border-radius: var(--radius-md);
      transition: var(--transition);
      background: var(--bg-light);
      cursor: pointer;
    }

    .keyword-card:hover {
      border-color: var(--primary);
      background: var(--primary-light);
      transform: translateX(4px);
      box-shadow: var(--shadow-md);
    }

    .kw-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 12px;
    }
    .kw-actions { display: flex; gap: 8px; }
    .kw-main-info {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }
    .kw-audio-btn {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      padding: 4px;
      border-radius: 50%;
      transition: var(--transition);
      line-height: 1;
      
      &:hover {
        background: var(--primary-light);
        transform: scale(1.1);
      }
    }
    .kw-word {
      font-size: 17px;
      font-weight: 800;
      color: var(--primary);
    }
    .kw-phonetic {
      font-size: 13px;
      color: var(--text-muted);
      font-family: 'Inter', sans-serif;
    }
    .kw-translation {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 8px;
    }
    .kw-example {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.4;
      padding-left: 10px;
      border-left: 2px solid var(--border-color);

      strong {
        color: var(--text-primary);
        font-weight: 600;
      }
    }
    .story-card { 
      width: 100%; 
      max-height: 450px; 
      overflow-y: auto; 
      padding: 32px 40px; 
      background: var(--bg-white); 
      border: 1px solid var(--border-light); 
      border-radius: var(--radius-lg); 
      box-shadow: var(--shadow-sm);
      position: relative;
    }
    .story-line { padding: 14px 20px; &.clickable-line { cursor: pointer; } &.highlighted { border-left: 3px solid var(--highlight-border); background: var(--highlight-bg); p { color: var(--highlight-text); font-weight: 600; } } }
    .empty-state { text-align: center; color: var(--text-muted); padding: 40px; font-style: italic; }
    @media (max-width: 900px) {
      .article-body { 
        grid-template-columns: 1fr; 
        gap: 24px;
      }
    }

    @media (max-width: 768px) {
      .lesson-header {
        margin-bottom: 16px;
      }
      .lesson-title {
        font-size: 20px;
      }
      .content-card {
        padding: 20px;
      }
      .content-header {
        flex-direction: column;
        align-items: stretch;
        gap: 16px;
      }
      .study-btn {
        width: 100%;
        justify-content: center;
      }
      .vocab-paragraphs, .story-card {
        padding: 16px;
        max-height: 400px;
      }
      .vocab-paragraph, .story-line {
        padding: 10px 14px;
      }
    }

    @media (max-width: 480px) {
      .lesson-title {
        font-size: 18px;
      }
      .tab-btn {
        padding: 8px 14px;
        font-size: 13px;
      }
    }
  `]
})
export class LessonDetailComponent implements OnInit {
  @ViewChild('vocabPlayer') vocabPlayer?: AudioPlayerComponent;
  @ViewChild('storyPlayer') storyPlayer?: AudioPlayerComponent;

  lesson = signal<Lesson | undefined>(undefined);
  activeTab = 'mainArticle';
  availableTabs: { key: string; label: string }[] = [];
  showFlashcards = false;

  courseSlug = '';
  lessonSlug = '';

  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.courseSlug = this.route.snapshot.paramMap.get('courseSlug')!;
    this.lessonSlug = this.route.snapshot.paramMap.get('lessonSlug')!;

    this.courseService.getLesson(this.courseSlug, this.lessonSlug).subscribe(lesson => {
      if (lesson) {
        this.lesson.set(lesson);
        this.buildTabs(lesson);
        if (this.availableTabs.length > 0) {
          this.activeTab = this.availableTabs[0].key;
        }
        this.loadAllVtts(lesson);
      }
    });
  }

  isStoryTab(tab: string): boolean {
    return tab.startsWith('miniStory') || tab.startsWith('commentary') || tab.startsWith('pointOfView');
  }

  getStories(tab: string): StoryContent[] {
    const lesson = this.lesson();
    if (!lesson) return [];
    if (tab.startsWith('miniStory')) return lesson.miniStories || [];
    if (tab.startsWith('commentary')) return lesson.commentaries || [];
    if (tab.startsWith('pointOfView')) return lesson.pointOfViews || [];
    return [];
  }

  getActiveStory(tab: string): StoryContent | undefined {
    const lesson = this.lesson();
    if (!lesson) return undefined;
    
    const [category, indexStr] = tab.split('_');
    const index = parseInt(indexStr, 10);
    
    if (category === 'miniStory') return lesson.miniStories?.[index];
    if (category === 'commentary') return lesson.commentaries?.[index];
    if (category === 'pointOfView') return lesson.pointOfViews?.[index];
    
    return undefined;
  }

  getTabLabel(key: string): string {
    return this.availableTabs.find(t => t.key === key)?.label || '';
  }

  setActiveTab(key: string) {
    this.activeTab = key;
    // Auto-play when switching
    setTimeout(() => {
      if (this.isStoryTab(key) && this.storyPlayer) {
        this.storyPlayer.play();
      } else if (key === 'vocabulary' && this.vocabPlayer) {
        this.vocabPlayer.play();
      }
    });
  }

  private buildTabs(lesson: Lesson) {
    this.availableTabs = [];
    if (lesson.mainArticle) this.availableTabs.push({ key: 'mainArticle', label: 'Main Article' });
    if (lesson.vocabulary) this.availableTabs.push({ key: 'vocabulary', label: 'Vocabulary' });
    
    lesson.miniStories?.forEach((s, i) => {
      this.availableTabs.push({ key: `miniStory_${i}`, label: s.title || `Mini-Story ${i + 1}` });
    });
    
    lesson.commentaries?.forEach((s, i) => {
      this.availableTabs.push({ key: `commentary_${i}`, label: s.title || `Commentary ${i + 1}` });
    });
    
    lesson.pointOfViews?.forEach((s, i) => {
      this.availableTabs.push({ key: `pointOfView_${i}`, label: s.title || `Point of View ${i + 1}` });
    });
  }

  private loadAllVtts(lesson: Lesson) {
    if (lesson.vocabulary?.vttUrl) this.loadVtt(lesson.vocabulary.vttUrl, 'vocabulary');
    lesson.miniStories?.forEach((s, i) => { if (s.vttUrl) this.loadVtt(s.vttUrl, 'miniStories', i); });
    lesson.commentaries?.forEach((s, i) => { if (s.vttUrl) this.loadVtt(s.vttUrl, 'commentaries', i); });
    lesson.pointOfViews?.forEach((s, i) => { if (s.vttUrl) this.loadVtt(s.vttUrl, 'pointOfViews', i); });
  }

  onAudioTimeUpdate(currentTime: number, type: 'vocabulary') {
    const lesson = this.lesson();
    if (!lesson || !lesson.vocabulary) return;
    this.syncLines(lesson.vocabulary.lines || [], currentTime, '.vocab-paragraphs .vocab-paragraph');
  }

  onStoryTimeUpdate(currentTime: number, tab: string) {
    const story = this.getActiveStory(tab);
    if (!story) return;
    this.syncLines(story.lines || [], currentTime, '.story-card .story-line');
  }

  private syncLines(lines: StoryLine[], currentTime: number, selector: string) {
    let newlyHighlighted = false;
    lines.forEach(line => {
      const isNowHighlighted = !!(line.start !== undefined && line.end !== undefined 
                           && currentTime >= line.start && currentTime <= line.end);
      if (isNowHighlighted && !line.isHighlighted) newlyHighlighted = true;
      line.isHighlighted = isNowHighlighted;
    });

    if (newlyHighlighted) {
      setTimeout(() => {
        const activeEl = document.querySelector(`${selector}.highlighted`) as HTMLElement;
        if (activeEl) {
          const container = activeEl.closest('.story-card, .vocab-paragraphs') as HTMLElement;
          if (container) {
            const scrollPos = activeEl.offsetTop - (container.offsetHeight / 2) + (activeEl.offsetHeight / 2);
            container.scrollTo({ 
              top: scrollPos, 
              behavior: 'smooth' 
            });
          }
        }
      }, 10);
    }
  }

  onLineClick(line: StoryLine, player: AudioPlayerComponent) {
    if (line.start !== undefined) player.seekToTime(line.start);
  }

  playAudio(url: string) {
    const audio = new Audio(url);
    audio.play();
  }

  saveToFlashcards(word: any) {
    this.courseService.addToFlashcards(word).subscribe({
      next: () => alert(`Saved "${word.word}" to your flashcards!`),
      error: (err) => console.error('Failed to save to flashcards', err)
    });
  }

  private loadVtt(vttUrl: string, type: 'miniStories' | 'commentaries' | 'pointOfViews' | 'vocabulary', index: number = 0) {
    this.http.get(vttUrl, { responseType: 'text' }).subscribe({
      next: (vttData) => {
        const parsed = this.parseVtt(vttData);
        const currentLesson = this.lesson();
        if (!currentLesson) return;
        
        const lines = parsed.map(p => ({ text: p.text, start: p.start, end: p.end, isHighlighted: false }));

        if (type === 'vocabulary' && currentLesson.vocabulary) {
          currentLesson.vocabulary.lines = lines;
        } else {
          const stories = currentLesson[type as StoryCategory];
          if (stories && stories[index]) stories[index].lines = lines;
        }
        
        // Trigger signal update to notify components of deep change
        this.lesson.set({ ...currentLesson });
      },
      error: (err) => console.error('Failed to load VTT', err)
    });
  }

  private parseVtt(vttContent: string): {start: number, end: number, text: string}[] {
    const lines = vttContent.split('\n').map(l => l.trimStart());
    const result = [];
    const timeReg = /(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/;
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(timeReg);
      if (match) {
        const start = this.timeToSeconds(match[1]);
        const end = this.timeToSeconds(match[2]);
        let text = '';
        let j = i + 1;
        while (j < lines.length && lines[j].trim() !== '' && !lines[j].match(timeReg) && !lines[j].match(/^\d+$/)) {
          text += lines[j] + ' ';
          j++;
        }
        result.push({ start, end, text: text.trim() });
        i = j - 1;
      }
    }
    return result;
  }

  private timeToSeconds(timeStr: string): number {
    const parts = timeStr.split(':');
    return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  }
}
