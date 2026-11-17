import { Printer, ShieldCheck } from "lucide-react";

const SAFETY_TIPS = [
  "Never share an OTP or UPI PIN, you need your PIN only to pay, never to receive.",
  "Banks never ask for KYC updates through SMS or WhatsApp links.",
  "Pause on urgent threats and call the official number yourself.",
  "Check links for spelling tricks before clicking.",
  "Report fraud on 1930 or cybercrime.gov.in.",
];

function PocketCardGraphic({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex h-full flex-col justify-between bg-white text-[#15233F] ${
        compact
          ? "border border-dashed border-slate-300 p-5"
          : "rounded-2xl border border-slate-200 p-7 shadow-xl"
      }`}
    >
      {/* Top Navy Banner */}
      <div>
        <div className="rounded-xl bg-[#15233F] p-4 text-white">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold tracking-wide text-[#F28C38]">#DYPAICoE</span>
            <span className="text-xs text-slate-300">Dr. D. Y. Patil B-School, Pune</span>
          </div>
          <h2 className={`mt-1.5 font-extrabold tracking-tight ${compact ? "text-lg" : "text-xl"}`}>
            Pocket Scam Safety Card
          </h2>
        </div>

        {/* 5 Essential Tips */}
        <ol className={`mt-4 space-y-2.5 ${compact ? "text-xs leading-snug" : "text-sm leading-relaxed"}`}>
          {SAFETY_TIPS.map((tip, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <span className="font-mono-tabular mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#15233F] text-xs font-bold text-white">
                {idx + 1}
              </span>
              <span className="font-medium text-slate-800">{tip}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Bottom Emergency Helpline Strip */}
      <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-[#F28C38]/15 px-3.5 py-2.5 text-[#15233F]">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#C25E0C]">
            National Cyber Helpline
          </p>
          <p className={`font-mono-tabular font-extrabold ${compact ? "text-base" : "text-lg"}`}>
            1930 · cybercrime.gov.in
          </p>
        </div>
        <ShieldCheck className="h-6 w-6 shrink-0 text-[#15233F]" />
      </div>
    </div>
  );
}

export function SafetyCardView() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="no-print mx-auto max-w-5xl">
        <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <p className="text-sm font-semibold text-[#F28C38]">
                A6 Takeaway Card · 4 Cards per A4 Sheet
              </p>
              <h1 className="mt-1 text-3xl font-extrabold text-[#15233F]">
                Pocket Scam Safety Card
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Print on A4 portrait at 100% scale (no margins) and cut along dashed lines for 4
                handheld A6 cards.
              </p>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#15233F] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1E335C] cursor-pointer whitespace-nowrap shrink-0"
            >
              <Printer className="h-4 w-4" />
              <span>Print 4-Up A4 Sheet (4 × A6)</span>
            </button>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-start">
            {/* Single A6 Card Preview */}
            <div className="lg:col-span-5">
              <p className="mb-3 text-xs font-semibold text-slate-500">
                Single A6 Card Preview (105mm × 148.5mm)
              </p>
              <div className="aspect-[105/148.5] w-full max-w-[360px]">
                <PocketCardGraphic />
              </div>
            </div>

            {/* 4-per-A4 Layout Guide */}
            <div className="lg:col-span-7">
              <p className="mb-3 text-xs font-semibold text-slate-500">
                A4 Print Sheet Layout (2 × 2 Grid)
              </p>
              <div className="grid aspect-[210/297] w-full max-w-[420px] grid-cols-2 grid-rows-2 rounded-xl border border-slate-300 bg-slate-100 p-2">
                {[1, 2, 3, 4].map((slot) => (
                  <div
                    key={slot}
                    className="flex flex-col justify-between border border-dashed border-slate-400 bg-white p-2.5 text-[9px]"
                  >
                    <div className="rounded bg-[#15233F] px-2 py-1.5 text-white">
                      <p className="font-bold text-[#F28C38]">#DYPAICoE</p>
                      <p className="font-bold">Pocket Safety Card #{slot}</p>
                    </div>
                    <div className="space-y-1 text-slate-700">
                      <p>1. Never share OTP or UPI PIN.</p>
                      <p>2. No KYC via SMS/WhatsApp links.</p>
                      <p>3. Pause &amp; call official number.</p>
                      <p>4. Check links for spelling tricks.</p>
                      <p>5. Report on 1930 / cybercrime.gov.in.</p>
                    </div>
                    <div className="rounded bg-[#F28C38]/20 px-2 py-1 font-bold text-[#15233F]">
                      1930 · cybercrime.gov.in
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actual Hidden 4-up A4 Print Sheet */}
      <div className="print-only-sheet hidden">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-[148.5mm] w-[105mm]">
            <PocketCardGraphic compact />
          </div>
        ))}
      </div>
    </>
  );
}
