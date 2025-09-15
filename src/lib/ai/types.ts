export enum CaseType {
  MVA_REAR_END = "MVA_REAR_END",
  MVA_LEFT_TURN = "MVA_LEFT_TURN",
  MVA_T_BONE = "MVA_T_BONE",
  MVA_SIDESWIPE = "MVA_SIDESWIPE",
  PREMISES_WET_FLOOR = "PREMISES_WET_FLOOR",
  PREMISES_ICE_SNOW = "PREMISES_ICE_SNOW",
  PREMISES_TRIP_HAZARD = "PREMISES_TRIP_HAZARD",
  DOG_BITE = "DOG_BITE",
  PEDESTRIAN_OR_BICYCLE = "PEDESTRIAN_OR_BICYCLE",
  RIDESHARE_MVA = "RIDESHARE_MVA",
  OTHER = "OTHER",
}

export interface CaseFeatures {
  case_type: CaseType;
  providers?: {
    pt: number;
    physician: number;
    chiro: number;
    er: boolean;
  };
  booleans: {
    rear_ended: boolean;
    no_warning_signs: boolean;
    admission_of_fault: boolean;
    police_report_present: boolean;
    defendant_identified: boolean;
    witness_present: boolean;
    imaging_ordered: boolean;
    imaging_completed: boolean;
    neurologic_symptoms: boolean;
    other_insurer_contacted: boolean;
    is_pedestrian_or_bicyclist: boolean;
    in_crosswalk: boolean;
    helmet_worn: boolean;
    is_rideshare: boolean;
    is_commercial_vehicle: boolean;
    hit_and_run: boolean;
    dui_other_driver: boolean;
    um_uim_applicable: boolean;
    airbag_deployed: boolean;
  };
  numbers: {
    peak_pain_0_10: number;
    first_treatment_latency_hours: number | null;
    missed_work_days: number | null;
  };
  strings: {
    injury_sites: string[];
    incident_date_iso: string | null;
    relative_time_mentions: string[];
    client_auto_carrier: string | null;
    client_health_carrier: string | null;
    property_damage: "none" | "minor" | "moderate" | "severe";
  };
  uncertain: string[];
  evidence: Record<string, { quote: string } | undefined>;
  admission_meta?: {
    attribution: "self" | "other" | "ambiguous";
    rationale: "direct_admission" | "negligent_act" | "third_party_claim" | "ambiguous";
    evidence: string;
  };
}

export interface ScoreBreakdownItem {
  factor: string;
  delta: number;
  reason: string;
}
