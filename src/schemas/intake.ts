import { z } from "zod";

// Base schema with minimal validation for extraction time (allows blanks)
export const IntakeBaseSchema = z.object({
  client_name: z.string().default(""),
  date_of_birth: z.string().default(""), // "YYYY-MM-DD" if possible
  phone_number: z.string().default(""),
  email: z.union([z.string().email({}), z.literal("")]).default(""),
  incident_date: z.string().default(""), // "YYYY-MM-DD" if possible
  incident_description: z.string().default(""),
  incident_location: z.string().default(""),
  injuries: z.string().default(""),
  treatment_providers: z.array(z.string()).default([]),
  insurance_provider: z.string().default(""),
  insurance_policy_number: z.string().default(""),
  employer: z.string().default(""),
  days_missed_work: z.number().int().optional(),
  pain_level: z.number().int().min(0).max(10).optional(),
  estimated_value: z.number().int().optional(), // $$$ estimate
  clarification_needed: z.array(z.string()).default([]),
});

// Strict schema for form validation (requires non-empty values)
export const IntakeStrictSchema = IntakeBaseSchema.extend({
  client_name: z.string().min(1, "Client name is required"),
  email: z
    .string()
    .email({ message: "Invalid email address" })
    .min(1, "Email is required"),
  incident_date: z.string().min(1, "Incident date is required"),
  incident_description: z.string().min(1, "Incident description is required"),
});

// Default export for backward compatibility (uses base schema)
export const IntakeSchema = IntakeBaseSchema;

export type Intake = z.infer<typeof IntakeBaseSchema>;
export type IntakeStrict = z.infer<typeof IntakeStrictSchema>;

// Client-side normalizers for form display and processing

/**
 * Normalize email-like strings by converting speech patterns to proper email format
 */
export function normalizeEmailLikeString(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  let normalized = input.toLowerCase().trim();

  // Replace common speech patterns
  normalized = normalized.replace(/\s+at\s+/g, "@");
  normalized = normalized.replace(/\s+dot\s+/g, ".");

  // Remove spaces around @ and .
  normalized = normalized.replace(/\s*@\s*/g, "@");
  normalized = normalized.replace(/\s*\.\s*/g, ".");

  // Strip trailing punctuation
  normalized = normalized.replace(/[,.;]+$/, "");

  // Collapse multiple dots (but preserve @)
  normalized = normalized.replace(/\.{2,}/g, ".");

  return normalized;
}

/**
 * Convert treatment providers array to comma-separated string for form display
 */
export function treatmentProvidersToString(providers: string[]): string {
  if (!Array.isArray(providers)) {
    return "";
  }
  return providers.filter((p) => p.trim().length > 0).join(", ");
}

/**
 * Convert comma-separated string to treatment providers array
 */
export function stringToTreatmentProviders(input: string): string[] {
  if (!input || typeof input !== "string") {
    return [];
  }

  const providers = input
    .split(",")
    .map((provider) => provider.trim())
    .filter((provider) => provider.length > 0);

  // Dedupe by converting to Set and back to array
  return [...new Set(providers)];
}

/**
 * Normalize date strings to YYYY-MM-DD format for form display
 */
export function normalizeDate(dateStr: string): string {
  if (!dateStr || typeof dateStr !== "string") {
    return "";
  }

  // Basic date normalization - convert common formats to YYYY-MM-DD
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return dateStr; // Return original if can't parse
  }
  return date.toISOString().split("T")[0];
}

/**
 * Convert numeric string to number, returning undefined if invalid
 */
export function stringToNumber(input: string): number | undefined {
  if (!input || typeof input !== "string") {
    return undefined;
  }

  const trimmed = input.trim();
  if (!/^\d+$/.test(trimmed)) {
    return undefined;
  }

  const num = parseInt(trimmed, 10);
  return isNaN(num) ? undefined : num;
}

/**
 * Convert number to string for form display
 */
export function numberToString(num: number | undefined): string {
  return num !== undefined ? num.toString() : "";
}
