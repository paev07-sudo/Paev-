"use client";

import { useRef, useState, type PointerEvent } from "react";
import type { Venue } from "@/content/types";
import { SourceList, VerificationBadge } from "@/components/ui/verification";

/**
 * Tilted pitch diagram (CSS 3D) with a fact sheet per pitch. The diagram
 * uses regulation markings: the real dimensions of the Tronchenaz pitches
 * were not published, and the drawing says so.
 */
export function PitchExplorer({ venues }: { venues: Venue[] }) {
  const [current, setCurrent] = useState(venues[0].slug);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const frame = useRef<HTMLDivElement>(null);
  const venue = venues.find((v) => v.slug === current)!;

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = frame.current!.getBoundingClientRect();
    setTilt({ x: ((e.clientX - r.left) / r.width - 0.5) * 2, y: ((e.clientY - r.top) / r.height - 0.5) * 2 });
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:items-center">
      <div
        ref={frame}
        onPointerMove={onMove}
        onPointerLeave={() => setTilt({ x: 0, y: 0 })}
        className="relative aspect-[4/3] w-full [perspective:1100px]"
      >
        <div
          className="absolute inset-[6%] transition-transform duration-500 ease-[var(--ease-out-expo)] [transform-style:preserve-3d] motion-reduce:transition-none"
          style={{ transform: `rotateX(${48 - tilt.y * 6}deg) rotateZ(${-14 + tilt.x * 8}deg)` }}
        >
          <div
            className={`absolute inset-0 rounded-[6px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.7)] transition-[filter] duration-500 ${
              current === "stade" ? "" : "saturate-[0.8]"
            } bg-[repeating-linear-gradient(90deg,#1c4d27_0_5.55%,#235d2e_5.55%_11.1%)]`}
          />
          <svg className="absolute inset-[5%] h-[90%] w-[90%]" viewBox="0 0 105 68" preserveAspectRatio="none" fill="none" stroke="rgba(244,246,242,0.92)" strokeWidth="0.35" aria-hidden="true">
            <rect x="0" y="0" width="105" height="68" />
            <line x1="52.5" y1="0" x2="52.5" y2="68" />
            <circle cx="52.5" cy="34" r="9.15" />
            <circle cx="52.5" cy="34" r="0.45" fill="rgba(244,246,242,0.92)" />
            <rect x="0" y="13.84" width="16.5" height="40.32" />
            <rect x="88.5" y="13.84" width="16.5" height="40.32" />
            <rect x="0" y="24.84" width="5.5" height="18.32" />
            <rect x="99.5" y="24.84" width="5.5" height="18.32" />
            <path d="M16.5 26.7 A9.15 9.15 0 0 1 16.5 41.3" />
            <path d="M88.5 26.7 A9.15 9.15 0 0 0 88.5 41.3" />
            <circle cx="11" cy="34" r="0.45" fill="rgba(244,246,242,0.92)" />
            <circle cx="94" cy="34" r="0.45" fill="rgba(244,246,242,0.92)" />
          </svg>
          {/* Floodlight glow, only when the source lists lighting */}
          {venue.facts.some((f) => f.label === "Éclairage" && f.value === "Oui") && (
            <>
              {["left-0 top-0", "right-0 top-0", "left-0 bottom-0", "right-0 bottom-0"].map((pos) => (
                <span
                  key={pos}
                  aria-hidden="true"
                  className={`absolute ${pos} h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,250,220,0.55),transparent_65%)] [transform:translateZ(40px)]`}
                />
              ))}
            </>
          )}
        </div>
        <p className="absolute bottom-0 left-0 text-[0.75rem] text-muted-dark">
          Schéma de principe aux dimensions réglementaires (105 × 68 m). Dimensions réelles non publiées.
        </p>
      </div>

      <div>
        <div role="tablist" aria-label="Terrains" className="inline-flex rounded-[4px] border border-line-dark bg-navy p-1">
          {venues.map((v) => (
            <button
              key={v.slug}
              type="button"
              role="tab"
              id={`venue-tab-${v.slug}`}
              aria-selected={current === v.slug}
              aria-controls="venue-panel"
              onClick={() => setCurrent(v.slug)}
              className={`min-h-11 rounded-[3px] px-5 font-display text-[1rem] font-bold uppercase tracking-[0.06em] transition-colors ${
                current === v.slug ? "bg-accent text-night" : "text-white/80 hover:text-white"
              }`}
            >
              {v.kind}
            </button>
          ))}
        </div>
        <div id="venue-panel" role="tabpanel" aria-labelledby={`venue-tab-${venue.slug}`} className="mt-6">
          <h3 className="display text-[clamp(2.25rem,4vw,3.25rem)] text-white">{venue.name}</h3>
          {venue.note && <p className="mt-2 text-muted-dark">{venue.note}</p>}
          <dl className="mt-6 divide-y divide-line-dark border-y border-line-dark">
            {venue.facts.map((f) => (
              <div key={f.label} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                <dt className="text-muted-dark">{f.label}</dt>
                <dd className="flex items-center gap-3 font-semibold text-white">
                  {f.value}
                  <VerificationBadge level={f.verification} tone="dark" />
                </dd>
              </div>
            ))}
          </dl>
          <SourceList ids={venue.sources} tone="dark" className="mt-4" />
        </div>
      </div>
    </div>
  );
}
