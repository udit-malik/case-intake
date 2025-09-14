if (typeof window !== "undefined") {
  throw new Error("storage.adapter.ts is server-only");
}

import { UTApi } from "uploadthing/server";
import { logger } from "@/lib/logger";

export interface FileSizeResult {
  sizeBytes: number;
  success: boolean;
}

export interface DeleteFileResult {
  success: boolean;
  error?: string;
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;


function getUTApiClient(): UTApi {
  const token = process.env.UPLOADTHING_TOKEN;
  if (!token) {
    throw new Error("UPLOADTHING_TOKEN environment variable is required");
  }
  return new UTApi({ token });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// calc exponential backoff delay
function getRetryDelay(attempt: number): number {
  return BASE_DELAY_MS * Math.pow(2, attempt - 1);
}

// get file size
export async function getSizeByHead(url: string): Promise<FileSizeResult> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.info("Getting file size", {
        attempt,
        url: url.substring(0, 100) + "...", // log partial URL
      });

      const response = await fetch(url, {
        method: "HEAD",
        headers: {
          "User-Agent": "CaseIntakeSystem/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentLength = response.headers.get("content-length");
      const sizeBytes = contentLength ? parseInt(contentLength, 10) : 0;

      logger.info("File size retrieved", {
        url: url.substring(0, 100) + "...",
        sizeBytes,
      });

      return {
        sizeBytes,
        success: true,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_RETRIES) {
        const delay = getRetryDelay(attempt);
        logger.warn("File size request failed, retrying", {
          attempt,
          error: lastError.message,
          delayMs: delay,
        });
        await sleep(delay);
      } else {
        logger.error("File size request failed after all retries", {
          attempts: MAX_RETRIES,
          error: lastError.message,
          url: url.substring(0, 100) + "...",
        });
      }
    }
  }

  // all retries failed
  return {
    sizeBytes: 0,
    success: false,
  };
}


export async function deleteFile(fileKey: string): Promise<DeleteFileResult> {
  const client = getUTApiClient();
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.info("Deleting file", {
        attempt,
        fileKey,
      });

      const result = await client.deleteFiles(fileKey);

      if (result.success) {
        logger.info("File deleted successfully", {
          fileKey,
          deletedCount: result.deletedCount,
        });

        return {
          success: true,
        };
      } else {
        throw new Error(`UploadThing deletion failed: Unknown error`);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_RETRIES) {
        const delay = getRetryDelay(attempt);
        logger.warn("File deletion failed, retrying", {
          attempt,
          error: lastError.message,
          delayMs: delay,
        });
        await sleep(delay);
      } else {
        logger.error("File deletion failed after all retries", {
          attempts: MAX_RETRIES,
          error: lastError.message,
          fileKey,
        });
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || "Unknown error",
  };
}

export async function fileExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent": "CaseIntakeSystem/1.0",
      },
    });
    return response.ok;
  } catch (error) {
    logger.warn("File existence check failed", {
      url: url.substring(0, 100) + "...",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return false;
  }
}

export async function getFileMetadata(url: string): Promise<{
  sizeBytes: number;
  contentType?: string;
  lastModified?: Date;
  exists: boolean;
}> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent": "CaseIntakeSystem/1.0",
      },
    });

    if (!response.ok) {
      return {
        sizeBytes: 0,
        exists: false,
      };
    }

    const contentLength = response.headers.get("content-length");
    const contentType = response.headers.get("content-type") || undefined;
    const lastModified = response.headers.get("last-modified");

    return {
      sizeBytes: contentLength ? parseInt(contentLength, 10) : 0,
      contentType,
      lastModified: lastModified ? new Date(lastModified) : undefined,
      exists: true,
    };
  } catch (error) {
    logger.warn("File metadata retrieval failed", {
      url: url.substring(0, 100) + "...",
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      sizeBytes: 0,
      exists: false,
    };
  }
}
