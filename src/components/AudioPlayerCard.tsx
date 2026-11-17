import { useEffect, useRef, useState } from "react";
import { FileAudio, Pause, Play, Volume2 } from "lucide-react";

interface AudioPlayerCardProps {
  src: string;
  transcript?: string;
  questionId: string;
}

export function AudioPlayerCard({ src, transcript, questionId }: AudioPlayerCardProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [hasRealFile, setHasRealFile] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showTranscript, setShowTranscript] = useState<boolean>(true);
  const [speechSupported] = useState<boolean>(
    () => typeof window !== "undefined" && "speechSynthesis" in window
  );

  // Stop any playing audio/TTS when switching questions
  useEffect(() => {
    setIsPlaying(false);
    setHasRealFile(false);

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    let cancelled = false;
    // Probe whether custom audio file exists at the configured path
    fetch(src, { method: "HEAD" })
      .then((res) => {
        if (!cancelled && res.ok) {
          const contentType = res.headers.get("content-type") || "";
          if (contentType.startsWith("audio/") || contentType === "application/octet-stream") {
            setHasRealFile(true);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setHasRealFile(false);
      });

    return () => {
      cancelled = true;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [questionId, src]);

  const handleTogglePlay = () => {
    if (hasRealFile && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
      return;
    }

    // Built-in synthesized voice preview for placeholder audio paths
    if (!speechSupported || !transcript) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();
    const spokenText = transcript.replace(/^\[[^\]]+\]\s*/, "").replace(/['"]/g, "");
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = "en-IN";
    utterance.rate = 0.98;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      {hasRealFile && (
        <audio
          ref={audioRef}
          src={src}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#15233F] text-white">
            {isPlaying ? <Volume2 className="h-6 w-6" /> : <FileAudio className="h-6 w-6" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#15233F]">
              {hasRealFile ? "Recorded Voice Clip" : "Simulated Voice Preview"}
            </p>
            <p className="font-mono-tabular text-xs text-slate-500">
              {src}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTogglePlay}
            disabled={!hasRealFile && (!speechSupported || !transcript)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#15233F] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1E3259] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F28C38] disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4" />
                <span>Stop Audio</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Play Clip</span>
              </>
            )}
          </button>

          {transcript && (
            <button
              type="button"
              onClick={() => setShowTranscript((v) => !v)}
              className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {showTranscript ? "Hide Script" : "Show Script"}
            </button>
          )}
        </div>
      </div>

      {/* Visual static waveform bars */}
      <div className="mt-4 flex h-8 items-center gap-1" aria-hidden="true">
        {[35, 65, 45, 90, 60, 80, 40, 95, 70, 50, 85, 45, 75, 60, 90, 40, 65, 80, 50, 70, 55, 85, 45, 60].map(
          (height, idx) => (
            <div
              key={idx}
              className={`flex-1 rounded-sm transition-colors duration-200 ${
                isPlaying ? "bg-[#F28C38]" : "bg-slate-300"
              }`}
              style={{ height: `${height}%` }}
            />
          )
        )}
      </div>

      {showTranscript && transcript && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-base leading-relaxed text-slate-800">
          {transcript}
        </div>
      )}
    </div>
  );
}
