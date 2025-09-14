"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CaseActionButtonProps } from "@/types";

const ACTION_CONFIG = {
  transcribe: {
    label: "Start Transcription",
    loadingLabel: "Transcribing...",
    description:
      "This will process the audio file and generate a transcript using AI speech recognition.",
    subDescription:
      "The process typically takes 5-20 seconds depending on audio length.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
      />
    ),
    colors: {
      default:
        "bg-slate-600 hover:bg-slate-700 text-white border-slate-600 hover:border-slate-700",
      primary: "bg-blue-600 hover:bg-blue-700 text-white",
      secondary: "bg-slate-600 hover:bg-slate-700 text-white",
    },
  },
  extract: {
    label: "Extract Fields",
    loadingLabel: "Extracting...",
    description: "Extract structured data from the transcript using AI.",
    subDescription:
      "This will identify key information like client details, incident description, etc.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    ),
    colors: {
      default: "bg-slate-600 hover:bg-slate-700 text-white",
      primary: "bg-blue-600 hover:bg-blue-700 text-white",
      secondary: "bg-slate-600 hover:bg-slate-700 text-white",
    },
  },
  score: {
    label: "Score Case",
    loadingLabel: "Scoring...",
    description:
      "Analyze the case and generate a score with decision recommendation.",
    subDescription: "This will evaluate the case based on various criteria.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
    colors: {
      default:
        "bg-slate-600 hover:bg-slate-700 text-white border-slate-600 hover:border-slate-700",
      primary: "bg-blue-600 hover:bg-blue-700 text-white",
      secondary: "bg-slate-600 hover:bg-slate-700 text-white",
    },
  },
  submit: {
    label: "Submit Decision",
    loadingLabel: "Submitting...",
    description: "Submit the final decision for this case.",
    subDescription: "This will finalize the case and send notifications.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
      />
    ),
    colors: {
      default: "bg-green-600 hover:bg-green-700 text-white",
      primary: "bg-blue-600 hover:bg-blue-700 text-white",
      secondary: "bg-slate-600 hover:bg-slate-700 text-white",
    },
  },
} as const;


// reusable case action button component
export function CaseActionButton({
  caseId: _caseId,
  action,
  isLoading,
  error,
  onExecute,
  className = "",
  variant = "default",
  showDescription = true,
}: CaseActionButtonProps) {
  const config = ACTION_CONFIG[action];
  const colorClasses = config.colors[variant];

  return (
    <div className="space-y-4">
      {/* main action btn */}
      <div className="flex justify-center">
        <Button
          onClick={onExecute}
          disabled={isLoading}
          className={`group relative overflow-hidden ${colorClasses} shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <LoadingSpinner size="sm" />
              <span className="font-medium">{config.loadingLabel}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 transition-transform group-hover:scale-105"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {config.icon}
              </svg>
              <span className="font-medium">{config.label}</span>
            </div>
          )}

          {/* subtle hover effect overlay */}
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
        </Button>
      </div>

      {/* err display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">
            <strong>{config.label} Failed:</strong> {error}
          </p>
        </div>
      )}

      {/* desc */}
      {showDescription && (
        <div className="text-center">
          <p className="text-sm text-slate-600">{config.description}</p>
          {config.subDescription && (
            <p className="text-xs text-slate-500 mt-1">
              {config.subDescription}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
