import { ThumbsUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useScramble } from "use-scramble";
import { Confetti } from "./Confetti";

interface KudosButtonProps {
  slug: string;
  initialTotal?: number;
  initialYou?: number;
  currentPath: string;
}

interface ConfettiBurst {
  id: string;
}

// Scramble animation options for numbers
const scrambleOptions = {
  speed: 0.35,
  tick: 1,
  step: 1,
  scramble: 4,
  overdrive: false,
  playOnMount: false,
  overflow: true,
  ignore: ["-", " "],
  range: [48, 57] as [number, number], // ASCII codes for 0-9
};

// Generate a client-side fingerprint for rate limiting
function generateFingerprint(): string {
  // Get or create a persistent client ID
  let clientId = localStorage.getItem("kudos_client_id");
  if (!clientId) {
    clientId = crypto.randomUUID();
    localStorage.setItem("kudos_client_id", clientId);
  }

  // Also set cookie for no-JS fallback
  document.cookie = `kudos_client_id=${clientId}; path=/; max-age=31536000; samesite=lax`;

  // Combine with browser info for weak fingerprint
  const ua = navigator.userAgent;
  const lang = navigator.language;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  try {
    return btoa(`${clientId}:${ua}|${lang}|${tz}`).slice(0, 64);
  } catch {
    return clientId;
  }
}

export function KudosButton({
  slug,
  initialTotal = 0,
  initialYou = 0,
  currentPath,
}: KudosButtonProps) {
  const [mounted, setMounted] = useState(false);
  const [total, setTotal] = useState(initialTotal);
  const [you, setYou] = useState(initialYou);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fingerprint, setFingerprint] = useState("");
  const [confettiBursts, setConfettiBursts] = useState<ConfettiBurst[]>([]);

  // Generate fingerprint on client only (avoids hydration mismatch)
  useEffect(() => {
    setMounted(true);
    setFingerprint(generateFingerprint());
  }, []);

  const remaining = Math.max(0, 50 - you);
  const disabled = remaining <= 0 || !fingerprint;

  // Scramble animations for numbers (only when mounted)
  const { ref: totalRef } = useScramble({
    ...scrambleOptions,
    text: mounted ? (total?.toString() ?? "—") : "",
  });

  const { ref: remainingRef } = useScramble({
    ...scrambleOptions,
    text: mounted ? (remaining?.toString() ?? "—") : "",
  });

  const handleClick = useCallback(async () => {
    if (disabled || isSubmitting) return;

    // Trigger confetti immediately
    const newBurst = { id: `${Date.now()}-${Math.random()}` };
    setConfettiBursts((prev) => [...prev, newBurst]);

    // Optimistic update
    setTotal((prev) => prev + 1);
    setYou((prev) => prev + 1);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/kudos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, fingerprint }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        total?: number;
        you?: number;
      };

      if (result.ok) {
        // Update with server values
        if (result.total !== undefined) setTotal(result.total);
        if (result.you !== undefined) setYou(result.you);
      } else {
        // Revert optimistic update on failure
        setTotal((prev) => prev - 1);
        setYou((prev) => prev - 1);
      }
    } catch {
      // Revert optimistic update on error
      setTotal((prev) => prev - 1);
      setYou((prev) => prev - 1);
    } finally {
      setIsSubmitting(false);
    }
  }, [slug, fingerprint, disabled, isSubmitting]);

  const removeConfettiBurst = (id: string) => {
    setConfettiBursts((prev) => prev.filter((burst) => burst.id !== id));
  };

  // SSR/no-JS fallback - render a form that works without JavaScript
  if (!mounted) {
    return (
      <form method="POST" action="/api/kudos" className="inline-block">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="redirectTo" value={currentPath} />
        <button
          type="submit"
          disabled={remaining <= 0}
          aria-label="Give kudos"
          title={remaining <= 0 ? "Limit reached" : "Give kudos"}
          className={`font-mono bg-white dark:bg-gray-950 relative z-10 inline-flex items-center gap-2 px-3 py-2 border border-indigo-600/50 dark:border-indigo-400/50 text-indigo-600 dark:text-indigo-400 focus-ring-primary ${remaining <= 0 ? "border-current/20 cursor-not-allowed" : "hover:border-indigo-400 hover:text-indigo-500 hover:dark:text-indigo-300 cursor-pointer"}`}
        >
          <span role="img" aria-hidden="true">
            <ThumbsUp size={16} />
          </span>
          <span className="font-semibold">{initialTotal ?? "—"}</span>
          <span className="text-xs opacity-70">
            ({Math.max(0, 50 - initialYou)} left)
          </span>
        </button>
      </form>
    );
  }

  return (
    <div className="relative inline-block isolate">
      <div className="absolute inset-0 -z-10">
        {confettiBursts.map((burst) => (
          <Confetti
            key={burst.id}
            id={burst.id}
            onComplete={() => removeConfettiBurst(burst.id)}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-label="Give kudos"
        title={disabled ? "Limit reached" : "Give kudos"}
        className={`font-mono bg-white dark:bg-gray-950 relative z-10 inline-flex items-center gap-2 px-3 py-2 border border-indigo-600/50 dark:border-indigo-400/50 hover:border-indigo-400 text-indigo-600 dark:text-indigo-400 focus-ring-primary ${disabled ? "border-current/20" : "hover:text-indigo-500 hover:dark:text-indigo-300 focus-visible:text-indigo-500 focus-visible:dark:text-indigo-300 focus-visible:border-current"} ${disabled ? "cursor-not-allowed" : ""} ${!disabled ? "cursor-pointer" : ""}`}
      >
        <span role="img" aria-hidden="true">
          <ThumbsUp size={16} />
        </span>
        <span ref={totalRef} className="font-semibold">
          {total ?? "—"}
        </span>
        <span className="text-xs opacity-70">
          (<span ref={remainingRef}>{remaining}</span> left)
        </span>
      </button>
    </div>
  );
}
