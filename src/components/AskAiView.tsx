import { useState } from "react";
import { AlertTriangle, PhoneCall, Send, ShieldAlert } from "lucide-react";

interface AskAiViewProps {
  aiAvailable: boolean;
}

const SAMPLE_MESSAGES = [
  {
    label: "Fake KYC SMS",
    text: "Dear SBI User, your YONO KYC expires in 2 hours. Click http://sbi-kyc-verify-in.co/login and enter PAN + OTP to avoid account block.",
  },
  {
    label: "UPI Collect Trap",
    text: "Bhai I am sending ₹3,500 for your hostel study table. Just accept the PhonePe request and enter your UPI PIN to receive the money.",
  },
  {
    label: "Official Bank Alert",
    text: "HDFC Bank: 582910 is your OTP for ₹450 at BookMyShow. NEVER share this OTP with anyone. Call 1800-202-6161 if not done by you.",
  },
];

export function AskAiView({ aiAvailable }: AskAiViewProps) {
  const [message, setMessage] = useState<string>("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (trimmed.length < 4) {
      setError("Paste a suspicious SMS, WhatsApp text, or call script to check.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ask-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Gemini is currently unreachable. The quiz still works normally.");
      } else {
        setResult(data.analysis);
      }
    } catch {
      setError("Network error reaching Ask the AI. The 90-second quiz still works offline.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-10">
        <div className="border-b border-slate-200 pb-6">
          <p className="text-sm font-semibold text-[#F28C38]">
            Optional AI Assistant · Powered by Scamsense Logic &amp; Gemini
          </p>
          <h1 className="mt-1 text-3xl font-extrabold text-[#15233F]">
            Ask the AI: Check a Suspicious Message
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Paste any SMS, WhatsApp forward, internship offer, or payment message you received. Never
            paste your passwords, OTPs, Aadhaar, or bank account numbers.
          </p>
        </div>

        {!aiAvailable && (
          <div className="mt-6 rounded-xl border border-[#F28C38] bg-[#F28C38]/10 p-4 text-sm text-[#15233F]">
            <p className="font-semibold">
              Ask the AI is currently offline or disabled on this booth setup.
            </p>
            <p className="mt-1 text-slate-700">
              The 90-second quiz, leaderboard, and pocket safety card work completely independently.
            </p>
          </div>
        )}

        {/* Quick Sample Buttons */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Try a sample:</span>
          {SAMPLE_MESSAGES.map((sample) => (
            <button
              key={sample.label}
              type="button"
              onClick={() => {
                setMessage(sample.text);
                setError(null);
                setResult(null);
              }}
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-[#15233F] transition-colors hover:bg-slate-100 cursor-pointer whitespace-nowrap shrink-0"
            >
              {sample.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleAnalyze} className="mt-4">
          <label htmlFor="scam-paste-input" className="sr-only">
            Paste suspicious message
          </label>
          <textarea
            id="scam-paste-input"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Paste a suspicious SMS, WhatsApp message, job offer, or UPI request here..."
            className="block w-full rounded-xl border border-slate-300 bg-slate-50 p-4 text-base text-[#15233F] placeholder:text-slate-400 focus:border-[#15233F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#15233F]/20"
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              Returns verdict, 3 short red flags or reasons, and next step (under 70 words).
            </p>

            <button
              type="submit"
              disabled={isAnalyzing}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#15233F] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1E335C] disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Send className="h-4 w-4" />
              <span>{isAnalyzing ? "Analyzing..." : "Check Message"}</span>
            </button>
          </div>
        </form>

        {error && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-xl border-2 border-[#F28C38] bg-[#F28C38]/12 p-5 text-[#15233F]"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#D96B14]" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-[#15233F] p-6 text-white">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[#F28C38]">
              <ShieldAlert className="h-4 w-4" />
              <span>#DYPAICoE AI Scam Verdict</span>
            </div>
            <div className="mt-3 whitespace-pre-line text-base leading-relaxed text-slate-100">
              {result}
            </div>
          </div>
        )}

        {/* Always-visible National Cybercrime Helpline */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6 text-sm text-slate-600">
          <div className="flex items-center gap-2 font-medium text-[#15233F]">
            <PhoneCall className="h-4 w-4 text-[#F28C38]" />
            <span>
              Already lost money? Call{" "}
              <strong className="font-mono-tabular">1930</strong> immediately or report at{" "}
              <strong>cybercrime.gov.in</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
