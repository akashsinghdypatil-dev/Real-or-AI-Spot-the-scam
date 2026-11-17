import type { LeaderboardEntry, LeaderboardResponse, QuizQuestion } from "../types";

const LOCAL_STORAGE_KEY = "dyp_aicoe_leaderboard_v1";

function getTodayDateKey(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function readLocalEntries(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalEntries(entries: LeaderboardEntry[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(entries.slice(-100)));
  } catch {
    // Ignore storage quota errors
  }
}

function sortTop10(entries: LeaderboardEntry[]): LeaderboardResponse {
  const todayKey = getTodayDateKey();
  const todays = entries.filter((e) => e.dateKey === todayKey);
  const sorted = [...todays].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.durationSec !== b.durationSec) return a.durationSec - b.durationSec;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  return {
    todayKey,
    totalToday: todays.length,
    top10: sorted.slice(0, 10),
  };
}

export async function fetchQuestions(): Promise<QuizQuestion[]> {
  const res = await fetch("/questions.json", { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Could not load questions.json");
  }
  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("questions.json must contain an array");
  }
  return data as QuizQuestion[];
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Selects 5 random questions per visitor for a balanced ~90-second round:
 * mixes message, image, and audio questions and includes both Scam/AI and Safe/Real items.
 */
export function pickFiveQuizQuestions(allQuestions: QuizQuestion[]): QuizQuestion[] {
  if (allQuestions.length <= 5) return shuffle(allQuestions);

  const safePool = shuffle(
    allQuestions.filter((q) => q.answer.toLowerCase().includes("safe"))
  );
  const scamPool = shuffle(
    allQuestions.filter((q) => !q.answer.toLowerCase().includes("safe"))
  );

  const selected: QuizQuestion[] = [];
  const usedIds = new Set<string>();

  // Guarantee 1-2 safe/real items so the quiz feels fair
  const desiredSafeCount = Math.min(2, safePool.length);
  for (let i = 0; i < desiredSafeCount; i++) {
    selected.push(safePool[i]);
    usedIds.add(safePool[i].id);
  }

  // Ensure at least one image and one audio if not yet represented
  const remaining = shuffle(allQuestions.filter((q) => !usedIds.has(q.id)));
  const hasImage = selected.some((q) => q.type === "image");
  const hasAudio = selected.some((q) => q.type === "audio");

  if (!hasImage) {
    const img = remaining.find((q) => q.type === "image");
    if (img) {
      selected.push(img);
      usedIds.add(img.id);
    }
  }
  if (!hasAudio && selected.length < 5) {
    const aud = remaining.find((q) => q.type === "audio");
    if (aud) {
      selected.push(aud);
      usedIds.add(aud.id);
    }
  }

  // Fill remaining slots up to 5 with a bias toward messages/scams
  const rest = shuffle([
    ...scamPool.filter((q) => !usedIds.has(q.id)),
    ...allQuestions.filter((q) => !usedIds.has(q.id)),
  ]);

  for (const q of rest) {
    if (selected.length >= 5) break;
    if (!usedIds.has(q.id)) {
      selected.push(q);
      usedIds.add(q.id);
    }
  }

  return shuffle(selected).slice(0, 5);
}

export async function fetchLeaderboard(): Promise<LeaderboardResponse> {
  try {
    const res = await fetch("/api/leaderboard", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as LeaderboardResponse;
      return data;
    }
  } catch {
    // Fallback to local storage if server is unreachable
  }
  return sortTop10(readLocalEntries());
}

export async function saveLeaderboardScore(
  firstName: string,
  score: number,
  total: number,
  durationSec: number
): Promise<LeaderboardResponse> {
  const localEntry: LeaderboardEntry = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    firstName: firstName.trim().slice(0, 24),
    score,
    total,
    durationSec,
    badgeEarned: score >= 4,
    dateKey: getTodayDateKey(),
    createdAt: new Date().toISOString(),
  };

  const existingLocal = readLocalEntries();
  writeLocalEntries([...existingLocal, localEntry]);

  try {
    const res = await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, score, total, durationSec }),
    });
    if (res.ok) {
      return (await res.json()) as LeaderboardResponse;
    }
  } catch {
    // Fallback to local entries
  }

  return sortTop10([...existingLocal, localEntry]);
}
