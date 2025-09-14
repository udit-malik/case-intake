import { revalidatePath, revalidateTag } from "next/cache";

export const REVALIDATION_INTERVALS = {
  // cache static content longer
  STATIC: 3600, // 1 hour

  DASHBOARD: 300, // 5 minutes

  CASES_LIST: 120, // 2 minutes

  CASE_DETAILS: 60, // 1 minute

  API_ROUTES: 30, // 30 seconds

  REALTIME: 0,
} as const;

export const PAGE_REVALIDATION = {
  "/": REVALIDATION_INTERVALS.STATIC,
  "/dashboard": REVALIDATION_INTERVALS.DASHBOARD,
  "/cases": REVALIDATION_INTERVALS.CASES_LIST,
  "/cases/[id]": REVALIDATION_INTERVALS.CASE_DETAILS,
  "/login": REVALIDATION_INTERVALS.STATIC,
  "/signup": REVALIDATION_INTERVALS.STATIC,
} as const;

export const REVALIDATION_TAGS = {
  CASES: "cases",
  DASHBOARD: "dashboard",
  USER_PREFERENCES: "user-preferences",
  CASE_DETAILS: "case-details",
} as const;

// get revalidation time for a page
export function getRevalidationTime(path: string): number {
  if (path in PAGE_REVALIDATION) {
    return PAGE_REVALIDATION[path as keyof typeof PAGE_REVALIDATION];
  }

  // check dynamic routes
  if (path.startsWith("/cases/") && path !== "/cases") {
    return REVALIDATION_INTERVALS.CASE_DETAILS;
  }

  // default to static caching
  return REVALIDATION_INTERVALS.STATIC;
}

// determine if data should be revalidated
export function shouldRevalidate(
  lastFetch: Date,
  revalidationInterval: number
): boolean {
  if (revalidationInterval === 0) return true;

  const now = new Date();
  const timeSinceLastFetch = now.getTime() - lastFetch.getTime();
  return timeSinceLastFetch > revalidationInterval * 1000;
}

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

// revalidate all user-related data
export async function revalidateUserData() {
  revalidatePath("/dashboard");
  revalidatePath("/cases");
  revalidateTag(REVALIDATION_TAGS.CASES);
  revalidateTag(REVALIDATION_TAGS.DASHBOARD);
  revalidateTag(REVALIDATION_TAGS.USER_PREFERENCES);
}
