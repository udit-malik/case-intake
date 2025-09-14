import { z } from "zod";

// base extraction schema
export const IntakeBaseSchema = z.object({
  client_name: z.string().default(""),
  date_of_birth: z.string().default(""), 
  phone_number: z.string().default(""),
  email: z.union([z.string().email({}), z.literal("")]).default(""),
  incident_date: z.string().default(""), 
  incident_description: z.string().default(""),
  incident_location: z.string().default(""),
  injuries: z.string().default(""),
  treatment_providers: z.array(z.string()).default([]),
  insurance_provider: z.string().default(""),
  insurance_policy_number: z.string().default(""),
  employer: z.string().default(""),
  days_missed_work: z.number().int().optional(),
  pain_level: z.number().int().min(0).max(10).optional(),
  estimated_value: z.number().int().optional(), 
  clarification_needed: z.array(z.string()).default([]),
});

// strict schema (requires non-empty values)
export const IntakeStrictSchema = IntakeBaseSchema.extend({
  client_name: z.string().min(1, "Client name is required"),
  email: z
    .string()
    .email({ message: "Invalid email address" })
    .min(1, "Email is required"),
  incident_date: z.string().min(1, "Incident date is required"),
  incident_description: z.string().min(1, "Incident description is required"),
});

export const IntakeSchema = IntakeBaseSchema;

export type Intake = z.infer<typeof IntakeBaseSchema>;
export type IntakeStrict = z.infer<typeof IntakeStrictSchema>;


// client-side normalizers
// normalize email-like to email from speech patterns
export function normalizeEmailLikeString(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  let normalized = input.toLowerCase().trim();

  normalized = normalized.replace(/\s+at\s+/g, "@");
  normalized = normalized.replace(/\s+dot\s+/g, ".");

  // remove spaces around @ and .
  normalized = normalized.replace(/\s*@\s*/g, "@");
  normalized = normalized.replace(/\s*\.\s*/g, ".");

  // strip trailing punctuation
  normalized = normalized.replace(/[,.;]+$/, "");

  // collapse multiple dots but preserve @
  normalized = normalized.replace(/\.{2,}/g, ".");

  return normalized;
}


export function treatmentProvidersToString(providers: string[]): string {
  if (!Array.isArray(providers)) {
    return "";
  }
  return providers.filter((p) => p.trim().length > 0).join(", ");
}

export function stringToTreatmentProviders(input: string): string[] {
  if (!input || typeof input !== "string") {
    return [];
  }

  const providers = input
    .split(",")
    .map((provider) => provider.trim())
    .filter((provider) => provider.length > 0);

  return [...new Set(providers)];
}

// YYYY-MM-DD
export function normalizeDate(dateStr: string): string {
  if (!dateStr || typeof dateStr !== "string") {
    return "";
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return dateStr; 
  }
  return date.toISOString().split("T")[0];
}


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


export function numberToString(num: number | undefined): string {
  return num !== undefined ? num.toString() : "";
}
