import { Loader2, ThumbsUp } from "lucide-react";
import { useKudos } from "~/hooks/useKudos";

interface KudosButtonProps {
  slug: string;
  initialTotal?: number;
  initialYou?: number;
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

  return (
    <fetcher.Form method="POST" action="/kudos">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="fingerprint" value={fingerprint} />
      <button
        type="submit"
        disabled={disabled || pending}
        aria-label="Give kudos"
        title={disabled ? "Limit reached" : "Give kudos"}
        className={`inline-flex items-center gap-2 px-3 py-2 border border-indigo-600/20 dark:border-indigo-400/30 text-indigo-600 dark:text-indigo-400 transition-colors ${disabled || pending ? "border-current/20" : "hover:text-indigo-500 hover:dark:text-indigo-300 hover:border-current"} ${disabled ? "cursor-not-allowed" : ""} ${!pending && !disabled ? "cursor-pointer" : ""}`}
      >
        <span role="img" aria-hidden="true">
          {pending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ThumbsUp size={16} />
          )}
        </span>
        <span className="font-medium">{total ?? "—"}</span>
        <span className="text-xs opacity-70">
          {remaining ? `(${remaining} left)` : null}
        </span>
      </button>
    </fetcher.Form>
  );
}
