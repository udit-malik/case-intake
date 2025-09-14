/**
 * Simplified Error Handling System
 * Basic error classes and utilities for prototype
 */

import { NextResponse } from "next/server";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

// ============================================================================
// BASIC ERROR CLASSES
// ============================================================================

export class ApiError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(message, 400);
  }
}

// Case-specific errors
export class CaseNotFoundError extends ApiError {
  constructor(caseId: string) {
    super(`Case not found: ${caseId}`, 404);
  }
}

export class InvalidStatusTransitionError extends ApiError {
  constructor(currentStatus: string, newStatus: string) {
    super(
      `Invalid status transition from ${currentStatus} to ${newStatus}`,
      409
    );
  }
}

export class CaseAlreadyProcessedError extends ApiError {
  constructor(operation: string) {
    super(`Case already ${operation}`, 409);
  }
}

export class AudioTooLongError extends ApiError {
  constructor(durationSec: number, maxDurationSec: number = 300) {
    super(
      `Audio duration (${durationSec}s) exceeds maximum allowed duration (${maxDurationSec}s)`,
      422
    );
  }
}

export class MissingRequiredFieldsError extends ApiError {
  public readonly details?: any;

  constructor(missingFields: string[]) {
    super("Missing required fields", 422);
    this.details = { missing: missingFields };
  }
}

// ============================================================================
// SIMPLE ERROR UTILITIES
// ============================================================================

/**
 * Display error to user with toast notification
 */
export function displayError(
  error: unknown,
  options?: {
    showToast?: boolean;
    showAlert?: boolean;
  }
): void {
  const { showToast = true, showAlert = false } = options || {};

  let message = "An unexpected error occurred";

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  }

  if (showToast) {
    toast.error(message);
  } else if (showAlert) {
    alert(message);
  } else {
    logger.error("Error:", { message });
  }
}

/**
 * Handle API response errors
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;

    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

// ============================================================================
// SERVER-SIDE ERROR HANDLING
// ============================================================================

/**
 * Simple error handler for API routes
 */
export function handleApiError(error: unknown): NextResponse {
  // Log error for debugging
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  logger.error("API error", { error: errorMessage });

  // Handle known API errors
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  // Handle specific error types
  if (error instanceof CaseNotFoundError) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  if (error instanceof InvalidStatusTransitionError) {
    return NextResponse.json(
      { error: "Invalid operation for current case status" },
      { status: 409 }
    );
  }

  if (error instanceof MissingRequiredFieldsError) {
    return NextResponse.json(
      { missing: error.details?.missing || [] },
      { status: 422 }
    );
  }

  // Generic error response
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
