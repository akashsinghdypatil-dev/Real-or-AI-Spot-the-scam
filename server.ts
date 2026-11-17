import "dotenv/config";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === "production";
const DATA_DIR = path.join(__dirname, "data");
const LEADERBOARD_FILE = path.join(DATA_DIR, "leaderboard.json");

const ASK_AI_SYSTEM_PROMPT =
  "You help Indian students spot scams at the #DYPAICoE launch. Input: a message the visitor pasted. Return: verdict (Likely scam, Looks safe, Not sure), 3 red flags or reasons in short lines, and what to do next. Max 70 words. If money was already lost, tell them to call 1930 or report at cybercrime.gov.in. Never ask for personal or bank details.";

interface LeaderboardRecord {
  id: string;
  firstName: string;
  score: number;
  total: number;
  durationSec: number;
  badgeEarned: boolean;
  dateKey: string;
  createdAt: string;
}

function getTodayDateKey(): string {
  // Use IST (Asia/Kolkata) date key so Pune booth leaderboard stays on today's event day
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function ensureLeaderboardStore(): LeaderboardRecord[] {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(LEADERBOARD_FILE)) {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify([], null, 2), "utf8");
    return [];
  }
  try {
    const raw = fs.readFileSync(LEADERBOARD_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLeaderboardStore(records: LeaderboardRecord[]): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(records, null, 2), "utf8");
}

function getTodayTop10(records: LeaderboardRecord[]): {
  todayKey: string;
  totalToday: number;
  top10: LeaderboardRecord[];
} {
  const todayKey = getTodayDateKey();
  const todaysEntries = records.filter((r) => r.dateKey === todayKey);
  const sorted = [...todaysEntries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.durationSec !== b.durationSec) return a.durationSec - b.durationSec;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  return {
    todayKey,
    totalToday: todaysEntries.length,
    top10: sorted.slice(0, 10),
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  // Health & feature availability check (quiz works regardless of Gemini)
  app.get("/api/health", (_req, res) => {
    const aiEnabled =
      Boolean(process.env.GEMINI_API_KEY) &&
      process.env.DISABLE_AI !== "true";
    res.json({
      ok: true,
      aiAvailable: aiEnabled,
      todayKey: getTodayDateKey(),
    });
  });

  // Leaderboard GET: returns today's top 10
  app.get("/api/leaderboard", (_req, res) => {
    const records = ensureLeaderboardStore();
    res.json(getTodayTop10(records));
  });

  // Leaderboard POST: saves first name and score in built-in file storage
  app.post("/api/leaderboard", (req, res) => {
    const rawName = typeof req.body?.firstName === "string" ? req.body.firstName.trim() : "";
    const firstName = rawName.replace(/\s+/g, " ").slice(0, 24);
    const score = Number(req.body?.score);
    const total = Number(req.body?.total) || 5;
    const durationSec = Math.max(1, Math.min(600, Math.round(Number(req.body?.durationSec) || 60)));

    if (!firstName) {
      res.status(400).json({ error: "First name is required." });
      return;
    }
    if (!Number.isFinite(score) || score < 0 || score > total) {
      res.status(400).json({ error: "Invalid score." });
      return;
    }

    const records = ensureLeaderboardStore();
    const entry: LeaderboardRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      firstName,
      score,
      total,
      durationSec,
      badgeEarned: score >= 4,
      dateKey: getTodayDateKey(),
      createdAt: new Date().toISOString(),
    };
    records.push(entry);
    writeLeaderboardStore(records);

    res.status(201).json({
      entry,
      ...getTodayTop10(records),
    });
  });

  // Optional Ask the AI endpoint (Scamsense + AI Money Leak Detector style analysis via Gemini)
  app.post("/api/ask-ai", async (req, res) => {
    if (process.env.DISABLE_AI === "true") {
      res.status(503).json({
        error: "Ask the AI is currently disabled. The 90-second quiz and leaderboard continue to work normally.",
      });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(503).json({
        error: "Gemini API key is not configured. Check Settings > Secrets or use the offline quiz.",
      });
      return;
    }

    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    if (!message || message.length < 4) {
      res.status(400).json({ error: "Please paste a message (at least 4 characters) to analyze." });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: message.slice(0, 1500),
        config: {
          systemInstruction: ASK_AI_SYSTEM_PROMPT,
        },
      });

      const text = (response.text ?? "").trim();
      if (!text) {
        res.status(502).json({ error: "AI returned an empty response. Please try again." });
        return;
      }

      res.json({ analysis: text });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to reach Gemini right now.";
      console.error("[/api/ask-ai error]", msg);
      res.status(502).json({
        error: "Gemini is temporarily unreachable. The quiz and safety card still work offline.",
      });
    }
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Real or AI: Spot the Scam booth server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
