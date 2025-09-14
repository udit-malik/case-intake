"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { displayError } from "@/lib/errors";
import { caseApi } from "@/lib/api-client";
import { logger } from "@/lib/logger";


// hook for handling case action API calls; consistent loading states, errs, and page refresh behavior
export function useCaseAction(
  caseId: string,
  actionPath: string,
  options: {
    actionName?: string;
    onError?: (error: string) => void;
    onSuccess?: () => void;
    refreshOnSuccess?: boolean;
    requestOptions?: RequestInit;
  } = {}
): {
  execute: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
} {
  const {
    actionName = "Action",
    onError,
    onSuccess,
    refreshOnSuccess = true,
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const clearError = () => setError(null);

  const execute = async () => {
    if (isLoading) return; // prevent multiple clicks

    setIsLoading(true);
    setError(null);

    try {
      switch (actionPath) {
        case "transcribe":
          await caseApi.transcribe(caseId);
          break;
        case "extract":
          await caseApi.extract(caseId);
          break;
        case "score":
          await caseApi.score(caseId);
          break;
        case "submit":
          await caseApi.submit(caseId);
          break;
        default:
          throw new Error(`Unknown action: ${actionPath}`);
      }

      // call custom success handler if provided
      if (onSuccess) {
        onSuccess();
      }

      // refresh by default unless disabled
      if (refreshOnSuccess) {
        router.refresh();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : `${actionName} failed`;
      logger.error(`${actionName} error`, { error: err, caseId, actionPath });

      setError(errorMessage);

      displayError(err, {
        showToast: true,
        showAlert: false,
      });

      // call custom error handler if provided
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    execute,
    isLoading,
    error,
    clearError,
  };
}

// hook for case actions that need to save draft before executing
export function useCaseActionWithDraft(
  caseId: string,
  actionPath: string,
  options: {
    actionName?: string;
    onError?: (error: string) => void;
    onSuccess?: () => void;
    refreshOnSuccess?: boolean;
    requestOptions?: RequestInit;
    
    onSaveDraft?: () => Promise<void>;
  
    hasUnsavedChanges?: boolean;
  } = {} as any
): {
  execute: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
} {
  const { onSaveDraft, hasUnsavedChanges = false, ...baseOptions } = options;

  const baseAction = useCaseAction(caseId, actionPath, {
    ...baseOptions,
    onSuccess: async () => {
      if (hasUnsavedChanges && onSaveDraft) {
        try {
          await onSaveDraft();
        } catch (error) {
          logger.error("Failed to save draft", { error, caseId, actionPath });
          throw new Error("Failed to save draft before action");
        }
      }

      if (baseOptions.onSuccess) {
        baseOptions.onSuccess();
      }
    },
  });

  return baseAction;
}

// hooks for common case actions
export const useTranscribeAction = (
  caseId: string,
  options?: {
    actionName?: string;
    onError?: (error: string) => void;
    onSuccess?: () => void;
    refreshOnSuccess?: boolean;
    requestOptions?: RequestInit;
  }
) =>
  useCaseAction(caseId, "transcribe", {
    actionName: "Transcription",
    ...options,
  });

export const useExtractAction = (
  caseId: string,
  options?: {
    actionName?: string;
    onError?: (error: string) => void;
    onSuccess?: () => void;
    refreshOnSuccess?: boolean;
    requestOptions?: RequestInit;
  }
) =>
  useCaseAction(caseId, "extract", {
    actionName: "Data extraction",
    ...options,
  });

export const useScoreAction = (
  caseId: string,
  options?: {
    actionName?: string;
    onError?: (error: string) => void;
    onSuccess?: () => void;
    refreshOnSuccess?: boolean;
    requestOptions?: RequestInit;
  } & {
    onSaveDraft?: () => Promise<void>;
    hasUnsavedChanges?: boolean;
  }
) =>
  useCaseActionWithDraft(caseId, "score", {
    actionName: "Case scoring",
    ...options,
  });

export const useSubmitAction = (
  caseId: string,
  options?: {
    actionName?: string;
    onError?: (error: string) => void;
    onSuccess?: () => void;
    refreshOnSuccess?: boolean;
    requestOptions?: RequestInit;
  }
) =>
  useCaseAction(caseId, "submit", {
    actionName: "Decision submission",
    ...options,
  });

export const useCaseActions = {
  transcribe: useTranscribeAction,
  extract: useExtractAction,
  score: useScoreAction,
  submit: useSubmitAction,
};
