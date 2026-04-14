export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: 'Beginner' | 'Pre-Intermediate' | 'Intermediate' | 'Advanced';
  coverImage: string;
  isVip: boolean;
  lessonCount: number;
}

export interface Lesson {
  id: string;
  slug: string;
  courseId: string;
  order: number;
  title: string;
  progress: number;
  mainArticle?: MainArticle;
  vocabulary?: Vocabulary;
  miniStories: StoryContent[];
  commentaries: StoryContent[];
  pointOfViews: StoryContent[];
}

export interface MainArticle {
  audioUrl?: string;
  vttUrl?: string;
  englishText: string;
  vietnameseText: string;
}

export interface VocabularyWord {
  word: string;
  phonetic: string;
  audio?: string;
  translation: string;
  example: string;
}

export interface Vocabulary {
  audioUrl?: string;
  vttUrl?: string;
  lines?: StoryLine[];
  paragraphs: string[];
  keywords: VocabularyWord[];
}

export interface StoryLine {
  start?: number;
  end?: number;
  text: string;
  isHighlighted: boolean;
}

export interface StoryContent {
  title?: string;
  audioUrl?: string;
  vttUrl?: string;
  lines: StoryLine[];
}
