import Image from "next/image";
import { crest } from "@/content/brand";

/**
 * Club identity mark. Uses the official crest when `src/content/brand.ts`
 * provides it; otherwise a plain typographic wordmark that does not imitate
 * the crest.
 */
export function Wordmark({ tone = "light", compact = false }: { tone?: "light" | "dark"; compact?: boolean }) {
  const text = tone === "light" ? "text-white" : "text-ink";
  return (
    <span className="flex items-center gap-3">
      {crest ? (
        <Image src={crest.src} alt={crest.alt} width={40} height={Math.round((40 * crest.height) / crest.width)} className="h-10 w-auto" priority />
      ) : (
        <span aria-hidden="true" className="flex h-9 w-2.5 shrink-0 flex-col overflow-hidden rounded-[2px]">
          <span className="flex-1 bg-primary-bright" />
          <span className="flex-1 bg-accent" />
        </span>
      )}
      <span className={`flex flex-col leading-none ${text}`}>
        <span className="display text-[1.35rem] tracking-[-0.005em]">Villeneuve-Sports</span>
        {!compact && <span className={`eyebrow mt-1 text-[0.625rem] ${tone === "light" ? "text-accent" : "text-primary"}`}>Football · depuis 1921</span>}
      </span>
    </span>
  );
}
