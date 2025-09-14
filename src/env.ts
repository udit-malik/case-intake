// Do not import this file from client components.
import { z } from "zod";

const envSchema = z.object({
  // Required (must be non-empty)
  DATABASE_URL: z.string().min(1),
  UPLOADTHING_TOKEN: z.string().min(1),
  DEEPGRAM_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),

  // Defaults & coercions
  APP_URL: z.string().url().default("http://localhost:3000"),
  TRANSCRIPTION_PROVIDER: z
    .enum(["deepgram", "whisper", "elevenlabs"])
    .default("deepgram"),
  EXTRACTION_MODEL_VERSION: z.string().min(1).default("gpt-4o-mini-2024-07-18"),
  EXTRACTION_TEMPERATURE: z.coerce.number().min(0).max(1).default(0),
  MODEL_SEED: z.coerce.number().int().default(42),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().max(30).default(30),
  MAX_AUDIO_DURATION_SEC: z.coerce
    .number()
    .int()
    .positive()
    .max(300)
    .default(300),

  // Optional (allow blank string as well)
  RESEND_API_KEY: z.string().optional().default(""),
  RESEND_FROM_EMAIL: z
    .union([z.string().email({}), z.literal("")])
    .optional()
    .default(""),
  SCORING_MODEL_VERSION: z.string().optional().default(""),
  SCORING_TEMPERATURE: z.coerce.number().min(0).max(1).optional().default(0),
});

// Build raw object from process.env with sensible defaults
const rawEnv = {
  ...process.env,
  APP_URL: process.env.APP_URL || "http://localhost:3000",
  TRANSCRIPTION_PROVIDER: process.env.TRANSCRIPTION_PROVIDER || "deepgram",
  EXTRACTION_MODEL_VERSION:
    process.env.EXTRACTION_MODEL_VERSION || "gpt-4o-mini-2024-07-18",
  EXTRACTION_TEMPERATURE: process.env.EXTRACTION_TEMPERATURE || "0",
  MODEL_SEED: process.env.MODEL_SEED || "42",
  MAX_UPLOAD_MB: process.env.MAX_UPLOAD_MB || "30",
  MAX_AUDIO_DURATION_SEC: process.env.MAX_AUDIO_DURATION_SEC || "300",
  RESEND_API_KEY: process.env.RESEND_API_KEY || "",
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || "",
  SCORING_MODEL_VERSION: process.env.SCORING_MODEL_VERSION || "",
  SCORING_TEMPERATURE: process.env.SCORING_TEMPERATURE || "0",
};

// Parse and validate environment variables
const parseResult = envSchema.safeParse(rawEnv);

let env: z.infer<typeof envSchema>;

if (!parseResult.success) {
  const fieldErrors = parseResult.error.flatten().fieldErrors;
  const messages = Object.entries(fieldErrors)
    .map(([key, errors]) => `${key}: ${errors?.join(", ") || "invalid"}`)
    .join("; ");

  if (process.env.NODE_ENV === "production") {
    throw new Error(`ENV validation failed: ${messages}`);
  } else {
    // Use console.warn for environment validation as logger might not be available yet
    console.warn("ENV validation failed (dev):", messages);

    // Return best-effort object for development
    env = {
      DATABASE_URL: process.env.DATABASE_URL || "",
      UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN || "",
      DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY || "",
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
      APP_URL: "http://localhost:3000",
      TRANSCRIPTION_PROVIDER: "deepgram" as const,
      EXTRACTION_MODEL_VERSION: "gpt-4o-mini-2024-07-18",
      EXTRACTION_TEMPERATURE: 0,
      MODEL_SEED: 42,
      MAX_UPLOAD_MB: 30,
      MAX_AUDIO_DURATION_SEC: 300,
      RESEND_API_KEY: "",
      RESEND_FROM_EMAIL: "",
      SCORING_MODEL_VERSION: "",
      SCORING_TEMPERATURE: 0,
    };
  }
} else {
  // Use the validated and typed environment object
  env = parseResult.data;
}

// Export the environment object
export { env };
