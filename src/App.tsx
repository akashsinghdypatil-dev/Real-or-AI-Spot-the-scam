/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import type { AppTab, QuizQuestion } from "./types";
import { fetchQuestions } from "./lib/storage";
import { QuizView } from "./components/QuizView";
import { LeaderboardView } from "./components/LeaderboardView";
import { AskAiView } from "./components/AskAiView";
import { SafetyCardView } from "./components/SafetyCardView";
import { QuestionBankView } from "./components/QuestionBankView";

const NAV_ITEMS: { id: AppTab; label: string }[] = [
  { id: "quiz", label: "Quiz" },
  { id: "leaderboard", label: "Leaderboard" },
  { id: "ask-ai", label: "Ask the AI" },
  { id: "safety-card", label: "Safety Card" },
  { id: "questions", label: "All 20 Questions" },
];

function getInitialTab(): AppTab {
  if (typeof window === "undefined") return "quiz";
  const hash = window.location.hash.replace("#", "") as AppTab;
  const validTabs: AppTab[] = ["quiz", "leaderboard", "ask-ai", "safety-card", "questions"];
  return validTabs.includes(hash) ? hash : "quiz";
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>(getInitialTab);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(true);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [aiAvailable, setAiAvailable] = useState<boolean>(true);
  const [leaderboardRefreshSignal, setLeaderboardRefreshSignal] = useState<number>(0);

  useEffect(() => {
    fetchQuestions()
      .then((data) => {
        setQuestions(data);
        setQuestionsError(null);
      })
      .catch((err: unknown) => {
        setQuestionsError(
          err instanceof Error ? err.message : "Could not load /questions.json"
        );
      })
      .finally(() => setIsLoadingQuestions(false));

    // Non-blocking health check for optional Ask the AI tab
    fetch("/api/health")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.aiAvailable === "boolean") {
          setAiAvailable(data.aiAvailable);
        }
      })
      .catch(() => {
        setAiAvailable(false);
      });
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      setActiveTab(getInitialTab());
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const handleNavigateTab = (tab: AppTab) => {
    setActiveTab(tab);
    window.location.hash = tab;
  };

  return (
    <div className="min-h-screen bg-[#15233F] text-white flex flex-col">
      {/* 3-Zone Top Bar */}
      <header className="no-print border-b border-white/10 bg-[#15233F]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-6 py-4">
          {/* Zone 1: Single-line Wordmark */}
          <a
            href="#quiz"
            onClick={(e) => {
              e.preventDefault();
              handleNavigateTab("quiz");
            }}
            className="font-display text-xl font-extrabold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            Real or AI
          </a>

          {/* Zone 2: 5 concise single-line text nav links */}
          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigateTab(item.id);
                  }}
                  className={`border-b-2 py-1 transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? "border-[#F28C38] text-white"
                      : "border-transparent text-slate-300 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary CTA */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() =>
                handleNavigateTab(activeTab === "leaderboard" ? "quiz" : "leaderboard")
              }
              className="rounded-lg bg-[#F28C38] px-4 py-2 text-xs font-bold text-[#15233F] transition-colors hover:bg-[#f59c52] whitespace-nowrap shrink-0 cursor-pointer"
            >
              {activeTab === "leaderboard" ? "Play Quiz" : "Big Screen Board"}
            </button>
          </div>
        </div>

        {/* Mobile navigation row */}
        <nav
          aria-label="Mobile"
          className="flex md:hidden items-center gap-4 overflow-x-auto border-t border-white/10 px-6 py-2.5 text-xs font-medium"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigateTab(item.id)}
                className={`whitespace-nowrap shrink-0 py-1 ${
                  isActive
                    ? "font-bold text-[#F28C38]"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Content Stage */}
      <main className="no-print flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {activeTab === "quiz" && (
          <QuizView
            allQuestions={questions}
            isLoadingQuestions={isLoadingQuestions}
            questionsError={questionsError}
            onNavigateTab={handleNavigateTab}
            onScoreSaved={() => setLeaderboardRefreshSignal((n) => n + 1)}
          />
        )}

        {activeTab === "leaderboard" && (
          <LeaderboardView refreshSignal={leaderboardRefreshSignal} />
        )}

        {activeTab === "ask-ai" && <AskAiView aiAvailable={aiAvailable} />}

        {activeTab === "safety-card" && <SafetyCardView />}

        {activeTab === "questions" && <QuestionBankView questions={questions} />}
      </main>

      {/* Quiet Institutional Footer */}
      <footer className="no-print border-t border-white/10 px-6 py-5 text-center text-xs text-slate-400">
        #DYPAICoE Launch · Dr. D. Y. Patil B-School, Pune · Report cyber fraud at 1930 or
        cybercrime.gov.in
      </footer>
    </div>
  );
}
