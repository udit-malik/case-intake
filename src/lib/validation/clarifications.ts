import "server-only";

/**
 * Takes messy clarification messages and cleans them up by normalizing text and mapping variants to standard questions
 * Reduces duplication + provides consistent questions
 */
export function canonicalizeClarifications(input: string[]): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const canonicalized = input
    .map((item) => {
      if (typeof item !== "string") {
        return "";
      }

      const normalized = item
        .toLowerCase()
        .trim()
        .replace(/[,.;!?]+$/, "") // strip trailing punctuation
        .replace(/\s+/g, " "); // collapse multiple spaces to single space

      if (
        /\b(date of birth|dob|date_of_birth)\b/.test(normalized) ||
        normalized === "dob"
      ) {
        return "What is the date of birth?";
      }

      if (
        /\bestimat(ed|e)?( case)? value\b/.test(normalized) ||
        normalized === "estimated_value"
      ) {
        return "What is the estimated case value?";
      }

      if (/\b(email|e-mail)\b/.test(normalized) || normalized === "email") {
        return "What is the client's email address?";
      }

      if (/\b(phone|phone number|telephone)\b/.test(normalized)) {
        return "What is the client's phone number?";
      }

      if (
        /\b(incident date|date of incident|accident date)\b/.test(normalized) ||
        normalized === "incident_date"
      ) {
        return "What is the date of the incident?";
      }

      if (
        /\b(incident description|what happened|description of incident)\b/.test(
          normalized
        ) ||
        normalized === "incident_description"
      ) {
        return "What happened in the incident?";
      }

      if (/\b(insurance provider|insurance company)\b/.test(normalized)) {
        return "What is the insurance provider?";
      }

      if (/\b(insurance policy|policy number)\b/.test(normalized)) {
        return "What is the insurance policy number?";
      }

      if (/\b(employer|employer name|workplace)\b/.test(normalized)) {
        return "What is the client's employer?";
      }

      if (normalized === "client_name") {
        return "What is the client's full name?";
      }

      if (/\b(injuries|injury|injured)\b/.test(normalized)) {
        return "What injuries were sustained?";
      }

      if (/\b(treatment|doctor|hospital|medical provider)\b/.test(normalized)) {
        return "What medical treatment was received?";
      }

      if (/\b(pain level|pain scale|pain)\b/.test(normalized)) {
        return "What is the pain level (0-10)?";
      }

      if (/\b(days missed|work days|time off)\b/.test(normalized)) {
        return "How many days of work were missed?";
      }

      if (/\b(location|where|incident location)\b/.test(normalized)) {
        return "Where did the incident occur?";
      }

      return normalized;
    })
    .filter((item) => item.length > 0);

  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of canonicalized) {
    if (!seen.has(item)) {
      seen.add(item);
      result.push(item);
    }
  }

  return result;
}
