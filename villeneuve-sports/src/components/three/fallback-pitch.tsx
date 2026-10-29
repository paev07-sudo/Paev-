/**
 * CSS-only hero used before the 3D scene is ready, without WebGL, or in
 * data-saver mode: a floodlit pitch in perspective with regulation markings.
 */
export function FallbackPitch() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-night">
      {/* Sky and floodlight glows */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_70%_0%,#16285e_0%,#081431_45%,#050b1f_75%)]" />
      <div className="absolute left-[8%] top-[6%] h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(240,246,255,0.9)_0%,rgba(150,180,255,0.25)_30%,transparent_70%)] blur-[2px]" />
      <div className="absolute right-[6%] top-[4%] h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(240,246,255,0.95)_0%,rgba(150,180,255,0.25)_30%,transparent_70%)] blur-[2px]" />
      {/* Mountains */}
      <svg className="absolute inset-x-0 top-[34%] h-[22%] w-full" viewBox="0 0 1440 220" preserveAspectRatio="none">
        <path d="M0 160 L120 90 L210 130 L330 40 L430 110 L560 60 L690 120 L800 30 L930 100 L1050 55 L1180 120 L1300 70 L1440 110 L1440 220 L0 220Z" fill="#0c1a40" />
        <path d="M0 190 L160 140 L300 170 L460 120 L620 165 L780 110 L940 160 L1110 125 L1260 165 L1440 140 L1440 220 L0 220Z" fill="#081230" />
      </svg>
      {/* Pitch in perspective */}
      <div className="absolute inset-x-[-30%] bottom-[-38%] top-[44%] [perspective:900px]">
        <div className="fallback-pitch absolute inset-0 origin-center [transform-style:preserve-3d]">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,#1c4d27_0_5.55%,#24602f_5.55%_11.1%)] shadow-[0_0_160px_40px_rgba(5,11,31,0.9)_inset]" />
          <svg className="absolute inset-[4%] h-[92%] w-[92%]" viewBox="0 0 105 68" preserveAspectRatio="none" fill="none" stroke="rgba(240,244,240,0.85)" strokeWidth="0.3">
            <rect x="0" y="0" width="105" height="68" />
            <line x1="52.5" y1="0" x2="52.5" y2="68" />
            <circle cx="52.5" cy="34" r="9.15" />
            <rect x="0" y="13.84" width="16.5" height="40.32" />
            <rect x="88.5" y="13.84" width="16.5" height="40.32" />
            <rect x="0" y="24.84" width="5.5" height="18.32" />
            <rect x="99.5" y="24.84" width="5.5" height="18.32" />
            <circle cx="52.5" cy="34" r="0.4" fill="rgba(240,244,240,0.85)" />
          </svg>
        </div>
      </div>
      {/* Ball */}
      <div className="absolute right-[14%] top-[46%] hidden h-[clamp(5rem,11vw,10rem)] w-[clamp(5rem,11vw,10rem)] rounded-full bg-[radial-gradient(circle_at_35%_30%,#ffffff_0%,#e9ebf0_35%,#9aa3b8_70%,#3a4566_100%)] shadow-[0_30px_60px_-10px_rgba(0,0,0,0.7),inset_-8px_-10px_30px_rgba(15,29,85,0.55)] md:block">
        <div className="absolute left-[38%] top-[34%] h-[26%] w-[26%] rotate-12 bg-[#0f1d55] [clip-path:polygon(50%_0,100%_38%,82%_100%,18%_100%,0_38%)]" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(to_top,#050b1f_2%,transparent_45%)]" />
    </div>
  );
}
