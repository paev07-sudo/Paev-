"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { FallbackPitch } from "./fallback-pitch";

const StadiumScene = dynamic(() => import("./stadium-scene"), { ssr: false });

type Mode = "pending" | "webgl" | "fallback";

/**
 * True when WebGL2 runs on a real GPU. Software renderers (SwiftShader,
 * llvmpipe…) draw on the CPU and would block the main thread, so they get
 * the CSS hero. `?hero=3d` forces the scene, e.g. for previews.
 */
function hardwareWebGL(): boolean {
  try {
    if (new URLSearchParams(window.location.search).get("hero") === "3d") return true;
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return false;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return !/swiftshader|llvmpipe|softpipe|software/i.test(renderer);
  } catch {
    return false;
  }
}

/** Any error inside the 3D tree (context lost, shader failure) shows the CSS fallback. */
class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Chooses between the real-time scene and the CSS fallback, and pauses the
 * scene when the hero leaves the viewport. The fallback is server-rendered,
 * so the hero is complete before any 3D code loads.
 */
export function HeroStage() {
  const root = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("pending");
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(true);
  const [still, setStill] = useState(false);
  const [lite, setLite] = useState(false);
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
    const saveData = nav.connection?.saveData === true;
    const lowMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory < 2;
    const small = window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
    // Decided once on mount from browser capabilities; nothing to sync on the server.
    /* eslint-disable react-hooks/set-state-in-effect */
    setStill(reduce.matches);
    setLite(small || (nav.hardwareConcurrency ?? 8) <= 4);
    setMode(!saveData && !lowMemory && hardwareWebGL() ? "webgl" : "fallback");
    /* eslint-enable react-hooks/set-state-in-effect */
    const onChange = () => setStill(reduce.matches);
    reduce.addEventListener("change", onChange);
    return () => reduce.removeEventListener("change", onChange);
  }, []);

  // Mount the scene once the page has loaded and the main thread is idle, so
  // the 3D code never competes with the first paint or with hydration.
  useEffect(() => {
    if (mode !== "webgl") return;
    let handle = 0;
    const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 300));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const onLoad = () => {
      handle = ric(() => setIdle(true), { timeout: 2500 });
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
    return () => {
      window.removeEventListener("load", onLoad);
      if (handle) cancel(handle);
    };
  }, [mode]);

  useEffect(() => {
    const el = root.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    const onVisibility = () => setActive(document.visibilityState === "visible" && el.getBoundingClientRect().bottom > 0);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div ref={root} className="absolute inset-0" data-hero-mode={mode} data-hero-ready={ready ? "true" : "false"}>
      <div className={`absolute inset-0 transition-opacity duration-1000 ${mode === "webgl" && ready ? "opacity-0" : "opacity-100"}`}>
        <FallbackPitch />
      </div>
      {mode === "webgl" && idle && (
        <div className={`absolute inset-0 transition-opacity duration-[1400ms] ease-out ${ready ? "opacity-100" : "opacity-0"}`}>
          <SceneBoundary onError={() => setMode("fallback")}>
            <StadiumScene still={still} lite={lite} active={active} onReady={() => setReady(true)} onSlow={() => setStill(true)} />
          </SceneBoundary>
        </div>
      )}
      {/* Loading line: shows while the 3D scene compiles, never blocks the content. */}
      {mode !== "fallback" && (
        <div aria-hidden="true" className={`absolute inset-x-0 bottom-0 h-0.5 overflow-hidden transition-opacity duration-500 ${ready ? "opacity-0" : "opacity-100"}`}>
          <div className="h-full w-1/3 animate-[loading_1.4s_ease-in-out_infinite] bg-accent motion-reduce:animate-none" />
        </div>
      )}
    </div>
  );
}
