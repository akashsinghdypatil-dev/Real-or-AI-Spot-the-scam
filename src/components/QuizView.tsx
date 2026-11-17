import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Image as ImageIcon,
  RotateCcw,
  ShieldCheck,
  Trophy,
  Volume2,
} from "lucide-react";
import type { AppTab, QuizQuestion } from "../types";
import { pickFiveQuizQuestions, saveLeaderboardScore } from "../lib/storage";
import { AudioPlayerCard } from "./AudioPlayerCard";

interface QuizViewProps {
  allQuestions: QuizQuestion[];
  isLoadingQuestions: boolean;
  questionsError: string | null;
  onNavigateTab: (tab: AppTab) => void;
  onScoreSaved: () => void;
}

interface AnswerRecord {
  question: QuizQuestion;
  selectedOption: string;
  isCorrect: boolean;
}

type Stage = "welcome" | "question" | "summary";

const BADGE_IMAGE_PATH = "/src/assets/images/badge_deepfake_detector_1794895725314.jpg";

export function QuizView({
  allQuestions,
  isLoadingQuestions,
  questionsError,
  onNavigateTab,
  onScoreSaved,
}: QuizViewProps) {
  const [stage, setStage] = useState<Stage>("welcome");
  const [firstName, setFirstName] = useState<string>("");
  const [nameError, setNameError] = useState<string>("");
  const [roundQuestions, setRoundQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [imageLoadFailed, setImageLoadFailed] = useState<Record<string, boolean>>({});
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (stage === "question") {
      timerRef.current = window.setInterval(() => {
        setElapsedSec((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [stage]);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
  };

  const handleStartQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = firstName.trim();
    if (!cleaned) {
      setNameError("Please enter your first name to begin.");
      return;
    }
    if (allQuestions.length === 0) {
      setNameError("Questions are still loading. Please try again in a moment.");
      return;
    }

    setNameError("");
    const picked = pickFiveQuizQuestions(allQuestions);
    setRoundQuestions(picked);
    setCurrentIndex(0);
    setSelectedOption(null);
    setAnswers([]);
    setElapsedSec(0);
    setSaveState("idle");
    setStage("question");
  };

  const handleSelectOption = (option: string) => {
    if (selectedOption !== null) return;
    const currentQ = roundQuestions[currentIndex];
    if (!currentQ) return;
    const isCorrect = option === currentQ.answer;
    setSelectedOption(option);
    setAnswers((prev) => [...prev, { question: currentQ, selectedOption: option, isCorrect }]);
  };

  const handleNext = async () => {
    if (currentIndex + 1 < roundQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      return;
    }

    setStage("summary");
    const finalScore = answers.filter((a) => a.isCorrect).length;
    setSaveState("saving");
    try {
      await saveLeaderboardScore(
        firstName.trim(),
        finalScore,
        roundQuestions.length,
        Math.max(1, elapsedSec)
      );
      setSaveState("saved");
      onScoreSaved();
    } catch {
      setSaveState("error");
    }
  };

  const handleResetForNextVisitor = () => {
    setStage("welcome");
    setFirstName("");
    setNameError("");
    setRoundQuestions([]);
    setCurrentIndex(0);
    setSelectedOption(null);
    setAnswers([]);
    setElapsedSec(0);
    setSaveState("idle");
  };

  if (isLoadingQuestions) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-10 text-center shadow-lg">
        <p className="text-lg font-semibold text-[#15233F]">Loading booth quiz questions...</p>
      </div>
    );
  }

  if (questionsError) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-[#F28C38] bg-white p-8 text-center shadow-lg">
        <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-[#F28C38]" />
        <h2 className="text-xl font-bold text-[#15233F]">Could not load questions</h2>
        <p className="mt-2 text-sm text-slate-600">{questionsError}</p>
      </div>
    );
  }

  // STAGE 1: WELCOME / NAME ENTRY
  if (stage === "welcome") {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="grid gap-8 rounded-2xl bg-white p-6 shadow-xl sm:p-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <p className="text-sm font-semibold tracking-wide text-[#F28C38]">
              #DYPAICoE Launch · Dr. D. Y. Patil B-School, Pune
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#15233F] sm:text-4xl [text-wrap:balance]">
              Real or AI: Spot the Scam
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
              Test your scam radar in 90 seconds. You will see 5 real-world messages, visuals, or
              voice clips common across Indian campuses—decide which ones are traps and which are
              genuine.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-4 border-t border-slate-200 pt-6">
              <div>
                <p className="font-mono-tabular text-2xl font-bold text-[#15233F]">5</p>
                <p className="text-xs font-medium text-slate-500">Random Questions</p>
              </div>
              <div>
                <p className="font-mono-tabular text-2xl font-bold text-[#15233F]">~90s</p>
                <p className="text-xs font-medium text-slate-500">Booth Challenge</p>
              </div>
              <div>
                <p className="font-mono-tabular text-2xl font-bold text-[#F28C38]">4+</p>
                <p className="text-xs font-medium text-slate-500">Earns Detector Badge</p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleStartQuiz}
            className="rounded-xl border border-slate-200 bg-slate-50 p-6 lg:col-span-5"
          >
            <label
              htmlFor="visitor-first-name"
              className="block text-sm font-semibold text-[#15233F]"
            >
              Visitor First Name
            </label>
            <input
              id="visitor-first-name"
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                if (nameError) setNameError("");
              }}
              maxLength={24}
              autoFocus
              placeholder="e.g. Aarav, Sneha, Rohan"
              className="mt-2 block min-h-[52px] w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg font-medium text-[#15233F] placeholder:text-slate-400 focus:border-[#15233F] focus:outline-none focus:ring-2 focus:ring-[#15233F]/20"
            />
            {nameError && (
              <p className="mt-2 text-sm font-medium text-[#C25E0C]" role="alert">
                {nameError}
              </p>
            )}

            <button
              type="submit"
              className="mt-5 inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-[#15233F] px-6 py-3.5 text-base font-bold text-white transition-colors hover:bg-[#1E335C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F28C38] cursor-pointer"
            >
              <span>Start 90-Sec Quiz</span>
              <ArrowRight className="h-5 w-5" />
            </button>

            <p className="mt-3 text-center text-xs text-slate-500">
              Scores appear on today&apos;s Top 10 booth leaderboard.
            </p>
          </form>
        </div>
      </div>
    );
  }

  // STAGE 2: ACTIVE QUESTION
  if (stage === "question") {
    const q = roundQuestions[currentIndex];
    const isAnswered = selectedOption !== null;
    const isCorrect = isAnswered && selectedOption === q.answer;
    const remainingBudget = Math.max(0, 90 - elapsedSec);

    const typeIcon =
      q.type === "message" ? (
        <FileText className="h-4 w-4 text-slate-500" />
      ) : q.type === "image" ? (
        <ImageIcon className="h-4 w-4 text-slate-500" />
      ) : (
        <Volume2 className="h-4 w-4 text-slate-500" />
      );

    const typeLabel =
      q.type === "message"
        ? "SMS / WhatsApp Message"
        : q.type === "image"
          ? "Visual Inspection"
          : "Voice / Call Audio";

    return (
      <div className="mx-auto max-w-3xl">
        {/* Progress & Booth Timer Header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-200">
            <span className="font-semibold text-white">{firstName.trim()}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">
              Question {currentIndex + 1} of {roundQuestions.length}
            </span>
          </div>

          <div className="flex items-center gap-4 font-mono-tabular text-sm">
            <span className="inline-flex items-center gap-1.5 text-slate-200">
              <Clock className="h-4 w-4 text-[#F28C38]" />
              <span>{formatDuration(elapsedSec)} elapsed</span>
            </span>
            <span className="text-slate-400" aria-hidden="true">
              /
            </span>
            <span className={remainingBudget <= 15 ? "font-bold text-[#F28C38]" : "text-slate-300"}>
              {remainingBudget}s left
            </span>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="mb-6 grid grid-cols-5 gap-2" aria-hidden="true">
          {roundQuestions.map((item, idx) => {
            const past = answers[idx];
            let barClass = "bg-white/20";
            if (past) {
              barClass = past.isCorrect ? "bg-emerald-500" : "bg-[#F28C38]";
            } else if (idx === currentIndex) {
              barClass = "bg-white";
            }
            return <div key={item.id} className={`h-2 rounded-full transition-colors ${barClass}`} />;
          })}
        </div>

        {/* Question Card */}
        <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
          {/* Clean unboxed metadata */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
            {typeIcon}
            <span>{typeLabel}</span>
            {q.topic && (
              <>
                <span aria-hidden="true">·</span>
                <span>{q.topic}</span>
              </>
            )}
          </div>

          <h2 className="mt-2 text-xl font-bold text-[#15233F] sm:text-2xl">
            Is this Real/Safe or a Scam/AI trap?
          </h2>

          {/* Question Content by Type */}
          <div className="mt-5">
            {q.type === "message" && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
                <p className="text-lg leading-relaxed font-medium text-slate-900 sm:text-xl">
                  {q.content}
                </p>
              </div>
            )}

            {q.type === "image" && (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                {!imageLoadFailed[q.id] ? (
                  <img
                    src={q.content}
                    alt={q.topic ? `${q.topic} quiz visual` : "Quiz inspection visual"}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setImageLoadFailed((prev) => ({ ...prev, [q.id]: true }))
                    }
                    className="aspect-[4/3] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[4/3] w-full flex-col items-center justify-center bg-slate-100 p-6 text-center">
                    <ImageIcon className="h-10 w-10 text-slate-400" />
                    <p className="mt-2 text-sm font-semibold text-slate-700">
                      Image Placeholder: {q.topic || q.id}
                    </p>
                    <p className="mt-1 font-mono-tabular text-xs text-slate-500">{q.content}</p>
                  </div>
                )}
              </div>
            )}

            {q.type === "audio" && (
              <AudioPlayerCard
                src={q.content}
                transcript={q.transcript}
                questionId={q.id}
              />
            )}
          </div>

          {/* Large Touch Option Buttons */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {q.options.map((option) => {
              const isSelected = selectedOption === option;
              const isOptionCorrect = option === q.answer;

              let btnStyle =
                "border-slate-300 bg-white text-[#15233F] hover:border-[#15233F] hover:bg-slate-50";

              if (isAnswered) {
                if (isSelected && isCorrect) {
                  btnStyle = "border-emerald-600 bg-emerald-600 text-white";
                } else if (isSelected && !isCorrect) {
                  btnStyle = "border-[#F28C38] bg-[#F28C38] text-white";
                } else if (isOptionCorrect) {
                  btnStyle = "border-emerald-600 bg-emerald-50 text-emerald-900";
                } else {
                  btnStyle = "border-slate-200 bg-slate-50 text-slate-400";
                }
              }

              return (
                <button
                  key={option}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(option)}
                  className={`min-h-[64px] rounded-xl border-2 px-6 py-4 text-lg font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F28C38] cursor-pointer disabled:cursor-default ${btnStyle}`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {/* Immediate Feedback & Tip */}
          {isAnswered && (
            <div
              role="status"
              className={`mt-6 rounded-xl border-2 p-5 ${
                isCorrect
                  ? "border-emerald-600 bg-emerald-50 text-emerald-950"
                  : "border-[#F28C38] bg-[#F28C38]/12 text-[#15233F]"
              }`}
            >
              <div className="flex items-start gap-3">
                {isCorrect ? (
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-[#D96B14]" />
                )}
                <div className="flex-1">
                  <p className="text-base font-bold">
                    {isCorrect ? "Correct!" : `Wrong — Answer is "${q.answer}"`}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-800">{q.tip}</p>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#15233F] px-6 py-3 text-base font-bold text-white transition-colors hover:bg-[#1E335C] cursor-pointer"
                >
                  <span>
                    {currentIndex + 1 < roundQuestions.length
                      ? "Next Question"
                      : "See Final Score"}
                  </span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // STAGE 3: FINAL SCORE SCREEN
  const finalScore = answers.filter((a) => a.isCorrect).length;
  const earnedBadge = finalScore >= 4;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-10">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <p className="text-sm font-semibold text-slate-500">
              Challenge Complete · {firstName.trim()} ·{" "}
              <span className="font-mono-tabular">{elapsedSec}s</span>
            </p>
            <h2 className="mt-2 text-3xl font-extrabold text-[#15233F] sm:text-4xl">
              You scored{" "}
              <span className="font-mono-tabular text-[#F28C38]">
                {finalScore} / {roundQuestions.length}
              </span>
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              {earnedBadge
                ? "Sharp eye! You spotted at least 4 out of 5 threats and earned the official #DYPAICoE Deepfake Detector badge."
                : "Good practice round! Review the tips below and grab a Pocket Safety Card before you leave the booth."}
            </p>

            <p className="mt-3 text-xs font-medium text-slate-500">
              {saveState === "saving" && "Saving score to today's leaderboard..."}
              {saveState === "saved" && "Saved to today's #DYPAICoE Leaderboard."}
              {saveState === "error" && "Saved locally on this kiosk."}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleResetForNextVisitor}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#15233F] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1E335C] cursor-pointer whitespace-nowrap shrink-0"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Next Visitor (Play Again)</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab("leaderboard")}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-[#15233F] transition-colors hover:bg-slate-50 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Trophy className="h-4 w-4 text-[#F28C38]" />
                <span>View Leaderboard</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab("safety-card")}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-[#15233F] transition-colors hover:bg-slate-50 cursor-pointer whitespace-nowrap shrink-0"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                <span>Pocket Safety Card</span>
              </button>
            </div>
          </div>

          {/* Deepfake Detector Badge (Shown for 4 or more) */}
          <div className="lg:col-span-5">
            {earnedBadge ? (
              <div className="rounded-2xl border-2 border-[#F28C38] bg-[#15233F] p-6 text-center text-white">
                <img
                  src={BADGE_IMAGE_PATH}
                  alt="Deepfake Detector Badge"
                  referrerPolicy="no-referrer"
                  className="mx-auto h-36 w-36 rounded-xl bg-white object-contain p-2"
                />
                <p className="mt-4 text-xs font-semibold tracking-wider text-[#F28C38]">
                  VERIFIED ACHIEVEMENT
                </p>
                <h3 className="mt-1 text-2xl font-extrabold">Deepfake Detector</h3>
                <p className="mt-1 text-sm text-slate-300">
                  Awarded to {firstName.trim()} · #DYPAICoE
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                <ShieldCheck className="mx-auto h-12 w-12 text-[#15233F]" />
                <h3 className="mt-3 text-lg font-bold text-[#15233F]">
                  Score 4+ to Unlock Badge
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Play another quick 90-second round to earn the Deepfake Detector badge.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 5-Question Answer Breakdown */}
        <div className="mt-8 border-t border-slate-200 pt-6">
          <h3 className="text-base font-bold text-[#15233F]">Your 5-Question Review</h3>
          <div className="mt-4 divide-y divide-slate-200">
            {answers.map((rec, idx) => (
              <div key={rec.question.id} className="flex items-start gap-3 py-3.5">
                {rec.isCorrect ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#F28C38]" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#15233F]">
                    {idx + 1}. {rec.question.topic || rec.question.type} ·{" "}
                    <span className={rec.isCorrect ? "text-emerald-700" : "text-[#C25E0C]"}>
                      {rec.isCorrect ? "Correct" : `Picked ${rec.selectedOption} (Answer: ${rec.question.answer})`}
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-slate-600">{rec.question.tip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
