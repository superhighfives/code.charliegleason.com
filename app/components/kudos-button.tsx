import { ThumbsUp } from "lucide-react";
import { useState } from "react";
import { useScramble } from "use-scramble";
import { Confetti } from "~/components/confetti";
import { useKudos } from "~/hooks/useKudos";
import { scrambleOptions } from "./utils/scramble";

interface KudosButtonProps {
  slug: string;
  initialTotal?: number;
  initialYou?: number;
}

interface ConfettiBurst {
  id: string;
}

export function KudosButton({
  slug,
  initialTotal = 0,
  initialYou = 0,
}: KudosButtonProps) {
  const { fetcher, fingerprint, total, remaining, disabled, pending } =
    useKudos({
      initialTotal,
      initialYou,
    });

  const [confettiBursts, setConfettiBursts] = useState<ConfettiBurst[]>([]);

  const { ref: totalRef } = useScramble({
    ...scrambleOptions,
    range: [48, 57],
    text: total?.toString() ?? "—",
  });

  const { ref: remainingRef } = useScramble({
    ...scrambleOptions,
    range: [48, 57],
    text: remaining?.toString() ?? "—",
  });

  const handleClick = () => {
    // Trigger confetti on every click
    const newBurst = { id: `${Date.now()}-${Math.random()}` };
    setConfettiBursts((prev) => [...prev, newBurst]);
  };

  const removeConfettiBurst = (id: string) => {
    setConfettiBursts((prev) => prev.filter((burst) => burst.id !== id));
  };

  return (
    <fetcher.Form
      method="POST"
      action="/kudos"
      className="relative inline-block isolate"
      onClick={handleClick}
    >
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="fingerprint" value={fingerprint} />
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
        type="submit"
        disabled={disabled}
        aria-label="Give kudos"
        title={disabled ? "Limit reached" : "Give kudos"}
        className={`bg-white dark:bg-gray-950 relative z-10 inline-flex items-center gap-2 px-3 py-2 border border-indigo-600/20 dark:border-indigo-400/30 text-indigo-600 dark:text-indigo-400 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950 ${disabled ? "border-current/20" : "hover:text-indigo-500 hover:dark:text-indigo-300 focus-visible:text-indigo-500 focus-visible:dark:text-indigo-300 focus-visible:border-current"} ${disabled ? "cursor-not-allowed" : ""} ${!disabled ? "cursor-pointer" : ""}`}
      >
        <span role="img" aria-hidden="true">
          <ThumbsUp size={16} />
        </span>
        <span ref={totalRef} className="font-medium">
          {total ?? "—"}
        </span>
        <span className="text-xs opacity-70">
          (<span ref={remainingRef}>{remaining}</span> left)
        </span>
      </button>
    </fetcher.Form>
  );
}
