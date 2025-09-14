import { CaseType } from "./types";

export const SCORING_VERSION = "v3.2.0";

// deterministic LLM configs
export const DETERMINISTIC = {
  temperature: 0,
  top_p: 1,
  seed: 42,
} as const;

// feature extraction toggle
export const ENABLE_LLM_FEATURES = process.env.SCORING_USE_LLM !== "false";

// base scoring weights
export const BASE = {
  // liability factors
  REAR_ENDED: 30,
  SLIPFALL_NO_SIGN: 25,
  SLIPFALL_STORE: 15,
  ADMISSION_OF_FAULT: -30,
  POLICE_REPORT: 6,
  DEFENDANT_LOCATION: 4,

  // treatment factors
  ER_SAME_DAY: 15,
  PHYSICIAN_POINTS: 6,
  PHYSICIAN_CAP: 12,
  CHIRO_POINTS: 3,
  CHIRO_CAP: 3,
  PAIN_CAP: 10,
  WORK_CAP: 10,

  
  PROMPT_TREATMENT: 5,
  TREATMENT_72H: 2,
  DELAYED_TREATMENT: -5,

  // modifiers
  IMAGING: 3,
  NEUROLOGIC: 2,
  INSURANCE_NOTED: 3,
  INSURER_CONTACT: 2,
  WITNESS_PRESENT: 2,
  MINOR_DAMAGE: -4,
  PRE_EXISTING: -6,
  PRE_EXISTING_DIFFERENT: -3,

  // recency
  RECENT_30D: 5,
  RECENT_180D: 3,
  OLD_INCIDENT: -10,
  RECENT_RELATIVE: 5,

  // other case types
  PEDESTRIAN_OR_BICYCLIST: 6,
  CROSSWALK_BONUS: 4,
  NO_HELMET_PENALTY: -2,
  RIDESHARE: 5,
  COMMERCIAL_VEHICLE: 6,
  HIT_AND_RUN: -6,
  DUI_OTHER_DRIVER: 4,
  UM_UIM_APPLICABLE: 4,
  AIRBAG_DEPLOYED: 3,
  SEVERE_DAMAGE_BONUS: 3,

  // Keep scores between 1 and 100
  MIN_SCORE: 1,
  MAX_SCORE: 100,
};

// Scoring profiles by case type
export const PROFILES: Record<CaseType, Partial<typeof BASE>> = {
  // MVA cases: keep rear-ended & police report high; property damage penalty active
  [CaseType.MVA_REAR_END]: {
    REAR_ENDED: 35, // Boost rear-ended for this specific case type
    POLICE_REPORT: 8, // Higher police report weight
    MINOR_DAMAGE: -4, // Keep property damage penalty
  },
  [CaseType.MVA_LEFT_TURN]: {
    POLICE_REPORT: 8, // Higher police report weight
    MINOR_DAMAGE: -4, // Keep property damage penalty
  },
  [CaseType.MVA_T_BONE]: {
    POLICE_REPORT: 8, // Higher police report weight
    MINOR_DAMAGE: -4, // Keep property damage penalty
  },
  [CaseType.MVA_SIDESWIPE]: {
    POLICE_REPORT: 8, // Higher police report weight
    MINOR_DAMAGE: -4, // Keep property damage penalty
  },

  // Premises cases: boost slip-fall factors; set property damage penalty to 0
  [CaseType.PREMISES_WET_FLOOR]: {
    SLIPFALL_NO_SIGN: 30, // Boost no warning signs
    DEFENDANT_LOCATION: 6, // Boost defendant/location identification
    MINOR_DAMAGE: 0, // No property damage penalty
  },
  [CaseType.PREMISES_ICE_SNOW]: {
    SLIPFALL_NO_SIGN: 30, // Boost no warning signs
    DEFENDANT_LOCATION: 6, // Boost defendant/location identification
    MINOR_DAMAGE: 0, // No property damage penalty
  },
  [CaseType.PREMISES_TRIP_HAZARD]: {
    SLIPFALL_NO_SIGN: 30, // Boost no warning signs
    DEFENDANT_LOCATION: 6, // Boost defendant/location identification
    MINOR_DAMAGE: 0, // No property damage penalty
  },

  // Dog bite: set property damage penalty to 0; modest + for witness_present
  [CaseType.DOG_BITE]: {
    MINOR_DAMAGE: 0, // No property damage penalty
    WITNESS_PRESENT: 4, // Modest boost for witness presence
  },

  // Pedestrian or bicycle: boost police report, remove minor damage penalty, add base pedestrian bonus
  [CaseType.PEDESTRIAN_OR_BICYCLE]: {
    POLICE_REPORT: 8, // Higher police report weight
    MINOR_DAMAGE: 0, // No property damage penalty
    PEDESTRIAN_OR_BICYCLIST: 6, // Base pedestrian/bicycle bonus
  },

  // Rideshare MVA: boost police report, keep minor damage penalty, add rideshare bonus
  [CaseType.RIDESHARE_MVA]: {
    POLICE_REPORT: 8, // Higher police report weight
    MINOR_DAMAGE: -4, // Keep property damage penalty
    RIDESHARE: 5, // Rideshare bonus
  },

  // Other: no overrides
  [CaseType.OTHER]: {},
};
