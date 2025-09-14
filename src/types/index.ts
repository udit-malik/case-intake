/**
 * Shared TypeScript types and interfaces
 * Centralized type definitions for better maintainability
 */

import { FieldValues, FieldErrors } from "react-hook-form";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Re-export all types from schemas
export * from "@/schemas/intake";

// ============================================================================
// CORE DOMAIN TYPES
// ============================================================================

// User types
export interface User {
  id: string;
  email: string;
  autoTranscribe: boolean;
  autoExtract: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Case types
export interface Case {
  id: string;
  userId: string;
  status: CaseStatus;
  fileKey: string;
  fileUrl: string;
  originalFilename: string;
  mimeType: string;
  clarificationNeeded: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Detailed case record for service operations
export interface CaseRecord {
  id: string;
  userId: string;
  status: string;
  fileKey: string;
  fileUrl: string;
  originalFilename: string;
  mimeType: string;
  transcriptText?: string | null;
  transcriptJson?: any;
  transcribedAt?: Date | null;
  deepgramModel?: string | null;
  deepgramRequestId?: string | null;
  extractedAt?: Date | null;
  extractionModel?: string | null;
  extractionRequestId?: string | null;
  extractionJson?: any;
  intakeDraft?: any;
  clarificationNeeded?: string[];
  score?: number | null;
  decision?: string | null;
  decisionReasons?: string[];
  scoredAt?: Date | null;
  scoringVersion?: string | null;
  scoringTrace?: any;
  submittedAt?: Date | null;
  decisionEmailId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  deletedReason?: string | null;
}

// Enums
export enum CaseStatus {
  UPLOADED = "UPLOADED",
  TRANSCRIBED = "TRANSCRIBED",
  EXTRACTED = "EXTRACTED",
  SCORED = "SCORED",
  DECIDED = "DECIDED",
}

export enum Decision {
  ACCEPT = "ACCEPT",
  REVIEW = "REVIEW",
  DECLINE = "DECLINE",
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

// Common API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Specific API response types for better type safety
export interface AuthResponse {
  user: {
    id: string;
    email: string;
  };
}

export interface LoginResponse {
  userId: string;
  email: string;
}

export interface SignupResponse {
  userId: string;
  email: string;
}

export interface CaseResponse {
  id: string;
  userId: string;
  status: CaseStatus;
  fileKey: string;
  fileUrl: string;
  originalFilename: string;
  mimeType: string;
  audioSha256?: string;
  durationSec?: number;
  transcriptText?: string;
  transcribedAt?: Date;
  extractedAt?: Date;
  scoredAt?: Date;
  submittedAt?: Date;
  score?: number;
  decision?: Decision;
  decisionReasons?: string[];
  clarificationNeeded: string[];
  intakeDraft?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CaseListResponse {
  cases: CaseResponse[];
  total: number;
}

export interface IntakeSaveResponse {
  clarificationCount: number;
}

export interface CaseActionResponse {
  score?: number;
  decision?: Decision;
  reasons?: string[];
}

export interface UserPreferencesResponse {
  autoTranscribe: boolean;
  autoExtract: boolean;
}

// Type guards for runtime validation
export function isApiResponse<T>(obj: any): obj is ApiResponse<T> {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.success === "boolean" &&
    (obj.data === undefined || typeof obj.data === "object") &&
    (obj.error === undefined || typeof obj.error === "string") &&
    (obj.message === undefined || typeof obj.message === "string")
  );
}

export function isAuthResponse(obj: any): obj is ApiResponse<AuthResponse> {
  if (!isApiResponse(obj)) return false;

  const data = obj.data;
  return !!(
    data &&
    typeof data === "object" &&
    "user" in data &&
    data.user &&
    typeof data.user === "object" &&
    "id" in data.user &&
    "email" in data.user &&
    typeof data.user.id === "string" &&
    typeof data.user.email === "string"
  );
}

export function isCaseResponse(obj: any): obj is CaseResponse {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.id === "string" &&
    typeof obj.userId === "string" &&
    typeof obj.status === "string" &&
    typeof obj.fileKey === "string" &&
    typeof obj.fileUrl === "string" &&
    typeof obj.originalFilename === "string" &&
    typeof obj.mimeType === "string" &&
    Array.isArray(obj.clarificationNeeded)
  );
}

// ============================================================================
// SERVICE & CONFIGURATION TYPES
// ============================================================================

// Service operation types
export interface CreateCaseOptions {
  userId: string;
  file: {
    key: string;
    url: string;
    name: string;
    size: number;
    type: string;
  };
}

export interface PaginationOptions {
  skip?: number;
  take?: number;
  orderBy?: any;
}

// Adapter configuration types
export interface TranscribeOptions {
  model?: string;
  language?: string;
  punctuate?: boolean;
  diarize?: boolean;
}

export interface ExtractOptions {
  temperature?: number;
  seed?: number;
}

export interface TranscribeOptions {
  model?: string;
  language?: string;
  diarize?: boolean;
  smartFormat?: boolean;
  punctuate?: boolean;
}

export interface TranscribeResult {
  text: string;
  durationSec: number;
  modelId: string;
  requestId: string | null;
  full?: any;
}

export interface SendDecisionEmailOptions {
  to: string;
  decision: "ACCEPT" | "REVIEW" | "DECLINE";
  clientName: string;
  caseId: string;
  score: number;
  reasons: string[];
}

// ============================================================================
// FORM & UI TYPES
// ============================================================================

// Form types
export interface FormState {
  isDirty: boolean;
  isSubmitting: boolean;
}

export interface AuthFormConfig<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  defaultValues: T;
  endpoint: string;
  successMessage: string;
  redirectPath: string;
}

export interface AuthFormReturn<T extends FieldValues> {
  form: ReturnType<typeof useForm<T>>;
  isSubmitting: boolean;
  formError: string | null;
  clearError: () => void;
  handleSubmit: (data: T) => Promise<void>;
}

// UI component props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface AuthFormProps<T extends FieldValues> {
  title: string;
  description: string;
  cardTitle: string;
  cardDescription: string;
  submitButtonText: string;
  submitButtonLoadingText: string;
  linkText: string;
  linkHref: string;
  linkLabel: string;
  formError: string | null;
  isSubmitting: boolean;
  errors: FieldErrors<FieldValues>;
  register: any;
  handleSubmit: any;
  clearError: () => void;
  onSubmit: (data: T) => void;
}

