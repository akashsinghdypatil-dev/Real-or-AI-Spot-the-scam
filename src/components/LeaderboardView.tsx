import { useCallback, useEffect, useState } from "react";
import { Maximize2, Minimize2, RefreshCw, Trophy } from "lucide-react";
import type { LeaderboardResponse } from "../types";
import { fetchLeaderboard } from "../lib/storage";

interface LeaderboardViewProps {
  refreshSignal: number;
}

export function LeaderboardView({ refreshSignal }: LeaderboardViewProps) {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [secondsToRefresh, setSecondsToRefresh] = useState<number>(10);
  const [isBigScreen, setIsBigScreen] = useState<boolean>(false);

  const loadLeaderboard = useCallback(async () => {
    try {
      const res = await fetchLeaderboard();
      setData(res);
      setSecondsToRefresh(10);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard, refreshSignal]);

  // Auto-refresh every 10 seconds for the booth big screen
  useEffect(() => {
    const interval = window.setInterval(() => {
      setSecondsToRefresh((prev) => {
        if (prev <= 1) {
          loadLeaderboard();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [loadLeaderboard]);

  const toggleBigScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => setIsBigScreen(true))
        .catch(() => setIsBigScreen((v) => !v));
    } else {
      document
        .exitFullscreen()
        .then(() => setIsBigScreen(false))
        .catch(() => setIsBigScreen(false));
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-10">
        {/* Big-Screen Header */}
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-slate-200 pb-6">
          <div>
            <p className="text-sm font-semibold text-[#F28C38]">
              #DYPAICoE Live Booth Standings · {data?.todayKey || "Today"}
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#15233F] sm:text-4xl">
              Today&apos;s Top 10 Scam Spotters
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              <span className="font-mono-tabular font-semibold text-[#15233F]">
                {data?.totalToday ?? 0}
              </span>{" "}
              visitors challenged today · Auto-refresh in{" "}
              <span className="font-mono-tabular font-semibold text-[#15233F]">
                {secondsToRefresh}s
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadLeaderboard}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#15233F] transition-colors hover:bg-slate-50 cursor-pointer whitespace-nowrap shrink-0"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh Now</span>
            </button>

            <button
              type="button"
              onClick={toggleBigScreen}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#15233F] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1E335C] cursor-pointer whitespace-nowrap shrink-0"
            >
              {isBigScreen ? (
                <>
                  <Minimize2 className="h-4 w-4" />
                  <span>Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-4 w-4" />
                  <span>Big Screen Mode</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Leaderboard Rows */}
        {isLoading ? (
          <div className="py-16 text-center text-lg font-medium text-slate-500">
            Loading today&apos;s top 10 scores...
          </div>
        ) : !data || data.top10.length === 0 ? (
          <div className="py-16 text-center">
            <Trophy className="mx-auto h-12 w-12 text-slate-300" />
            <h2 className="mt-4 text-2xl font-bold text-[#15233F]">No scores recorded today yet</h2>
            <p className="mt-2 text-base text-slate-500">
              Complete the 90-second quiz to claim Rank #1 on the #DYPAICoE big screen.
            </p>
          </div>
        ) : (
          <div className="mt-6 divide-y divide-slate-200">
            {data.top10.map((entry, idx) => {
              const rank = idx + 1;
              const isTopThree = rank <= 3;

              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between gap-4 py-4 sm:py-5 ${
                    rank === 1 ? "bg-[#F28C38]/8 -mx-4 px-4 rounded-xl" : ""
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-4 sm:gap-6">
                    <span
                      className={`font-mono-tabular w-12 shrink-0 text-2xl font-extrabold sm:text-3xl ${
                        isTopThree ? "text-[#F28C38]" : "text-slate-400"
                      }`}
                    >
                      #{rank}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-2xl font-extrabold text-[#15233F] sm:text-3xl">
                        {entry.firstName}
                      </p>
                      <p className="text-sm text-slate-500">
                        <span className="font-mono-tabular">{entry.durationSec}s</span>
                        {entry.badgeEarned && (
                          <>
                            <span aria-hidden="true"> · </span>
                            <span className="font-semibold text-emerald-700">
                              Deepfake Detector
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="font-mono-tabular text-3xl font-extrabold text-[#15233F] sm:text-4xl">
                      {entry.score}
                      <span className="text-lg font-semibold text-slate-400">
                        /{entry.total}
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
