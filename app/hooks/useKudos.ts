import { useFetcher } from "react-router";
import { useUserFingerprint } from "~/root";

export function useKudos({
  initialTotal = 0,
  initialYou = 0,
}: {
  initialTotal?: number;
  initialYou?: number;
}) {
  const fingerprint = useUserFingerprint();
  const fetcher = useFetcher<{
    result: { ok?: boolean; total?: number; you?: number; reason?: string };
  }>();

  // Base values: use server response if available, otherwise initial values
  const baseTotal = fetcher.data?.result?.total ?? initialTotal;
  const baseYou = fetcher.data?.result?.you ?? initialYou;

  // Optimistic update: if submitting, increment by 1 immediately
  // This gives instant feedback while the request is in flight
  const isSubmitting = fetcher.state === "submitting";
  const optimisticIncrement = isSubmitting ? 1 : 0;

  const total = baseTotal + optimisticIncrement;
  const you = baseYou + optimisticIncrement;

  const remaining = Math.max(0, 50 - you);
  const pending = fetcher.state !== "idle";
  // Only disable if we've confirmed no remaining kudos
  // Don't check fingerprint here to avoid hydration mismatch
  const disabled = remaining <= 0;

  return {
    fetcher,
    fingerprint,
    total,
    you,
    remaining,
    disabled,
    pending,
  };
}
