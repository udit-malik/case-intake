if (typeof window !== "undefined") {
  throw new Error("scoring.ts is server-only");
}

export { CaseType } from "./types";
export type { CaseFeatures, ScoreBreakdownItem } from "./types";

export { SCORING_VERSION, DETERMINISTIC, ENABLE_LLM_FEATURES, BASE, PROFILES } from "./constants";

export { buildFeatures } from "./feature-extraction";
export { scoreCase } from "./scoring-engine";
export { 
  getAnchorDate, 
  daysSince, 
  matchesPattern, 
  normalizeIncidentDate 
} from "./utils";