export interface CaseActionButtonProps {
  caseId: string;
  action: "transcribe" | "extract" | "score" | "submit";
  isLoading: boolean;
  error: string | null;
  onExecute: () => void;
  className?: string;
  variant?: "default" | "primary" | "secondary";
  showDescription?: boolean;
}

// Reusable button component types
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

export interface ConfirmationButtonProps extends Omit<ActionButtonProps, 'onClick'> {
  onConfirm: () => void;
  confirmationMessage: string;
  confirmationTitle?: string;
  showConfirmation?: boolean;
}

export interface StatusButtonProps extends ActionButtonProps {
  status?: "idle" | "success" | "error" | "warning";
  statusMessage?: string;
  statusIcon?: React.ReactNode;
  showStatus?: boolean;
}

export interface ErrorDisplayProps {
  error: string | null;
  title?: string;
  className?: string;
}

// ============================================================================
// API ROUTE TYPES
// ============================================================================

export interface RouteHandler {
  GET?: (request: Request, context: any) => Promise<Response>;
  POST?: (request: Request, context: any) => Promise<Response>;
  PUT?: (request: Request, context: any) => Promise<Response>;
  PATCH?: (request: Request, context: any) => Promise<Response>;
  DELETE?: (request: Request, context: any) => Promise<Response>;
}
