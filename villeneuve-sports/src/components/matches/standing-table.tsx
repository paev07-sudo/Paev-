import type { Standing } from "@/content/types";
import { SourceList, VerificationBadge } from "@/components/ui/verification";

export function StandingTable({ standing, tone = "light" }: { standing: Standing; tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <figure className={`overflow-hidden rounded-[4px] border ${dark ? "border-line-dark bg-navy" : "border-line bg-card"}`}>
      <figcaption className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 ${dark ? "border-line-dark" : "border-line"}`}>
        <div>
          <p className={`font-display text-[1.25rem] font-bold uppercase ${dark ? "text-white" : "text-ink"}`}>
            {standing.competition} · {standing.season}
          </p>
          <p className={`text-[0.8125rem] ${dark ? "text-muted-dark" : "text-muted"}`}>
            Relevé : {standing.snapshot}
            {standing.partial ? " · extrait" : ""}
          </p>
        </div>
        <VerificationBadge level={standing.verification} tone={tone} />
      </figcaption>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-[0.9375rem] tabular-nums">
          <thead>
            <tr className={`text-[0.75rem] uppercase tracking-[0.08em] ${dark ? "text-muted-dark" : "text-muted"}`}>
              <th scope="col" className="px-5 py-3 font-semibold">
                <abbr title="Position">#</abbr>
              </th>
              <th scope="col" className="px-2 py-3 font-semibold">Équipe</th>
              {[
                ["J", "Joués"],
                ["V", "Victoires"],
                ["N", "Nuls"],
                ["D", "Défaites"],
                ["Buts", "Buts marqués : encaissés"],
                ["Pts", "Points"],
              ].map(([k, t]) => (
                <th key={k} scope="col" className="px-2 py-3 text-right font-semibold last:pr-5">
                  <abbr title={t}>{k}</abbr>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {standing.rows.map((r) => (
              <tr
                key={r.team}
                className={`border-t ${dark ? "border-line-dark" : "border-line"} ${
                  r.isVilleneuve ? (dark ? "bg-primary/30 text-white" : "bg-primary/[0.07] font-semibold") : dark ? "text-white/85" : ""
                }`}
              >
                <td className="px-5 py-3">{r.position ?? "–"}</td>
                <th scope="row" className="px-2 py-3 font-semibold">
                  {r.team}
                  {r.note && <span className={`block text-[0.75rem] font-normal ${dark ? "text-muted-dark" : "text-muted"}`}>{r.note}</span>}
                </th>
                <td className="px-2 py-3 text-right">{r.played}</td>
                <td className="px-2 py-3 text-right">{r.won}</td>
                <td className="px-2 py-3 text-right">{r.drawn}</td>
                <td className="px-2 py-3 text-right">{r.lost}</td>
                <td className="px-2 py-3 text-right">
                  {r.goalsFor}:{r.goalsAgainst}
                </td>
                <td className={`px-2 py-3 pr-5 text-right font-bold ${r.isVilleneuve && dark ? "text-accent" : ""}`}>{r.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={`border-t px-5 py-3 ${dark ? "border-line-dark" : "border-line"}`}>
        {standing.note && <p className={`mb-1 text-[0.8125rem] ${dark ? "text-muted-dark" : "text-muted"}`}>{standing.note}</p>}
        <SourceList ids={standing.sources} tone={tone} />
      </div>
    </figure>
  );
}
