"use client";

import React from "react";
import { ActionButton, ActionButtonProps } from "./action-button";

export interface StatusButtonProps extends ActionButtonProps {
  status?: "idle" | "success" | "error" | "warning";
  statusMessage?: string;
  statusIcon?: React.ReactNode;
  showStatus?: boolean;
}

const statusConfig = {
  success: {
    variant: "success" as const,
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  error: {
    variant: "destructive" as const,
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    ),
  },
  warning: {
    variant: "warning" as const,
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </svg>
    ),
  },
  idle: {
    variant: "default" as const,
    icon: null,
  },
};

export function StatusButton({
  status = "idle",
  statusMessage,
  statusIcon,
  showStatus = true,
  children,
  ...buttonProps
}: StatusButtonProps) {
  const config = statusConfig[status];
  const displayIcon = statusIcon || config.icon;
  const displayMessage = statusMessage || children;

  if (showStatus && status !== "idle") {
    return (
      <div className="flex flex-col items-center gap-4">
        {/* status display */}
        <div className={`p-4 rounded-lg border text-center ${
          status === "success" 
            ? "bg-green-50 border-green-200 text-green-700" 
            : status === "error"
            ? "bg-red-50 border-red-200 text-red-700"
            : "bg-yellow-50 border-yellow-200 text-yellow-700"
        }`}>
          <div className="flex items-center justify-center gap-2 text-lg font-medium mb-1">
            {displayIcon}
            {status === "success" && "Success"}
            {status === "error" && "Error"}
            {status === "warning" && "Warning"}
          </div>
          {statusMessage && (
            <div className="text-sm">
              {statusMessage}
            </div>
          )}
        </div>

        {/* action btn */}
        <ActionButton
          {...buttonProps}
          variant={config.variant}
          icon={displayIcon}
        >
          {displayMessage}
        </ActionButton>
      </div>
    );
  }

  return (
    <ActionButton
      {...buttonProps}
      variant={config.variant}
      icon={displayIcon}
    >
      {displayMessage}
    </ActionButton>
  );
}
