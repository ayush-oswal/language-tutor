import type {
  CEFRLevel,
  Exercise,
  ExerciseAttempt,
  ExerciseStatus,
  ExerciseType,
  User,
  Word,
  WordProgress,
  WordStatus,
} from "@lt/db";

export type {
  CEFRLevel,
  Exercise,
  ExerciseAttempt,
  ExerciseStatus,
  ExerciseType,
  User,
  Word,
  WordProgress,
  WordStatus,
};

export interface ExerciseWithAttempts extends Exercise {
  attempts: ExerciseAttempt[]; // ordered createdAt desc — attempts[0] is the most recent
}

// ---------- Language ----------

export interface LanguageSummary {
  id: string;
  name: string;
  languageCode: string;
  currentLevel: CEFRLevel;
  wordCount: number;
  createdAt: Date;
}

export interface LanguageDetail extends LanguageSummary {
  updatedAt: Date;
  vocabularyStats: VocabularyStats;
}

// ---------- Vocabulary ----------

export interface NewWordInput {
  word: string;
  translation: string;
  partOfSpeech?: string;
  metadata?: Record<string, unknown>;
}

export type WordWithProgress = Word & { progress: WordProgress | null };

export interface PaginatedWords {
  words: WordWithProgress[];
  total: number;
  page: number;
  pageSize: number;
}

export interface VocabularyStats {
  total: number;
  new: number;
  learning: number;
  familiar: number;
  mastered: number;
}

export interface DedupWord {
  word: string;
  normalizedWord: string;
  translation: string;
}

// ---------- Revision / Learner Context ----------

export interface RevisionCandidate {
  wordId: string;
  word: string;
  translation: string;
  mastery: number;
  status: WordStatus;
  timesSeen: number;
  timesCorrect: number;
  timesWrong: number;
  lastSeenAt: Date | null;
  nextReviewAt: Date | null;
}

export interface LearnerContext {
  language: {
    id: string;
    name: string;
    languageCode: string;
    level: CEFRLevel;
  };
  vocabulary: VocabularyStats;
  weakWords: RevisionCandidate[];
  overdueWords: RevisionCandidate[];
  recentlyPracticedWords: RevisionCandidate[];
}

// ---------- Exercise payloads ----------

export interface McOption {
  id: string;
  text: string;
}

export interface MultipleChoiceQuestion {
  id: string;
  wordIds: string[];
  prompt: string;
  options: McOption[];
  hint: string;
}

export interface MultipleChoicePayload {
  schemaVersion: 1;
  questions: MultipleChoiceQuestion[];
}

export interface MultipleChoiceAnswerKey {
  schemaVersion: 1;
  answers: Record<string, string>; // questionId -> correct optionId
}

export interface MatchingItem {
  id: string;
  wordId: string;
  text: string;
  hint: string;
}

export interface MatchingPayload {
  schemaVersion: 1;
  items: MatchingItem[];
  options: McOption[];
}

export interface MatchingAnswerKey {
  schemaVersion: 1;
  correctPairs: Record<string, string>; // itemId -> optionId
}

export interface TranslationQuestion {
  id: string;
  wordIds: string[];
  prompt: string;
  direction: "TO_TARGET" | "TO_NATIVE";
  hint: string;
}

export interface TranslationPayload {
  schemaVersion: 1;
  questions: TranslationQuestion[];
}

export interface TranslationAnswerKey {
  schemaVersion: 1;
  answers: Record<string, string[]>; // questionId -> accepted answers
}

export interface FillBlankQuestion {
  id: string;
  wordIds: string[];
  sentence: string;
  translation?: string;
  acceptedAnswers: string[];
  hint: string;
}

export interface FillBlankPayload {
  schemaVersion: 1;
  questions: FillBlankQuestion[];
}

export interface FillBlankAnswerKey {
  schemaVersion: 1;
  answers: Record<string, string[]>;
}

export interface StoryMatchingItem {
  id: string;
  wordId: string;
  text: string;
  hint: string;
}

/**
 * Story questions deliberately mix mechanics (rather than always being
 * multiple-choice) — same shapes as the standalone revision exercise types,
 * embedded inline in the narrative.
 */
export type StoryQuestionNode =
  | {
      id: string;
      kind: "question";
      questionType: "MULTIPLE_CHOICE";
      wordIds: string[];
      prompt: string;
      translation: string;
      options: McOption[];
      hint: string;
    }
  | { id: string; kind: "question"; questionType: "TRANSLATION"; wordIds: string[]; prompt: string; direction: "TO_TARGET" | "TO_NATIVE"; hint: string }
  | {
      id: string;
      kind: "question";
      questionType: "FILL_BLANK";
      wordIds: string[];
      sentence: string;
      translation: string;
      acceptedAnswers: string[];
      hint: string;
    }
  | { id: string; kind: "question"; questionType: "MATCHING"; items: StoryMatchingItem[]; options: McOption[] };

export type StoryNode =
  | { id: string; kind: "narrative"; text: string; translation: string; wordIds?: string[] }
  | StoryQuestionNode;

export interface StoryPayload {
  schemaVersion: 1;
  nodes: StoryNode[];
}

export type StoryAnswerKeyEntry =
  | { questionType: "MULTIPLE_CHOICE"; correctOptionId: string }
  | { questionType: "TRANSLATION" | "FILL_BLANK"; acceptedAnswers: string[] }
  | { questionType: "MATCHING"; correctPairs: Record<string, string> };

export interface StoryAnswerKey {
  schemaVersion: 1;
  answers: Record<string, StoryAnswerKeyEntry>; // question node id -> type-specific answer key entry
}

export interface NewWordCandidate {
  tempId: string;
  word: string;
  normalizedWord: string;
  translation: string;
  partOfSpeech?: string;
  metadata?: Record<string, unknown>;
}

export interface NewWordLearningPayload {
  schemaVersion: 1;
  candidates: NewWordCandidate[];
  stage1: { presentations: { tempId: string }[] };
  stage2: { items: { id: string; tempId: string; text: string; hint: string }[]; options: McOption[] };
  stage3: {
    questions: { id: string; tempId: string; prompt: string; options: McOption[]; hint: string }[];
  };
}

export interface NewWordLearningAnswerKey {
  schemaVersion: 1;
  stage2CorrectPairs: Record<string, string>; // itemId -> optionId
  stage3Answers: Record<string, string>; // questionId -> optionId
}

export type RevisionExerciseType =
  | "MATCHING"
  | "MULTIPLE_CHOICE"
  | "TRANSLATION"
  | "FILL_BLANK";

// ---------- Attempts / scoring ----------

export interface QuestionResult {
  questionId: string;
  wordIds: string[];
  correct: boolean;
  submitted: unknown;
  expected: unknown;
}

export interface ScoreResult {
  score: number;
  percentage: number;
  questionResults: QuestionResult[];
}

export interface ExerciseSummary {
  id: string;
  languageId: string;
  type: ExerciseType;
  status: ExerciseStatus;
  createdAt: Date;
  completedAt: Date | null;
}

export interface ExerciseResult {
  exercise: Exercise;
  attempt: {
    id: string;
    score: number;
    percentage: number;
    questionResults: QuestionResult[];
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
