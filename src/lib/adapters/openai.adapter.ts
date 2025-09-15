if (typeof window !== "undefined") {
  throw new Error("openai.adapter.ts is server-only");
}

import OpenAI from "openai";
import { logger } from "@/lib/logger";
import type { ExtractOptions } from "@/types";
import { normalizeEmailLikeString, normalizeDate, stringToNumber } from "@/schemas/intake";

export interface ExtractResult {
  intake: any;
  clarifications: string[];
  modelId: string;
  requestId: string;
}

const DEFAULT_MODEL = "gpt-4o";
const DEFAULT_TEMPERATURE = 0;
const DEFAULT_SEED = 42;

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is required");
  }
  return new OpenAI({ apiKey });
}

// get structured data from transcript
export async function extract(
  transcript: string,
  options: ExtractOptions = {}
): Promise<ExtractResult> {
  const { temperature = DEFAULT_TEMPERATURE, seed = DEFAULT_SEED } = options;

  const client = getOpenAIClient();

  try {
    logger.info("Starting OpenAI extraction", {
      transcriptLength: transcript.length,
      model: DEFAULT_MODEL,
      temperature,
      seed,
    });

    const jsonSchema = {
      name: "intake_schema",
      schema: {
        type: "object",
        properties: {
          client_name: { type: "string" },
          date_of_birth: { type: "string", format: "date" },
          phone_number: { type: "string" },
          email: { type: "string", format: "email" },
          incident_date: { type: "string", format: "date" },
          incident_description: { type: "string" },
          incident_location: { type: "string" },
          injuries: { type: "string" },
          treatment_providers: {
            type: "array",
            items: { type: "string" }
          },
          insurance_provider: { type: "string" },
          insurance_policy_number: { type: "string" },
          employer: { type: "string" },
          days_missed_work: { type: "integer" },
          pain_level: { 
            type: "integer",
            minimum: 0,
            maximum: 10 
          },
          estimated_value: { type: "integer" },
          clarification_needed: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: [
          "client_name",
          "date_of_birth", 
          "email",
          "incident_date",
          "incident_description",
          "estimated_value"
        ],
        additionalProperties: false
      }
    };

    const response = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature,
      seed,
      messages: [
        {
          role: "system",
          content: `You are a legal intake specialist. Extract structured information from client interview transcripts for personal injury cases.

CRITICAL: Return ONLY valid JSON. No explanations, no prose, no markdown formatting.

IMPORTANT: If a value is not stated, return an empty string (or empty array) and add a short note to clarification_needed. Do not guess.

For each field:
- client_name: Full name of the client
- date_of_birth: Birth date in YYYY-MM-DD format ONLY if explicitly stated. If not mentioned, return empty string. DO NOT guess or use current date.
- phone_number: Phone number (empty string if not provided)
- email: Email address. Normalize speech patterns: if caller says 'sarah dot delgado 89 at outlook dot com', output sarah.delgado89@outlook.com
- incident_date: Date of incident in YYYY-MM-DD format if possible
- incident_description: Detailed description of what happened
- incident_location: Where the incident occurred (empty string if not provided)
- injuries: Description of injuries sustained (empty string if not provided)
- treatment_providers: Array of healthcare providers/hospitals
- insurance_provider: Insurance company name (empty string if not provided)
- insurance_policy_number: Policy number (empty string if not provided)
- employer: Employer name (empty string if not provided)
- days_missed_work: Number of work days missed (integer)
- pain_level: Pain level 0-10 scale (integer)
- estimated_value: Estimated case value in dollars (integer)
- clarification_needed: Array of specific questions that need clarification

If any information is unclear, ambiguous, or missing, add specific questions to clarification_needed array.
Always return valid JSON matching the exact schema.`,
        },
        {
          role: "user",
          content: `Please extract structured data from this transcript:\n\n${transcript}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: jsonSchema,
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    const parsedData = JSON.parse(content);

    if (parsedData.email) {
      parsedData.email = normalizeEmailLikeString(parsedData.email);
    }
    
    if (parsedData.date_of_birth && parsedData.date_of_birth.trim() !== "") {
      const normalizedDob = normalizeDate(parsedData.date_of_birth);
      // ensure DOB is not set to current date
      const today = new Date().toISOString().split('T')[0];
      if (normalizedDob === today) {
        // if AI returned today's date, treat it as missing
        parsedData.date_of_birth = "";
      } else {
        parsedData.date_of_birth = normalizedDob;
      }
    } else {
      parsedData.date_of_birth = "";
    }
    
    if (parsedData.incident_date) {
      parsedData.incident_date = normalizeDate(parsedData.incident_date);
    }
    
    if (parsedData.days_missed_work) {
      parsedData.days_missed_work = stringToNumber(parsedData.days_missed_work.toString());
    }
    
    if (parsedData.pain_level) {
      parsedData.pain_level = stringToNumber(parsedData.pain_level.toString());
    }
    
    if (parsedData.estimated_value) {
      parsedData.estimated_value = stringToNumber(parsedData.estimated_value.toString());
    }

    // validate and structure response
    const intake = {
      client_name: parsedData.client_name || "",
      date_of_birth: parsedData.date_of_birth || "", // never auto-default to current date
      phone_number: parsedData.phone_number || "",
      email: parsedData.email || "",
      incident_date: parsedData.incident_date || "",
      incident_description: parsedData.incident_description || "",
      incident_location: parsedData.incident_location || "",
      injuries: parsedData.injuries || "",
      treatment_providers: Array.isArray(parsedData.treatment_providers) 
        ? parsedData.treatment_providers 
        : [],
      insurance_provider: parsedData.insurance_provider || "",
      insurance_policy_number: parsedData.insurance_policy_number || "",
      employer: parsedData.employer || "",
      days_missed_work: parsedData.days_missed_work || undefined,
      pain_level: parsedData.pain_level || undefined,
      estimated_value: parsedData.estimated_value || undefined,
      clarification_needed: [],
    };

    const clarifications = Array.isArray(parsedData.clarification_needed)
      ? parsedData.clarification_needed
      : [];

    // merge clarifications into intake object
    intake.clarification_needed = clarifications;

    logger.info("OpenAI extraction completed", {
      model: DEFAULT_MODEL,
      requestId: response.id,
      clarificationCount: clarifications.length,
      clarifications,
    });

    return {
      intake,
      clarifications,
      modelId: DEFAULT_MODEL,
      requestId: response.id,
    };
  } catch (error) {
    logger.error("OpenAI extraction failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      transcriptLength: transcript.length,
      model: DEFAULT_MODEL,
    });
    throw error;
  }
}
