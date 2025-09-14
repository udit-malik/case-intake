"use client";

import { useState, useRef, useCallback } from "react";
import { genUploader } from "uploadthing/client";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

// Constants
const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB in bytes
const ALLOWED_MIME_TYPE = "audio/mpeg";
const ALLOWED_EXTENSION = ".mp3";

// Types
interface UploadState {
  file: File | null;
  isUploading: boolean;
  error: string | null;
  progress: number;
  isDragOver: boolean;
}

export default function UploadAudioDnd() {
  // State
  const [state, setState] = useState<UploadState>({
    file: null,
    isUploading: false,
    error: null,
    progress: 0,
    isDragOver: false,
  });

  // Refs and hooks
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploader = genUploader<OurFileRouter>();

  // File validation
  const validateFile = useCallback((file: File): string | null => {
    const isValidMime = file.type === ALLOWED_MIME_TYPE;
    const hasMp3Extension = file.name.toLowerCase().endsWith(ALLOWED_EXTENSION);
    const isValidSize = file.size <= MAX_FILE_SIZE;

    if (!isValidMime && !hasMp3Extension) {
      return "File must be an MP3 audio file";
    }

    if (!isValidSize) {
      return "File size must be 30MB or less";
    }

    return null;
  }, []);

  // File handling
  const handleFileSelection = useCallback(
    (selectedFile: File) => {
      const validationError = validateFile(selectedFile);
      if (validationError) {
        logger.error("File validation failed", {
          error: validationError,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          fileType: selectedFile.type,
        });
        setState((prev) => ({ ...prev, error: validationError }));
        return;
      }

      setState((prev) => ({
        ...prev,
        file: selectedFile,
        error: null,
        progress: 0,
      }));
    },
    [validateFile]
  );

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState((prev) => ({ ...prev, isDragOver: true }));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState((prev) => ({ ...prev, isDragOver: false }));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setState((prev) => ({ ...prev, isDragOver: false }));

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelection(files[0]);
      }
    },
    [handleFileSelection]
  );

  // File input handler
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelection(files[0]);
      }
    },
    [handleFileSelection]
  );

  // Error mapping for user-friendly messages
  const mapUploadError = (error: any): string => {
    const message = error?.message || error?.toString() || "";

    // Map server error codes to user-friendly messages
    if (message === "ONLY_MP3_ALLOWED") {
      return "Only MP3 allowed";
    }
    if (message === "FILE_TOO_LARGE_30MB") {
      return "File is over 30MB";
    }
    if (message === "UNKNOWN") {
      return "Upload failed—try again";
    }

    // Fallback for other errors
    return "Upload failed—try again";
  };

  // Upload functionality
  const handleUpload = useCallback(async () => {
    if (!state.file) return;

    setState((prev) => ({
      ...prev,
      isUploading: true,
      error: null,
      progress: 0,
    }));

    try {
      const res = await uploader.uploadFiles("intakeAudio", {
        files: [state.file],
        onUploadProgress: (opts) => {
          setState((prev) => ({ ...prev, progress: opts.progress }));
        },
      });

      if (res && res[0]?.serverData?.caseId) {
        const caseId = res[0].serverData.caseId;
        router.push(`/cases/${caseId}`);
      } else {
        throw new Error("No case ID returned from server");
      }
    } catch (err) {
      logger.error("Upload error", { error: err, fileName: state.file?.name });
      setState((prev) => ({
        ...prev,
        error: mapUploadError(err),
        progress: 0,
      }));
    } finally {
      setState((prev) => ({ ...prev, isUploading: false }));
    }
  }, [state.file, uploader, router]);

  // UI handlers
  const handleBoxClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Render helpers
  const renderDropZone = () => (
    <div
      className={`
        relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 group
        ${
          state.isDragOver
            ? "border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 scale-105 shadow-lg"
            : "border-slate-300 hover:border-blue-300 hover:bg-slate-50 hover:shadow-md"
        }
        ${state.isUploading ? "pointer-events-none opacity-50" : ""}
      `}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleBoxClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,audio/mpeg"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={state.isUploading}
      />

      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 animate-pulse"></div>
      </div>

      <div className="relative space-y-6">
        {/* Animated upload icon */}
        <div className="mx-auto w-16 h-16 text-slate-400 group-hover:text-blue-500 transition-colors duration-300">
          <div className="relative">
            <svg
              className="w-full h-full transition-transform duration-300 group-hover:scale-110"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            {/* Floating particles effect */}
            <div className="absolute -top-2 -right-2 w-3 h-3 bg-blue-400 rounded-full animate-bounce opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div
              className="absolute -bottom-1 -left-1 w-2 h-2 bg-indigo-400 rounded-full animate-bounce opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-slate-900 group-hover:text-blue-600 transition-colors duration-300">
            {state.isDragOver
              ? "🎉 Drop your audio file here!"
              : "Upload your case audio"}
          </h3>
          <p className="text-slate-600 group-hover:text-slate-700 transition-colors duration-300">
            {state.isDragOver
              ? "Release to start processing"
              : "Drag & drop your MP3 file or click to browse"}
          </p>
        </div>

        {/* File requirements */}
        <div className="inline-flex items-center space-x-4 px-4 py-2 bg-slate-100 rounded-full text-sm text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors duration-300">
          <div className="flex items-center space-x-1">
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
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
            <span>MP3 Audio</span>
          </div>
          <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
          <div className="flex items-center space-x-1">
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Up to 30MB</span>
          </div>
        </div>

        {/* Animated dots when dragging */}
        {state.isDragOver && (
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );

  const renderFilePreview = () => {
    if (!state.file) return null;

    return (
      <div className="relative overflow-hidden bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 animate-pulse"></div>
        </div>

        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* File icon with animation */}
              <div className="relative">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    />
                  </svg>
                </div>
                {/* Success checkmark overlay */}
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>

              <div>
                <p className="text-lg font-semibold text-slate-900 truncate max-w-xs">
                  {state.file.name}
                </p>
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                    MP3 Audio
                  </span>
                  <span>{(state.file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleUpload}
              disabled={state.isUploading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.isUploading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Uploading...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
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
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <span>Upload File</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderProgress = () => {
    if (!state.isUploading) return null;

    return (
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 animate-pulse"></div>
        </div>

        <div className="relative space-y-4">
          {/* Header with animated icon */}
          <div className="flex items-center justify-center space-x-3">
            <div className="relative">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
              {/* Pulsing ring */}
              <div className="absolute inset-0 w-8 h-8 border-2 border-blue-300 rounded-full animate-ping"></div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Uploading your case
              </h3>
              <p className="text-sm text-slate-600">
                Please wait while we process your audio file
              </p>
            </div>
          </div>

          {/* Enhanced progress bar */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-slate-700">
                Processing audio file
              </span>
              <span className="font-bold text-blue-600">
                {Math.round(state.progress)}%
              </span>
            </div>

            {/* Progress bar container */}
            <div className="relative w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse"></div>

              {/* Progress fill with gradient */}
              <div
                className="relative h-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 rounded-full transition-all duration-500 ease-out shadow-lg"
                style={{ width: `${state.progress}%` }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
              </div>

              {/* Progress indicator dot */}
              <div
                className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-600 rounded-full shadow-lg transition-all duration-500 ease-out"
                style={{ left: `calc(${state.progress}% - 8px)` }}
              ></div>
            </div>

            {/* Status messages based on progress */}
            <div className="text-center">
              <p className="text-sm text-slate-600">
                {state.progress < 25 && "Preparing file for upload..."}
                {state.progress >= 25 &&
                  state.progress < 50 &&
                  "Uploading audio data..."}
                {state.progress >= 50 &&
                  state.progress < 75 &&
                  "Processing audio content..."}
                {state.progress >= 75 &&
                  state.progress < 100 &&
                  "Finalizing case creation..."}
                {state.progress === 100 && "Complete! Redirecting..."}
              </p>
            </div>
          </div>

          {/* Animated dots */}
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  const renderError = () => {
    if (!state.error) return null;

    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
        <p className="text-sm text-red-600">
          <strong>Error:</strong> {state.error}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderDropZone()}
      {renderFilePreview()}
      {renderProgress()}
      {renderError()}
    </div>
  );
}
