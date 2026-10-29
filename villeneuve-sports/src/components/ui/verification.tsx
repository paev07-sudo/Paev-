import { getSource } from "@/content/sources";
import type { Verification } from "@/content/types";
import { formatShortDate } from "@/lib/format";
import { Alert, ArrowUpRight, Check, Info } from "./icons";

const labels: Record<Verification, { text: string; help: string }> = {
  confirmed: { text: "Vérifié", help: "Confirmé par au moins deux sources ou une source officielle récente." },
  reported: { text: "Source unique", help: "Repris d'une seule source, ou d'une page officielle ancienne." },
  unconfirmed: { text: "À confirmer", help: "Indice indirect, contradictoire ou ancien : à confirmer par le club." },
};

/** Status badge. Icon + text, never colour alone. */
export function VerificationBadge({ level, tone = "light" }: { level: Verification; tone?: "light" | "dark" }) {
  const Icon = level === "confirmed" ? Check : level === "reported" ? Info : Alert;
  const styles =
    tone === "dark"
      ? {
          confirmed: "border-accent/40 text-accent",
          reported: "border-white/25 text-white/85",
          unconfirmed: "border-[#ff9b8a]/50 text-[#ffb4a6]",
        }
      : {
          confirmed: "border-success/35 bg-success/[0.07] text-success",
          reported: "border-primary/25 bg-primary/[0.06] text-primary",
          unconfirmed: "border-danger/30 bg-danger/[0.06] text-danger",
        };
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[0.75rem] font-semibold leading-none ${styles[level]}`}
      title={labels[level].help}
    >
      <Icon size={13} strokeWidth={2.25} />
      {labels[level].text}
    </span>
  );
}

export function verificationHelp(level: Verification) {
  return labels[level].help;
}

/** Compact list of the sources behind a fact. */
export function SourceList({
  ids,
  tone = "light",
  label = "Sources",
  className = "",
}: {
  ids: string[];
  tone?: "light" | "dark";
  label?: string;
  className?: string;
}) {
  if (ids.length === 0) return null;
  const link = tone === "dark" ? "text-white/80 hover:text-accent" : "text-muted hover:text-primary";
  return (
    <div className={`text-[0.8125rem] leading-snug ${className}`}>
      <span className={tone === "dark" ? "text-white/55" : "text-muted"}>{label} : </span>
      {ids.map((id, i) => {
        const s = getSource(id);
        const shared = ids.filter((other) => getSource(other).publisher === s.publisher).length > 1;
        return (
          <span key={id}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`underline decoration-1 underline-offset-[3px] transition-colors ${link}`}
            >
              {shared ? `${s.publisher} (${s.title})` : s.publisher}
              <ArrowUpRight size={12} className="ml-0.5 inline-block align-baseline" />
              <span className="sr-only"> (« {s.title} », nouvelle fenêtre)</span>
            </a>
            {i < ids.length - 1 ? ", " : ""}
          </span>
        );
      })}
    </div>
  );
}

export function CheckedOn({ date, tone = "light" }: { date: string; tone?: "light" | "dark" }) {
  return (
    <p className={`text-[0.8125rem] ${tone === "dark" ? "text-muted-dark" : "text-muted"}`}>
      Données vérifiées le <time dateTime={date}>{formatShortDate(date)}</time>
    </p>
  );
}
