"use client";

import { useEffect, useId, useMemo, useState } from "react";
import type { Team, TeamAudience, TeamSection } from "@/content/types";
import { audienceLabels, sections } from "@/content/teams";
import { Search } from "@/components/ui/icons";
import { TeamCard } from "./team-card";

type Filters = {
  section: TeamSection | "all";
  audience: TeamAudience | "all";
  type: Team["competitionType"] | "all";
  confirmedOnly: boolean;
  q: string;
};

const initial: Filters = { section: "all", audience: "all", type: "all", confirmedOnly: false, q: "" };

const typeLabels: Record<Team["competitionType"], string> = {
  championnat: "Championnat",
  tournois: "Tournois",
  inconnu: "À confirmer",
};

function Chip({ active, onClick, children, count }: { active: boolean; onClick: () => void; children: React.ReactNode; count?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[0.9375rem] font-semibold transition-colors duration-200 ${
        active ? "border-primary bg-primary text-white" : "border-line bg-card text-ink hover:border-primary hover:text-primary"
      }`}
    >
      {children}
      {count !== undefined && <span className={`text-[0.8125rem] ${active ? "text-white/75" : "text-muted"}`}>{count}</span>}
    </button>
  );
}

export function TeamDirectory({ teams }: { teams: Team[] }) {
  const [f, setF] = useState<Filters>(initial);
  const searchId = useId();

  // Deep links: /equipes?section=juniores
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const section = p.get("section");
    if (section && sections.some((s) => s.id === section)) {
      // Reading the URL once on mount; the server render shows all teams.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setF((prev) => ({ ...prev, section: section as TeamSection }));
    }
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (f.section === "all") url.searchParams.delete("section");
    else url.searchParams.set("section", f.section);
    window.history.replaceState(window.history.state, "", url);
  }, [f.section]);

  const results = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    return teams.filter(
      (t) =>
        (f.section === "all" || t.section === f.section) &&
        (f.audience === "all" || t.audience === f.audience) &&
        (f.type === "all" || t.competitionType === f.type) &&
        (!f.confirmedOnly || t.verification === "confirmed") &&
        (!q || `${t.name} ${t.shortName} ${t.category} ${t.competition ?? ""}`.toLowerCase().includes(q)),
    );
  }, [teams, f]);

  const grouped = sections
    .map((s) => ({ section: s, teams: results.filter((t) => t.section === s.id).sort((a, b) => a.order - b.order) }))
    .filter((g) => g.teams.length > 0);

  const audiences = Array.from(new Set(teams.map((t) => t.audience)));
  const types = Array.from(new Set(teams.map((t) => t.competitionType)));
  const dirty = JSON.stringify(f) !== JSON.stringify(initial);

  return (
    <div className="on-light">
      <div className="rounded-[4px] border border-line bg-paper-2 p-4 md:p-6">
        <div className="flex flex-col gap-5">
          <div>
            <label htmlFor={searchId} className="eyebrow mb-2 block text-muted">
              Rechercher une équipe
            </label>
            <div className="relative max-w-md">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                id={searchId}
                type="search"
                value={f.q}
                onChange={(e) => setF({ ...f, q: e.target.value })}
                placeholder="Ex. FF-17, juniors D, 3e ligue"
                className="h-12 w-full rounded-[3px] border border-line bg-card pl-11 pr-4 text-base outline-none transition-colors focus:border-primary"
              />
            </div>
          </div>

          <fieldset>
            <legend className="eyebrow mb-2 text-muted">Catégorie</legend>
            <div className="flex flex-wrap gap-2">
              <Chip active={f.section === "all"} onClick={() => setF({ ...f, section: "all" })} count={teams.length}>
                Toutes
              </Chip>
              {sections.map((s) => (
                <Chip key={s.id} active={f.section === s.id} onClick={() => setF({ ...f, section: s.id })} count={teams.filter((t) => t.section === s.id).length}>
                  {s.label}
                </Chip>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:gap-10">
            <fieldset>
              <legend className="eyebrow mb-2 text-muted">Public</legend>
              <div className="flex flex-wrap gap-2">
                <Chip active={f.audience === "all"} onClick={() => setF({ ...f, audience: "all" })}>
                  Tous
                </Chip>
                {audiences.map((a) => (
                  <Chip key={a} active={f.audience === a} onClick={() => setF({ ...f, audience: a })}>
                    {audienceLabels[a]}
                  </Chip>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="eyebrow mb-2 text-muted">Compétition</legend>
              <div className="flex flex-wrap gap-2">
                <Chip active={f.type === "all"} onClick={() => setF({ ...f, type: "all" })}>
                  Toutes
                </Chip>
                {types.map((t) => (
                  <Chip key={t} active={f.type === t} onClick={() => setF({ ...f, type: t })}>
                    {typeLabels[t]}
                  </Chip>
                ))}
              </div>
            </fieldset>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[0.9375rem] font-semibold">
              <input
                type="checkbox"
                checked={f.confirmedOnly}
                onChange={(e) => setF({ ...f, confirmedOnly: e.target.checked })}
                className="h-5 w-5 accent-[var(--color-primary)]"
              />
              Équipes vérifiées uniquement
            </label>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.9375rem] text-muted" role="status" aria-live="polite">
          {results.length} équipe{results.length > 1 ? "s" : ""} affichée{results.length > 1 ? "s" : ""}
        </p>
        {dirty && (
          <button type="button" onClick={() => setF(initial)} className="min-h-11 font-semibold text-primary underline underline-offset-4">
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {grouped.length === 0 ? (
        <div className="mt-8 rounded-[4px] border border-dashed border-line bg-card px-6 py-14 text-center">
          <p className="display text-[2rem]">Aucune équipe</p>
          <p className="mt-2 text-muted">Aucune équipe ne correspond à ces filtres.</p>
          <button type="button" onClick={() => setF(initial)} className="mt-5 min-h-11 font-semibold text-primary underline underline-offset-4">
            Afficher toutes les équipes
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-14">
          {grouped.map((g) => (
            <section key={g.section.id} aria-labelledby={`sec-${g.section.id}`}>
              <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
                <h2 id={`sec-${g.section.id}`} className="display text-[2.25rem]">
                  {g.section.label}
                </h2>
                <p className="text-[0.9375rem] text-muted">{g.section.description}</p>
              </div>
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {g.teams.map((t) => (
                  <li key={t.slug}>
                    <TeamCard team={t} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
