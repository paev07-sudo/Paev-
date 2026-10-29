const longDate = new Intl.DateTimeFormat("fr-CH", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Zurich",
});

const shortDate = new Intl.DateTimeFormat("fr-CH", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Europe/Zurich",
});

const monthYear = new Intl.DateTimeFormat("fr-CH", { month: "long", year: "numeric", timeZone: "Europe/Zurich" });

/** Parse "YYYY-MM-DD" at noon so the day never shifts across time zones. */
function parse(iso: string): Date {
  return new Date(`${iso}T12:00:00Z`);
}

export function formatLongDate(iso: string): string {
  return longDate.format(parse(iso));
}

export function formatShortDate(iso: string): string {
  return shortDate.format(parse(iso));
}

export function formatMonthYear(iso: string): string {
  return monthYear.format(parse(iso));
}

export function dayParts(iso: string): { day: string; month: string; weekday: string } {
  const d = parse(iso);
  return {
    day: new Intl.DateTimeFormat("fr-CH", { day: "2-digit", timeZone: "Europe/Zurich" }).format(d),
    month: new Intl.DateTimeFormat("fr-CH", { month: "short", timeZone: "Europe/Zurich" }).format(d).replace(".", ""),
    weekday: new Intl.DateTimeFormat("fr-CH", { weekday: "short", timeZone: "Europe/Zurich" }).format(d).replace(".", ""),
  };
}
