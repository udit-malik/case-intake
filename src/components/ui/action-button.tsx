"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export interface ActionButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: "default" | "destructive" | "success" | "warning" | "info";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  loadingIcon?: React.ReactNode;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
  showHoverEffect?: boolean;
}

const variantStyles = {
  default: "bg-slate-600 hover:bg-slate-700 text-white border-slate-600 hover:border-slate-700",
  destructive: "bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700",
  success: "bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700",
  warning: "bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600 hover:border-yellow-700",
  info: "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

export function ActionButton({
  onClick,
  isLoading = false,
  disabled = false,
  variant = "default",
  size = "md",
  icon,
  loadingIcon,
  children,
  loadingText,
  className = "",
  showHoverEffect = true,
}: ActionButtonProps) {
  const isDisabled = disabled || isLoading;
  const variantClass = variantStyles[variant];
  const sizeClass = sizeStyles[size];

  return (
    <Button
      onClick={onClick}
      disabled={isDisabled}
      className={`group relative overflow-hidden ${variantClass} ${sizeClass} shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          {loadingIcon || <LoadingSpinner size="sm" />}
          <span className="font-medium">{loadingText || "Loading..."}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {icon && (
            <div className="w-4 h-4 transition-transform group-hover:scale-105">
              {icon}
            </div>
          )}
          <span className="font-medium">{children}</span>
        </div>
      )}

      {/* Subtle hover effect overlay */}
      {showHoverEffect && (
        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
      )}
    </Button>
  );
}
