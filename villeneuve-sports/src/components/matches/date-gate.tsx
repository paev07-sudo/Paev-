"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const subscribe = () => () => {};

/** Today's date in Zurich as YYYY-MM-DD, or null during server rendering. */
function useToday(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Zurich" }).format(new Date()),
    () => null,
  );
}

/**
 * The site is prerendered, so "upcoming" is decided in the browser:
 * once `date` is in the past, `children` is replaced by `past`.
 */
export function DateGate({ date, children, past = null }: { date: string; children: ReactNode; past?: ReactNode }) {
  const today = useToday();
  if (today && date < today) return <>{past}</>;
  return <>{children}</>;
}
