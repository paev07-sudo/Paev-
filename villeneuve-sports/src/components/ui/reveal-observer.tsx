"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Adds `.is-visible` to every `[data-reveal]` element once it has reached the
 * viewport, including elements skipped by a fast scroll, an anchor jump or
 * the End key. Content stays visible without JavaScript (the hiding rule
 * only applies under `html.js`) and when printing.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const pending = new Set(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-visible)"));
    const show = (el: HTMLElement) => {
      el.classList.add("is-visible");
      pending.delete(el);
    };

    let frame = 0;
    const sweep = () => {
      frame = 0;
      const limit = window.innerHeight * 0.95;
      for (const el of pending) {
        if (el.getBoundingClientRect().top < limit) show(el);
      }
      if (pending.size === 0) cleanup();
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(sweep);
    };
    const showAll = () => pending.forEach(show);

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("beforeprint", showAll);
    function cleanup() {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("beforeprint", showAll);
      if (frame) cancelAnimationFrame(frame);
    }
    schedule();
    return cleanup;
  }, [pathname]);

  return null;
}
