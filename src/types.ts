export type QuestionType = "message" | "image" | "audio";

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  topic?: string;
  content: string;
  transcript?: string;
  options: string[];
  answer: string;
  tip: string;
}

export interface LeaderboardEntry {
  id: string;
  firstName: string;
  score: number;
  total: number;
  durationSec: number;
  badgeEarned: boolean;
  dateKey: string;
  createdAt: string;
}

export interface LeaderboardResponse {
  todayKey: string;
  totalToday: number;
  top10: LeaderboardEntry[];
}

export type AppTab = "quiz" | "leaderboard" | "ask-ai" | "safety-card" | "questions";
