if (typeof window !== "undefined") {
  throw new Error("deepgram.adapter.ts is server-only");
}

import { logger } from "@/lib/logger";
import type { TranscribeOptions, TranscribeResult } from "@/types";

interface DeepgramResponse {
  results: {
    channels: Array<{
      alternatives: Array<{
        transcript?: string;
        paragraphs?: {
          transcript: string;
        };
        smart_format?: {
          transcript: string;
        };
      }>;
    }>;
  };
  metadata?: {
    duration?: number;
    model_info?: {
      name?: string;
    };
    request_id?: string;
  };
}

const DEEPGRAM_API_URL = "https://api.deepgram.com/v1/listen";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

function getApiKey(): string {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPGRAM_API_KEY environment variable is required");
  }
  return apiKey;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// calc exponential backoff delay
function getRetryDelay(attempt: number): number {
  return BASE_DELAY_MS * Math.pow(2, attempt - 1);
}

// get transcript text from Deepgram resp
function extractTranscriptText(response: DeepgramResponse): string {
  try {
    const channel = response.results?.channels?.[0];
    if (!channel) {
      throw new Error("No channels found in response");
    }

    const alternative = channel.alternatives?.[0];
    if (!alternative) {
      throw new Error("No alternatives found in response");
    }

    // prefer smart_format if available, then paragraphs, then transcript
    if (alternative.smart_format?.transcript) {
      return alternative.smart_format.transcript;
    }

    if (alternative.paragraphs?.transcript) {
      return alternative.paragraphs.transcript;
    }

    if (alternative.transcript) {
      return alternative.transcript;
    }

    throw new Error("No transcript found in response");
  } catch (error) {
    logger.error("Failed to extract transcript text", { error, response });
    throw new Error(
      `Failed to extract transcript: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

function extractDuration(response: DeepgramResponse): number {
  return response.metadata?.duration || 0;
}

function extractRequestId(response: DeepgramResponse): string | null {
  return response.metadata?.request_id || null;
}

function extractModelName(response: DeepgramResponse): string {
  return response.metadata?.model_info?.name || "unknown";
}

export async function transcribe(
  audioUrl: string,
  options: TranscribeOptions = {}
): Promise<TranscribeResult> {
  const { model = "nova-2", language = "en", diarize = true } = options;

  const apiKey = getApiKey();

  const queryParams = new URLSearchParams({
    model,
    language,
    diarize: diarize.toString(),
    smart_format: "true",
  });

  const requestUrl = `${DEEPGRAM_API_URL}?${queryParams.toString()}`;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.info("Deepgram transcription attempt", {
        attempt,
        audioUrl: audioUrl.substring(0, 100) + "...",
        model,
        language,
        diarize,
      });

      const response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: audioUrl }),
      });

      if (response.status === 429 || response.status >= 500) {
        if (attempt < MAX_RETRIES) {
          const delay = getRetryDelay(attempt);
          logger.warn("Deepgram request failed, retrying", {
            attempt,
            status: response.status,
            delayMs: delay,
          });
          await sleep(delay);
          continue;
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Deepgram API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const responseData: DeepgramResponse = await response.json();

      const text = extractTranscriptText(responseData);
      const durationSec = extractDuration(responseData);
      const requestId = extractRequestId(responseData);
      const modelId = extractModelName(responseData);

      logger.info("Deepgram transcription successful", {
        requestId,
        modelId,
        textLength: text.length,
        durationSec,
      });

      return {
        text,
        durationSec,
        modelId,
        requestId,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_RETRIES) {
        const delay = getRetryDelay(attempt);
        logger.warn("Deepgram request failed, retrying", {
          attempt,
          error: lastError.message,
          delayMs: delay,
        });
        await sleep(delay);
      } else {
        logger.error("Deepgram transcription failed after all retries", {
          attempts: MAX_RETRIES,
          error: lastError.message,
        });
      }
    }
  }

  // all retries failed
  throw new Error(
    `Deepgram transcription failed after ${MAX_RETRIES} attempts: ${lastError?.message || "Unknown error"}`
  );
}
