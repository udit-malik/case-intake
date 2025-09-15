import { CaseType } from "./types";

export const SCORING_VERSION = "v3.2.0";
export const EXTRACTION_RULES_VERSION = "admission-rules-v1";

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
  PT_POINTS: 4,
  PT_CAP: 8,
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

  MIN_SCORE: 1,
  MAX_SCORE: 100,

  // decision thresholds
  ACCEPT_THRESHOLD: 70,
  DECLINE_THRESHOLD: 40,
  REVIEW_NUDGE_MIN: 30,
  REVIEW_NUDGE_MAX: 39,

  // time thresholds 
  ER_WITHIN_HOURS: 24,
  TREATMENT_72H_HOURS: 72,

  RECENT_30D_DAYS: 30,
  RECENT_180D_DAYS: 180,
  OLD_INCIDENT_DAYS: 365,
  RECENT_RELATIVE_DAYS: 14,
};


export const PROFILES: Record<CaseType, Partial<typeof BASE>> = {
  // MVA (motor vehicle accident) cases
  // keep rear-ended & police report high; property damage penalty active
  [CaseType.MVA_REAR_END]: {
    REAR_ENDED: 35, 
    POLICE_REPORT: 8,
    MINOR_DAMAGE: -4, 
  },
  [CaseType.MVA_LEFT_TURN]: {
    POLICE_REPORT: 8,
    MINOR_DAMAGE: -4, 
  },
  [CaseType.MVA_T_BONE]: {
    POLICE_REPORT: 8, 
    MINOR_DAMAGE: -4,
  },
  [CaseType.MVA_SIDESWIPE]: {
    POLICE_REPORT: 8, 
    MINOR_DAMAGE: -4, 
  },

  // no property damage in slip/fall cases
  [CaseType.PREMISES_WET_FLOOR]: {
    SLIPFALL_NO_SIGN: 30,
    DEFENDANT_LOCATION: 6, 
    MINOR_DAMAGE: 0, 
  },
  [CaseType.PREMISES_ICE_SNOW]: {
    SLIPFALL_NO_SIGN: 30,
    DEFENDANT_LOCATION: 6, 
    MINOR_DAMAGE: 0, 
  },
  [CaseType.PREMISES_TRIP_HAZARD]: {
    SLIPFALL_NO_SIGN: 30, 
    DEFENDANT_LOCATION: 6, 
    MINOR_DAMAGE: 0, 
  },


  [CaseType.DOG_BITE]: {
    MINOR_DAMAGE: 0,
    WITNESS_PRESENT: 4, 
  },

  [CaseType.PEDESTRIAN_OR_BICYCLE]: {
    POLICE_REPORT: 8, 
    MINOR_DAMAGE: 0, 
    PEDESTRIAN_OR_BICYCLIST: 6, 
  },

  
  [CaseType.RIDESHARE_MVA]: {
    POLICE_REPORT: 8, 
    MINOR_DAMAGE: -4, 
    RIDESHARE: 5,
  },

  [CaseType.OTHER]: {},
};
