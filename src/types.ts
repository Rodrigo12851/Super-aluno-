export type FileType = 'video' | 'audio' | 'pdf' | 'text' | 'image';

export type StudyTarget = 'concurso' | 'vestibular' | 'faculdade' | 'revisao' | 'geral';

export type StudyDifficulty = 'iniciante' | 'medio' | 'avancado';

export interface KeyConcept {
  id: string;
  title: string;
  description: string;
  importance: 'alta' | 'media' | 'normal';
  timestampOrRef?: string;
}

export interface SummaryOutlineSection {
  title: string;
  keyPoints: string[];
  timestampOrRef?: string;
}

export interface SummaryData {
  title: string;
  subject: string;
  overview: string;
  keyConcepts: KeyConcept[];
  outline: SummaryOutlineSection[];
  keyQuotes: string[];
  examWarnings: string[]; // Pegadinhas / O que costuma cair na prova
  studyTips: string[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: string;
  difficulty: 'fácil' | 'médio' | 'difícil';
  status: 'learning' | 'mastered' | 'review';
  hint?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  topic: string;
}

export interface StudyPlanDay {
  day: number;
  title: string;
  tasks: string[];
  estimatedMinutes: number;
  focusArea: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  references?: string[];
}

export interface StudySession {
  id: string;
  title: string;
  createdAt: string;
  fileType: FileType;
  fileName: string;
  target: StudyTarget;
  difficulty: StudyDifficulty;
  summary: SummaryData;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  studyPlan: StudyPlanDay[];
  chatHistory: ChatMessage[];
  contentExcerpt?: string;
}

export interface ProcessStudyRequest {
  title?: string;
  fileType: FileType;
  fileName?: string;
  fileBase64?: string; // base64 representation if file is uploaded
  mimeType?: string;
  rawText?: string;
  target?: StudyTarget;
  difficulty?: StudyDifficulty;
  customInstructions?: string;
}
