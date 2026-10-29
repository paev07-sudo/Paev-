"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Close, Menu } from "@/components/ui/icons";
import { Wordmark } from "@/components/ui/wordmark";
import { nav } from "@/lib/site";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the menu on navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
      if (e.key === "Tab" && panel.current) {
        const focusables = Array.from(panel.current.querySelectorAll<HTMLElement>("a, button"));
        const all = [menuButton.current!, ...focusables];
        const first = all[0];
        const last = all[all.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // No backdrop-filter while the menu is open: it would become the containing
  // block of the fixed menu panel and collapse it.
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300 ${
        open
          ? "bg-night"
          : scrolled
            ? "bg-night/92 shadow-[0_1px_0_rgb(255_255_255/0.06)] backdrop-blur-md"
            : "bg-gradient-to-b from-night/70 to-transparent"
      }`}
    >
      <div className="container-site flex h-[var(--header-h)] items-center justify-between gap-6">
        <Link href="/" className="relative z-10 -m-2 rounded p-2">
          <Wordmark tone="light" />
          <span className="sr-only"> — retour à l&apos;accueil</span>
        </Link>

        <nav aria-label="Navigation principale" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`relative block px-3 py-2 font-display text-[1rem] font-semibold uppercase tracking-[0.08em] transition-colors duration-200 ${
                    isActive(item.href) ? "text-accent" : "text-white/85 hover:text-white"
                  }`}
                >
                  {item.label}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-3 -bottom-0.5 h-0.5 origin-left bg-accent transition-transform duration-300 ${isActive(item.href) ? "scale-x-100" : "scale-x-0"}`}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/rejoindre"
            className="hidden min-h-11 items-center rounded-[3px] bg-accent px-4 font-display text-[0.95rem] font-bold uppercase tracking-[0.08em] text-night transition-colors duration-200 hover:bg-white sm:inline-flex"
          >
            Rejoindre
          </Link>
          <button
            ref={menuButton}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            className="relative z-10 inline-flex h-11 w-11 items-center justify-center rounded-[3px] text-white transition-colors hover:bg-white/10 lg:hidden"
          >
            <span className="sr-only">{open ? "Fermer le menu" : "Ouvrir le menu"}</span>
            {open ? <Close size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <div
        id="menu-mobile"
        ref={panel}
        hidden={!open}
        className="fixed inset-0 top-[var(--header-h)] overflow-y-auto bg-night lg:hidden"
      >
        <nav aria-label="Navigation mobile" className="container-site flex min-h-full flex-col pb-10 pt-6">
          <ul className="flex flex-col">
            {[{ href: "/", label: "Accueil" }, ...nav, { href: "/rejoindre", label: "Rejoindre le club" }].map((item, i) => (
              <li key={item.href} className="border-b border-line-dark">
                <Link
                  href={item.href}
                  aria-current={pathname === item.href || (item.href !== "/" && isActive(item.href)) ? "page" : undefined}
                  className="flex min-h-14 items-baseline gap-4 py-3 font-display text-[2rem] font-bold uppercase leading-none text-white aria-[current=page]:text-accent"
                >
                  <span className="w-7 text-sm font-semibold text-muted-dark">{String(i + 1).padStart(2, "0")}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-auto pt-10 text-sm text-muted-dark">Stade de la Tronchenaz · 1844 Villeneuve VD</p>
        </nav>
      </div>
    </header>
  );
}
