"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Alert, Check, Mail } from "@/components/ui/icons";

export type Field =
  | { name: string; label: string; type: "text" | "email" | "tel"; required?: boolean; autoComplete?: string; help?: string }
  | { name: string; label: string; type: "year"; required?: boolean; help?: string }
  | { name: string; label: string; type: "textarea"; required?: boolean; help?: string; minLength?: number }
  | { name: string; label: string; type: "select"; required?: boolean; options: { value: string; label: string }[]; help?: string }
  | { name: string; label: string; type: "checkbox"; required?: boolean };

type Values = Record<string, string>;
type Errors = Record<string, string>;
type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "mail"; href: string; text: string } | { kind: "error"; message: string };

const ENDPOINT = process.env.NEXT_PUBLIC_FORM_ENDPOINT;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(field: Field, value: string): string {
  if (field.type === "checkbox") return field.required && value !== "yes" ? "Cochez cette case pour continuer." : "";
  const v = value.trim();
  if (field.required && !v) return `Indiquez ${field.label.toLowerCase()}.`;
  if (!v) return "";
  if (field.type === "email" && !EMAIL.test(v)) return "Adresse e-mail invalide (exemple : prenom.nom@domaine.ch).";
  if (field.type === "tel" && !/^[+\d][\d\s().-]{7,}$/.test(v)) return "Numéro invalide (exemple : 079 123 45 67).";
  if (field.type === "year") {
    const y = Number(v);
    const now = new Date().getFullYear();
    if (!/^\d{4}$/.test(v) || y < now - 90 || y > now - 3) return `Année à 4 chiffres, entre ${now - 90} et ${now - 3}.`;
  }
  if (field.type === "textarea" && field.minLength && v.length < field.minLength) return `Au moins ${field.minLength} caractères.`;
  return "";
}

/**
 * Accessible form with inline validation (on blur), an error summary that
 * receives focus, and honest delivery:
 * - with NEXT_PUBLIC_FORM_ENDPOINT set, POSTs JSON and confirms only on 2xx;
 * - otherwise, prepares an e-mail to the club and says nothing was sent.
 */
