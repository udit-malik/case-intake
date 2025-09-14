/**
 * Revalidation Utilities and Strategy
 * Functions to trigger revalidation when data changes and configuration
 */

import { revalidatePath, revalidateTag } from "next/cache";

// Revalidation intervals in seconds
export const REVALIDATION_INTERVALS = {
  // Static content - cache for longer
  STATIC: 3600, // 1 hour

  // Dashboard - moderate caching for user-specific data
  DASHBOARD: 300, // 5 minutes

  // Cases list - moderate caching for list data
  CASES_LIST: 120, // 2 minutes

  // Case details - shorter caching for individual case data
  CASE_DETAILS: 60, // 1 minute

  // API routes - very short caching for dynamic data
  API_ROUTES: 30, // 30 seconds

  // Real-time data - no caching
  REALTIME: 0,
} as const;

// Page-specific revalidation strategies
export const PAGE_REVALIDATION = {
  "/": REVALIDATION_INTERVALS.STATIC,
  "/dashboard": REVALIDATION_INTERVALS.DASHBOARD,
  "/cases": REVALIDATION_INTERVALS.CASES_LIST,
  "/cases/[id]": REVALIDATION_INTERVALS.CASE_DETAILS,
  "/login": REVALIDATION_INTERVALS.STATIC,
  "/signup": REVALIDATION_INTERVALS.STATIC,
} as const;

// Revalidation tags for different data types
export const REVALIDATION_TAGS = {
  CASES: "cases",
  DASHBOARD: "dashboard",
  USER_PREFERENCES: "user-preferences",
  CASE_DETAILS: "case-details",
} as const;

// Helper function to get revalidation time for a page
export function getRevalidationTime(path: string): number {
  // Check for exact matches first
  if (path in PAGE_REVALIDATION) {
    return PAGE_REVALIDATION[path as keyof typeof PAGE_REVALIDATION];
  }

  // Check for dynamic routes
  if (path.startsWith("/cases/") && path !== "/cases") {
    return REVALIDATION_INTERVALS.CASE_DETAILS;
  }

  // Default to static caching
  return REVALIDATION_INTERVALS.STATIC;
}

// Helper function to determine if data should be revalidated
export function shouldRevalidate(
  lastFetch: Date,
  revalidationInterval: number
): boolean {
  if (revalidationInterval === 0) return true;

  const now = new Date();
  const timeSinceLastFetch = now.getTime() - lastFetch.getTime();
  return timeSinceLastFetch > revalidationInterval * 1000;
}

// Revalidate specific paths
export async function revalidateCases() {
  revalidatePath("/cases");
  revalidateTag(REVALIDATION_TAGS.CASES);
}

export async function revalidateDashboard() {
  revalidatePath("/dashboard");
  revalidateTag(REVALIDATION_TAGS.DASHBOARD);
}

export async function revalidateCaseDetails(caseId: string) {
  revalidatePath(`/cases/${caseId}`);
  revalidateTag(REVALIDATION_TAGS.CASE_DETAILS);
}

export async function revalidateUserPreferences() {
  revalidatePath("/dashboard");
  revalidateTag(REVALIDATION_TAGS.USER_PREFERENCES);
}

// Revalidate all user-related data
export async function revalidateUserData() {
  revalidatePath("/dashboard");
  revalidatePath("/cases");
  revalidateTag(REVALIDATION_TAGS.CASES);
  revalidateTag(REVALIDATION_TAGS.DASHBOARD);
  revalidateTag(REVALIDATION_TAGS.USER_PREFERENCES);
}
