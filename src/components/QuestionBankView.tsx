import { useState } from "react";
import { CheckCircle2, FileText, Image as ImageIcon, Volume2 } from "lucide-react";
import type { QuestionType, QuizQuestion } from "../types";
import { AudioPlayerCard } from "./AudioPlayerCard";

interface QuestionBankViewProps {
  questions: QuizQuestion[];
}

export function QuestionBankView({ questions }: QuestionBankViewProps) {
  const [filter, setFilter] = useState<"all" | QuestionType>("all");
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const filtered =
    filter === "all" ? questions : questions.filter((q) => q.type === filter);

  const countByType = (t: QuestionType) => questions.filter((q) => q.type === t).length;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <p className="text-sm font-semibold text-[#F28C38]">
              Faculty Verification · Source: /public/questions.json
            </p>
            <h1 className="mt-1 text-3xl font-extrabold text-[#15233F]">
              All {questions.length} Quiz Questions
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Review all 10 student scam/safe messages, 5 visual items, and 5 audio placeholders.
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            {(
              [
                { id: "all", label: `All (${questions.length})` },
                { id: "message", label: `Messages (${countByType("message")})` },
                { id: "image", label: `Images (${countByType("image")})` },
                { id: "audio", label: `Audio (${countByType("audio")})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  filter === tab.id
                    ? "bg-[#15233F] text-white"
                    : "text-slate-600 hover:text-[#15233F]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 divide-y divide-slate-200">
          {filtered.map((q) => (
            <div key={q.id} className="py-6 first:pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-slate-500">
                <div className="flex items-center gap-2">
                  {q.type === "message" && <FileText className="h-4 w-4" />}
                  {q.type === "image" && <ImageIcon className="h-4 w-4" />}
                  {q.type === "audio" && <Volume2 className="h-4 w-4" />}
                  <span className="font-mono-tabular font-bold text-[#15233F]">{q.id}</span>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize">{q.type}</span>
                  {q.topic && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{q.topic}</span>
                    </>
                  )}
                </div>

                <div className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Answer: {q.answer}</span>
                </div>
              </div>

              <div className="mt-3">
                {q.type === "message" && (
                  <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-base font-medium text-slate-900">
                    {q.content}
                  </p>
                )}

                {q.type === "image" && (
                  <div className="grid gap-4 sm:grid-cols-12 sm:items-center">
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:col-span-5">
                      {!failedImages[q.id] ? (
                        <img
                          src={q.content}
                          alt={q.topic || q.id}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setFailedImages((prev) => ({ ...prev, [q.id]: true }))
                          }
                          className="aspect-[4/3] w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-[4/3] items-center justify-center p-4 text-xs text-slate-500">
                          Placeholder: {q.content}
                        </div>
                      )}
                    </div>
                    <div className="sm:col-span-7">
                      <p className="font-mono-tabular text-xs text-slate-500">{q.content}</p>
                      <p className="mt-2 text-sm text-slate-700">
                        Options: {q.options.join(" / ")}
                      </p>
                    </div>
                  </div>
                )}

                {q.type === "audio" && (
                  <AudioPlayerCard
                    src={q.content}
                    transcript={q.transcript}
                    questionId={`bank-${q.id}`}
                  />
                )}
              </div>

              <p className="mt-3 text-sm text-slate-600">
                <strong className="text-[#15233F]">Tip:</strong> {q.tip}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