export function InquiryForm({
  formName,
  fields,
  to,
  subject,
  submitLabel,
  initialValues = {},
}: {
  formName: string;
  fields: Field[];
  to: string;
  subject: string;
  submitLabel: string;
  initialValues?: Values;
}) {
  const uid = useId();
  const [values, setValues] = useState<Values>(() => Object.fromEntries(fields.map((f) => [f.name, initialValues[f.name] ?? ""])));
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const summary = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (showSummary) summary.current?.focus();
  }, [showSummary]);

  useEffect(() => {
    if (status.kind === "sent" || status.kind === "mail" || status.kind === "error") statusRef.current?.focus();
  }, [status.kind]);

  const id = (name: string) => `${uid}-${name}`;

  const set = (field: Field, value: string) => {
    setValues((v) => ({ ...v, [field.name]: value }));
    if (touched[field.name]) setErrors((e) => ({ ...e, [field.name]: validate(field, value) }));
  };

  const blur = (field: Field) => {
    setTouched((t) => ({ ...t, [field.name]: true }));
    setErrors((e) => ({ ...e, [field.name]: validate(field, values[field.name]) }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if ((form.elements.namedItem("website") as HTMLInputElement | null)?.value) return; // honeypot
    const next: Errors = {};
    for (const f of fields) {
      const err = validate(f, values[f.name]);
      if (err) next[f.name] = err;
    }
    setErrors(next);
    setTouched(Object.fromEntries(fields.map((f) => [f.name, true])));
    if (Object.keys(next).length > 0) {
      setShowSummary(false);
      requestAnimationFrame(() => setShowSummary(true));
      return;
    }
    setShowSummary(false);

    const lines = fields
      .filter((f) => f.type !== "checkbox")
      .map((f) => {
        const raw = values[f.name];
        const label = f.type === "select" ? f.options.find((o) => o.value === raw)?.label ?? raw : raw;
        return `${f.label} : ${label || "—"}`;
      });

    if (ENDPOINT) {
      setStatus({ kind: "sending" });
      try {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ form: formName, subject, ...values }),
        });
        if (!res.ok) throw new Error(String(res.status));
        setStatus({ kind: "sent" });
      } catch {
        setStatus({ kind: "error", message: `L'envoi a échoué. Réessayez ou écrivez directement à ${to}.` });
      }
      return;
    }

    const body = `${lines.join("\n")}\n\n— Envoyé depuis le formulaire « ${formName} » du site.`;
    const href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setStatus({ kind: "mail", href, text: body });
    window.location.href = href;
  };

  const errorList = fields.filter((f) => errors[f.name]);
  const inputBase =
    "w-full rounded-[3px] border bg-card px-4 text-base text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

  if (status.kind === "sent") {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="rounded-[4px] border border-success/40 bg-success/[0.07] p-8">
        <Check size={28} className="text-success" />
        <p className="display mt-3 text-[2rem] text-ink">Message envoyé</p>
        <p className="mt-2 text-muted">Le club a bien reçu votre demande et vous répondra par e-mail.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="on-light space-y-6" aria-describedby={`${uid}-req`}>
      <p id={`${uid}-req`} className="text-[0.875rem] text-muted">
        Les champs marqués d&apos;un astérisque (*) sont obligatoires.
      </p>

      {showSummary && errorList.length > 0 && (
        <div ref={summary} tabIndex={-1} role="alert" aria-labelledby={`${uid}-sum`} className="rounded-[4px] border-l-4 border-danger bg-danger/[0.06] p-5">
          <p id={`${uid}-sum`} className="flex items-center gap-2 font-semibold text-danger">
            <Alert size={18} /> {errorList.length === 1 ? "Un champ est à corriger" : `${errorList.length} champs sont à corriger`}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            {errorList.map((f) => (
              <li key={f.name}>
                <a href={`#${id(f.name)}`} className="text-danger underline underline-offset-2">
                  {f.label} : {errors[f.name]}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {fields.map((f) => {
          const err = touched[f.name] ? errors[f.name] : "";
          const describedBy = [f.type !== "checkbox" && f.help ? `${id(f.name)}-help` : "", err ? `${id(f.name)}-err` : ""].filter(Boolean).join(" ") || undefined;
          const full = f.type === "textarea" || f.type === "checkbox";
          const border = err ? "border-danger" : "border-line";

          if (f.type === "checkbox") {
            return (
              <div key={f.name} className="sm:col-span-2">
                <label htmlFor={id(f.name)} className="flex cursor-pointer items-start gap-3">
                  <input
                    id={id(f.name)}
                    type="checkbox"
                    checked={values[f.name] === "yes"}
                    onChange={(e) => set(f, e.target.checked ? "yes" : "")}
                    onBlur={() => blur(f)}
                    aria-invalid={Boolean(err) || undefined}
                    aria-describedby={describedBy}
                    className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-primary)]"
                  />
                  <span>
                    {f.label}
                    {f.required && <span aria-hidden="true"> *</span>}
                  </span>
                </label>
                {err && (
                  <p id={`${id(f.name)}-err`} className="mt-2 flex items-center gap-1.5 text-[0.875rem] font-medium text-danger">
                    <Alert size={15} /> {err}
                  </p>
                )}
              </div>
            );
          }

          return (
            <div key={f.name} className={full ? "sm:col-span-2" : ""}>
              <label htmlFor={id(f.name)} className="mb-2 block font-semibold">
                {f.label}
                {f.required && <span aria-hidden="true" className="text-danger"> *</span>}
              </label>
              {f.type === "textarea" ? (
                <textarea
                  id={id(f.name)}
                  name={f.name}
                  rows={5}
                  value={values[f.name]}
                  onChange={(e) => set(f, e.target.value)}
                  onBlur={() => blur(f)}
                  aria-invalid={Boolean(err) || undefined}
                  aria-describedby={describedBy}
                  aria-required={f.required || undefined}
                  className={`${inputBase} ${border} min-h-36 py-3`}
                />
              ) : f.type === "select" ? (
                <select
                  id={id(f.name)}
                  name={f.name}
                  value={values[f.name]}
                  onChange={(e) => set(f, e.target.value)}
                  onBlur={() => blur(f)}
                  aria-invalid={Boolean(err) || undefined}
                  aria-describedby={describedBy}
                  aria-required={f.required || undefined}
                  className={`${inputBase} ${border} h-12`}
                >
                  <option value="">Choisir…</option>
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={id(f.name)}
                  name={f.name}
                  type={f.type === "year" ? "text" : f.type}
                  inputMode={f.type === "year" ? "numeric" : f.type === "tel" ? "tel" : undefined}
                  autoComplete={"autoComplete" in f ? f.autoComplete : f.type === "year" ? "bday-year" : undefined}
                  maxLength={f.type === "year" ? 4 : undefined}
                  value={values[f.name]}
                  onChange={(e) => set(f, e.target.value)}
                  onBlur={() => blur(f)}
                  aria-invalid={Boolean(err) || undefined}
                  aria-describedby={describedBy}
                  aria-required={f.required || undefined}
                  className={`${inputBase} ${border} h-12`}
                />
              )}
              {f.help && (
                <p id={`${id(f.name)}-help`} className="mt-1.5 text-[0.875rem] text-muted">
                  {f.help}
                </p>
              )}
              {err && (
                <p id={`${id(f.name)}-err`} className="mt-1.5 flex items-center gap-1.5 text-[0.875rem] font-medium text-danger">
                  <Alert size={15} /> {err}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Honeypot for bots: hidden from people and assistive tech. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label>
          Site web
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md text-[0.875rem] text-muted">
          {ENDPOINT
            ? "Votre message est transmis au club par le service de formulaire du site."
            : `Ce site n'a pas de serveur d'envoi : votre messagerie s'ouvrira avec le message prêt, adressé à ${to}.`}
        </p>
        <button
          type="submit"
          disabled={status.kind === "sending"}
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2.5 rounded-[3px] bg-primary px-6 font-display text-[1.0625rem] font-bold uppercase tracking-[0.06em] text-white transition-colors hover:bg-night disabled:cursor-wait disabled:opacity-70"
        >
          {status.kind === "sending" ? (
            <>
              <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" />
              Envoi…
            </>
          ) : (
            <>
              {!ENDPOINT && <Mail size={18} />}
              {submitLabel}
            </>
          )}
        </button>
      </div>

      {status.kind === "mail" && (
        <div ref={statusRef} tabIndex={-1} role="status" className="rounded-[4px] border-l-4 border-primary bg-card p-5">
          <p className="font-semibold">Votre messagerie devrait s&apos;ouvrir avec le message prêt.</p>
          <p className="mt-1 text-[0.9375rem] text-muted">
            Rien n&apos;a encore été envoyé : vérifiez le message puis envoyez-le depuis votre messagerie. Si elle ne s&apos;ouvre pas,{" "}
            <a href={status.href} className="font-semibold text-primary underline underline-offset-4">
              cliquez ici
            </a>{" "}
            ou copiez le texte ci-dessous vers {to}.
          </p>
          <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-[3px] bg-paper-2 p-3 font-sans text-[0.875rem]">{status.text}</pre>
        </div>
      )}
      {status.kind === "error" && (
        <div ref={statusRef} tabIndex={-1} role="alert" className="rounded-[4px] border-l-4 border-danger bg-danger/[0.06] p-5 font-semibold text-danger">
          {status.message}
        </div>
      )}
    </form>
  );
}
