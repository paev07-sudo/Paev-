"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Facebook, Link as LinkIcon, Mail, Share } from "@/components/ui/icons";

const noop = () => () => {};

export function ShareButtons({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  // Browser-only values; the server renders the plain path and no native button.
  const url = useSyncExternalStore(noop, () => new URL(path, window.location.origin).toString(), () => path);
  const canShare = useSyncExternalStore(noop, () => typeof navigator.share === "function", () => false);

  const native = async () => {
    try {
      await navigator.share({ title, url });
    } catch {
      /* dismissed by the user */
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setError(false);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError(true);
    }
  };

  const btn =
    "inline-flex min-h-11 items-center gap-2 rounded-[3px] border border-line bg-card px-4 text-[0.9375rem] font-semibold transition-colors hover:border-primary hover:text-primary";

  return (
    <div className="on-light">
      <p className="eyebrow mb-3 text-muted">Partager</p>
      <div className="flex flex-wrap gap-2">
        {canShare && (
          <button type="button" onClick={native} className={btn}>
            <Share size={18} /> Partager
          </button>
        )}
        <button type="button" onClick={copy} className={btn}>
          {copied ? <Check size={18} /> : <LinkIcon size={18} />}
          {copied ? "Lien copié" : "Copier le lien"}
        </button>
        <a className={btn} href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`} target="_blank" rel="noopener noreferrer">
          WhatsApp<span className="sr-only"> (nouvelle fenêtre)</span>
        </a>
        <a className={btn} href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer">
          <Facebook size={18} /> Facebook<span className="sr-only"> (nouvelle fenêtre)</span>
        </a>
        <a className={btn} href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`}>
          <Mail size={18} /> E-mail
        </a>
      </div>
      <p role="status" aria-live="polite" className="mt-2 min-h-5 text-[0.875rem] text-muted">
        {copied ? "Le lien de l'article est dans le presse-papiers." : error ? "Copie impossible : sélectionnez l'adresse dans la barre du navigateur." : ""}
      </p>
    </div>
  );
}
