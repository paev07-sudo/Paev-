"use client";

import { useState } from "react";
import { Pause, Play } from "@/components/ui/icons";

export interface TickerItem {
  label: string;
  text: string;
}

/**
 * Matchday ticker. Auto-scrolls (paused on hover/focus), with a pause button
 * as required for moving content (WCAG 2.2.2). Static under reduced motion.
 */
export function Ticker({ items, updatedLabel }: { items: TickerItem[]; updatedLabel: string }) {
  const [paused, setPaused] = useState(false);
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-3 whitespace-nowrap px-6">
          <span className="eyebrow rounded-[2px] bg-accent px-2 py-1 text-[0.6875rem] text-night">{item.label}</span>
          <span className="font-display text-[1.05rem] font-semibold uppercase tracking-[0.04em] text-white">{item.text}</span>
          <span aria-hidden="true" className="ml-3 h-1.5 w-1.5 rotate-45 bg-primary-bright" />
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-label="Fil du club" className="ticker relative border-y border-line-dark bg-navy" data-paused={paused}>
      <div className="flex items-stretch">
        <div className="relative z-10 hidden shrink-0 items-center gap-3 bg-primary px-5 sm:flex">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-accent" />
          <span className="eyebrow text-white">Matchday</span>
        </div>
        <div className="relative min-w-0 flex-1 overflow-hidden py-3.5 [mask-image:linear-gradient(90deg,transparent,black_4%,black_96%,transparent)]">
          <div className="ticker-track flex w-max motion-reduce:w-auto motion-reduce:flex-wrap">
            {row(false)}
            <div className="flex motion-reduce:hidden">{row(true)}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          className="relative z-10 flex w-12 shrink-0 items-center justify-center border-l border-line-dark text-white transition-colors hover:bg-white/10 motion-reduce:hidden"
        >
          {paused ? <Play size={18} /> : <Pause size={18} />}
          <span className="sr-only">{paused ? "Reprendre le défilement" : "Mettre le défilement en pause"}</span>
        </button>
      </div>
      <p className="sr-only">{updatedLabel}</p>
    </section>
  );
}
