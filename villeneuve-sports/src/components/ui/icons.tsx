import type { SVGProps } from "react";

/**
 * Line icons (24px grid, 1.75 stroke), drawn in the Lucide style.
 * Decorative by default: pass `aria-hidden={false}` with a `<title>` when an
 * icon carries meaning on its own.
 */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 20, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const ArrowRight = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </Base>
);

export const ArrowUpRight = (p: IconProps) => (
  <Base {...p}>
    <path d="M7 17 17 7" />
    <path d="M8 7h9v9" />
  </Base>
);

export const Menu = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 7h16" />
    <path d="M4 12h16" />
    <path d="M4 17h10" />
  </Base>
);

export const Close = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 6l12 12" />
    <path d="M18 6 6 18" />
  </Base>
);

export const MapPin = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Base>
);

export const Mail = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
  </Base>
);

export const Calendar = (p: IconProps) => (
  <Base {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M3.5 10h17" />
    <path d="M8 3v4" />
    <path d="M16 3v4" />
  </Base>
);

export const Clock = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Base>
);

export const Shield = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3 5 6v5.5c0 4.2 2.9 8 7 9.5 4.1-1.5 7-5.3 7-9.5V6l-7-3Z" />
  </Base>
);

export const Check = (p: IconProps) => (
  <Base {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Base>
);

export const Info = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5" />
    <path d="M12 8h.01" />
  </Base>
);

export const Alert = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 4 2.8 19.5h18.4L12 4Z" />
    <path d="M12 10v4" />
    <path d="M12 17h.01" />
  </Base>
);

export const Search = (p: IconProps) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </Base>
);

export const Share = (p: IconProps) => (
  <Base {...p}>
    <circle cx="18" cy="5.5" r="2.5" />
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="18.5" r="2.5" />
    <path d="m8.2 10.8 7.6-4.1" />
    <path d="m8.2 13.2 7.6 4.1" />
  </Base>
);

export const Link = (p: IconProps) => (
  <Base {...p}>
    <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2" />
    <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2" />
  </Base>
);

export const Pause = (p: IconProps) => (
  <Base {...p}>
    <path d="M9 6v12" />
    <path d="M15 6v12" />
  </Base>
);

export const Play = (p: IconProps) => (
  <Base {...p}>
    <path d="M8 5.5v13l10-6.5-10-6.5Z" />
  </Base>
);

export const Users = (p: IconProps) => (
  <Base {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5" />
    <path d="M15.5 4.8a3.5 3.5 0 0 1 0 6.4" />
    <path d="M18 14.8c2 .6 3.2 2.3 3.5 5.2" />
  </Base>
);

export const Whistle = (p: IconProps) => (
  <Base {...p}>
    <circle cx="9" cy="14" r="5" />
    <path d="M12.5 10.5 21 7v4l-6.5 1.5" />
    <path d="M9 14h.01" />
  </Base>
);

export const Lightbulb = (p: IconProps) => (
  <Base {...p}>
    <path d="M9 18h6" />
    <path d="M10 21h4" />
    <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.2 1 2.1h5c0-.9.4-1.7 1-2.1A6 6 0 0 0 12 3Z" />
  </Base>
);

export const Facebook = (p: IconProps) => (
  <Base {...p}>
    <path d="M14.5 21v-7.5H17l.5-3h-3V8.6c0-.9.3-1.6 1.6-1.6h1.5V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 4V10.5H9v3h2.5V21" />
  </Base>
);

export const Globe = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17" />
    <path d="M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.2-3.5-8.5S9.7 5.9 12 3.5Z" />
  </Base>
);

export const Filter = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 5h16l-6 7.5V19l-4 1.5v-8L4 5Z" />
  </Base>
);
