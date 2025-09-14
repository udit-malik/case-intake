"use client";

import React from "react";

export interface ErrorDisplayProps {
  error: string | null;
  title?: string;
  className?: string;
}

export function ErrorDisplay({ 
  error, 
  title = "Error", 
  className = "" 
}: ErrorDisplayProps) {
  if (!error) return null;

  return (
    <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
      <p className="text-sm text-red-600">
        <strong>{title}:</strong> {error}
      </p>
    </div>
  );
}
