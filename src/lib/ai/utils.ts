export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function asBool(v: any): boolean {
  return v === true || v === "true";
}

export function asNum(v: any, { min = -Infinity, max = Infinity, nullable = true }: { min?: number; max?: number; nullable?: boolean } = {}): number | null {
  if (v === null || v === undefined || v === "") return nullable ? null : 0;
  const n = typeof v === "number" ? v : Number(v);
  if (Number.isNaN(n)) return nullable ? null : 0;
  return clamp(n, min, max);
}

export function asStr(v: any): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length ? s : null;
}

export function asEnum<T extends string>(v: any, values: readonly T[], fallback: T): T {
  return values.includes(v) ? (v as T) : fallback;
}

export function asStringArray(v: any, { limit = 8, itemMax = 40 }: { limit?: number; itemMax?: number } = {}): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const x of v) {
    if (typeof x === "string") {
      const t = x.trim();
      if (t) out.push(t.slice(0, itemMax));
      if (out.length >= limit) break;
    }
  }
  return out;
}

export function parseMaybeISO(d: any): string | null {
  if (typeof d !== "string") return null;
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
}

export function stripCodeFences(s: string): string {
  return s.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "");
}


export function daysToPreviousWeekday(currentDay: number, targetDay: number): number {
  return (currentDay + 7 - targetDay) % 7;
}

// resolve relative dates
export function getAnchorDate(incidentDate: string | null, now: Date): string {
  if (!incidentDate) {
    return now.toISOString();
  }
  
  try {
    // if valid ISO date, return
    const parsed = new Date(incidentDate);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
    
    // if relative date string, resolve
    const lowerDate = incidentDate.toLowerCase();
    const today = new Date(now);
    
    if (lowerDate.includes("yesterday")) {
      today.setDate(today.getDate() - 1);
    } else if (lowerDate.includes("last friday")) {
      const dayOfWeek = today.getDay();
      const daysToSubtract = daysToPreviousWeekday(dayOfWeek, 5); // Friday = 5
      today.setDate(today.getDate() - daysToSubtract);
    } else if (lowerDate.includes("two fridays ago")) {
      const dayOfWeek = today.getDay();
      const daysToSubtract = daysToPreviousWeekday(dayOfWeek, 5) + 7; // Last Friday + 7 days
      today.setDate(today.getDate() - daysToSubtract);
    } else if (lowerDate.includes("last week")) {
      today.setDate(today.getDate() - 7);
    } else if (lowerDate.includes("two weeks ago")) {
      today.setDate(today.getDate() - 14);
    }
    
    return today.toISOString();
  } catch {
    // Fallback to provided now date if parsing fails
    return now.toISOString();
  }
}


// days since incident
export function daysSince(
  incidentDate: string | null | undefined,
  now?: Date
): number | null {
  if (!incidentDate) return null;

  try {
    const incident = new Date(incidentDate);
    const currentTime = now || new Date();
    
    // strip time to UTC midnight
    const incidentUTC = new Date(incident.getUTCFullYear(), incident.getUTCMonth(), incident.getUTCDate());
    const currentUTC = new Date(currentTime.getUTCFullYear(), currentTime.getUTCMonth(), currentTime.getUTCDate());
    
    // get difference in days
    const diffTime = currentUTC.getTime() - incidentUTC.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch {
    return null;
  }
}

// regex pattern matcher
export function matchesPattern(
  text: string | null | undefined,
  pattern: RegExp
): boolean {
  if (!text) return false;
  return pattern.test(text);
}


export function spelledNumberToInt(str: string): number | null {
  const wordToNumber: { [key: string]: number } = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
  };

  return wordToNumber[str.toLowerCase()] || null;
}

export function normalizeIncidentDate(incidentDate: string | null | undefined, now: Date = new Date()): string | null {
  if (!incidentDate) return null;

  // if already ISO or contains a year, pass through
  if (/\b\d{4}\b/.test(incidentDate) || /^\d{4}-\d{2}-\d{2}/.test(incidentDate)) {
    return incidentDate;
  }

  // match formats like "april 18" or "apr 18"
  const m = incidentDate.match(/^\s*([A-Za-z]+)\s+(\d{1,2})\s*$/);
  if (!m) return incidentDate;

  const month = m[1];
  const day = parseInt(m[2], 10);
  const currentYear = now.getFullYear();

  // assume current year; if that makes it >30 days in the future, roll back a year
  let candidate = new Date(`${month} ${day}, ${currentYear}`);
  if (candidate.getTime() - now.getTime() > 30 * 24 * 60 * 60 * 1000) {
    candidate = new Date(`${month} ${day}, ${currentYear - 1}`);
  }
  return candidate.toISOString();
}
