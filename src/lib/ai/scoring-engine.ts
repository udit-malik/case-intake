import { Intake } from "@/schemas/intake";
import { CaseType, CaseFeatures, ScoreBreakdownItem } from "./types";
import { BASE, PROFILES } from "./constants";
import { buildFeatures } from "./feature-extraction";
import { 
  matchesPattern, 
  daysSince, 
  normalizeIncidentDate 
} from "./utils";

// scoring weights for a specific case type
function weightsFor(caseType: CaseType): typeof BASE {
  return { ...BASE, ...(PROFILES[caseType] || {}) };
}

export async function scoreCase(input: {
  intake: Intake;
  transcript?: string | null;
  incidentDate?: string | null;
  now?: Date;
}): Promise<{
  score: number;
  decision: "ACCEPT" | "REVIEW" | "DECLINE";
  reasons: string[];
  clarifications: string[];
  breakdown: ScoreBreakdownItem[];
  trace: {
    // liability factors
    rearEnded: boolean;
    noWarningSigns: boolean;
    slipAndFall: boolean;
    admissionOfFault: boolean;
    policeReport: boolean;
    defendantLocation: boolean;

    // treatment factors
    erSameDay: boolean;
    providers: { physicians: number; chiropractors: number };
    maxPain: number | null;
    daysMissedWork: number | null;
    treatmentLatency: number | null; // hours

    // modifiers
    insuranceNoted: boolean;
    insurerContact: boolean;
    preExistingCondition: boolean;
    minorPropertyDamage: boolean;

    // recency
    daysSinceIncident: number | null;
    recentIncident: boolean; // < 30 days
    oldIncident: boolean; // >1 yr
  };
}> {
  const { intake, transcript, incidentDate, now } = input;
  const features = await buildFeatures({ transcript, incidentDate, now });
  const W = weightsFor(features.case_type);
  const t = (transcript ?? "").replace(/\s+/g, " ");

  let score = 0;
  const reasons: string[] = [];
  const clarifications: string[] = [];
  const breakdown: ScoreBreakdownItem[] = [];

  const trace = {
    rearEnded: features.booleans.rear_ended,
    noWarningSigns: features.booleans.no_warning_signs,
    slipAndFall: false,
    admissionOfFault: features.booleans.admission_of_fault,
    policeReport: features.booleans.police_report_present,
    defendantLocation: features.booleans.defendant_identified,

    erSameDay: false,
    providers: { physicians: 0, chiropractors: 0 },
    maxPain: features.numbers.peak_pain_0_10 || null,
    daysMissedWork: features.numbers.missed_work_days,
    treatmentLatency: features.numbers.first_treatment_latency_hours,

    insuranceNoted: false, 
    insurerContact: features.booleans.other_insurer_contacted,
    preExistingCondition: false, 
    minorPropertyDamage: false, 

    daysSinceIncident: null as number | null,
    recentIncident: false,
    oldIncident: false,
  };

 
  if (features.booleans.rear_ended) {
    score += W.REAR_ENDED;
    reasons.push(`+ Clear liability: rear-ended`);
    breakdown.push({ factor: "rear_ended", delta: W.REAR_ENDED, reason: "Clear liability: rear-ended" });
  }

  if (features.booleans.no_warning_signs) {
    score += W.SLIPFALL_NO_SIGN;
    reasons.push(`+ Hazard with no warning signs`);
    breakdown.push({ factor: "no_warning_signs", delta: W.SLIPFALL_NO_SIGN, reason: "Hazard with no warning signs" });
    trace.slipAndFall = true;
  }

  if ((features.case_type === CaseType.PREMISES_WET_FLOOR || 
      features.case_type === CaseType.PREMISES_ICE_SNOW || 
       features.case_type === CaseType.PREMISES_TRIP_HAZARD) &&
      matchesPattern(t, /\b(store|market|grocery|shop|mall|plaza|supermarket)\b/i)) {
    score += W.SLIPFALL_STORE;
    reasons.push(`+ Slip-and-fall in store`);
    breakdown.push({ factor: "slip_and_fall", delta: W.SLIPFALL_STORE, reason: "Slip-and-fall in store" });
    trace.slipAndFall = true;
  }

  if (features.booleans.admission_of_fault) {
    score += W.ADMISSION_OF_FAULT;
    const evidenceSnippet = features.evidence.admission_of_fault?.quote;
    const reasonText = evidenceSnippet ? `- Admission of fault (${evidenceSnippet})` : `- Admission of fault`;
    const breakdownText = evidenceSnippet ? `Admission of fault (${evidenceSnippet})` : `Admission of fault`;
    reasons.push(reasonText);
    breakdown.push({ factor: "admission_of_fault", delta: W.ADMISSION_OF_FAULT, reason: breakdownText });
  }

  if (features.booleans.police_report_present) {
    score += W.POLICE_REPORT;
    reasons.push(`+ Police report present`);
    breakdown.push({ factor: "police_report", delta: W.POLICE_REPORT, reason: "Police report present" });
  }

  if (features.booleans.defendant_identified) {
    score += W.DEFENDANT_LOCATION;
    reasons.push(`+ Defendant/location identified`);
    breakdown.push({ factor: "defendant_location", delta: W.DEFENDANT_LOCATION, reason: "Defendant/location identified" });
  }

  if (features.booleans.witness_present) {
    score += W.WITNESS_PRESENT;
    reasons.push(`+ Witness present`);
    breakdown.push({ factor: "witness_present", delta: W.WITNESS_PRESENT, reason: "Witness present" });
  }



  const erWithin24 = (features.providers?.er === true || hasERSameDay(t)) && 
    features.numbers.first_treatment_latency_hours !== null && 
    features.numbers.first_treatment_latency_hours <= W.ER_WITHIN_HOURS;

  if (erWithin24) {
    score += W.ER_SAME_DAY;
    reasons.push(`+ Emergency care same day`);
    breakdown.push({ factor: "er_same_day", delta: W.ER_SAME_DAY, reason: "Emergency care same day" });
  }
  
  trace.erSameDay = erWithin24;

  const physicianCount = features.providers?.physician ?? 0;
  const chiroCount = features.providers?.chiro ?? 0;
  const ptCount = features.providers?.pt ?? 0;
  trace.providers = { physicians: physicianCount, chiropractors: chiroCount };

  const physicianPoints = Math.min(physicianCount * W.PHYSICIAN_POINTS, W.PHYSICIAN_CAP);
  score += physicianPoints;

  const chiroPoints = Math.min(chiroCount * W.CHIRO_POINTS, W.CHIRO_CAP);
  score += chiroPoints;

  const ptPoints = Math.min(ptCount * W.PT_POINTS, W.PT_CAP);
  score += ptPoints;

  if (physicianPoints > 0 || chiroPoints > 0 || ptPoints > 0) {
    const providerTypes = [];
    if (physicianCount > 0) {
      providerTypes.push("physician");
    }
    if (chiroCount > 0) {
      providerTypes.push("chiropractor");
    }
    if (ptCount > 0) {
      providerTypes.push("PT/rehab");
    }
    const totalPoints = physicianPoints + chiroPoints + ptPoints;
    reasons.push(`+ Multiple providers (${providerTypes.join(", ")})`);
    breakdown.push({ factor: "providers", delta: totalPoints, reason: `Multiple providers (${providerTypes.join(", ")})` });
  }

  const featuresPain = features.numbers.peak_pain_0_10;
  const intakePain = intake.pain_level;
  const maxPain = Math.max(featuresPain, intakePain || 0);

  trace.maxPain = maxPain > 0 ? maxPain : null;

  if (maxPain > 0) {
    const painPoints = Math.min(W.PAIN_CAP, maxPain);
    score += painPoints;
    reasons.push(`+ Pain up to ${maxPain}/10`);
    breakdown.push({ factor: "pain_level", delta: painPoints, reason: `Pain up to ${maxPain}/10` });
  }

  const featuresWorkDays = features.numbers.missed_work_days;
  const intakeWorkDays = intake.days_missed_work;
  const daysMissed = featuresWorkDays ?? intakeWorkDays ?? null;

  trace.daysMissedWork = daysMissed;

  if (daysMissed !== null) {
    const workPoints = Math.min(W.WORK_CAP, daysMissed);
    score += workPoints;
    reasons.push(`+ Missed ${daysMissed} days`);
    breakdown.push({ factor: "missed_work", delta: workPoints, reason: `Missed ${daysMissed} days` });
  }

  // incident → first care
  const latency = features.numbers.first_treatment_latency_hours;
  trace.treatmentLatency = latency;

  if (latency !== null) {
    if (latency <= W.ER_WITHIN_HOURS) {
      score += W.PROMPT_TREATMENT;
      reasons.push(`+ Prompt treatment`);
      breakdown.push({ factor: "prompt_treatment", delta: W.PROMPT_TREATMENT, reason: "Prompt treatment" });
    } else if (latency <= W.TREATMENT_72H_HOURS) {
      score += W.TREATMENT_72H;
      reasons.push(`+ Treatment within 72h`);
      breakdown.push({ factor: "treatment_72h", delta: W.TREATMENT_72H, reason: "Treatment within 72h" });
    } else {
      score += W.DELAYED_TREATMENT;
      reasons.push(`- Delayed treatment (>72h)`);
      breakdown.push({ factor: "delayed_treatment", delta: W.DELAYED_TREATMENT, reason: "Delayed treatment (>72h)" });
    }
  }

  if (features.booleans.imaging_ordered) {
    score += W.IMAGING;
    reasons.push(`+ Imaging ordered`);
    breakdown.push({ factor: "imaging", delta: W.IMAGING, reason: "Imaging ordered" });
  }

  if (features.booleans.neurologic_symptoms) {
    score += W.NEUROLOGIC;
    reasons.push(`+ Neurologic symptoms`);
    breakdown.push({ factor: "neurologic", delta: W.NEUROLOGIC, reason: "Neurologic symptoms" });
  }

  const hasInsuranceInTranscript = matchesPattern(t, /\b(policy|claim)\b/i) ||
    matchesPattern(t, /(State Farm|Geico|Progressive|Allstate|Blue Cross|Kaiser|Aetna|United|PPO|HMO)/i);
  const hasInsuranceInIntake = intake.insurance_provider && intake.insurance_provider.trim() !== "";
  
  if (hasInsuranceInTranscript || hasInsuranceInIntake) {
    score += W.INSURANCE_NOTED;
    reasons.push(`+ Insurance noted`);
    breakdown.push({ factor: "insurance_noted", delta: W.INSURANCE_NOTED, reason: "Insurance noted" });
    trace.insuranceNoted = true;
  }

  if (features.booleans.other_insurer_contacted) {
    score += W.INSURER_CONTACT;
    reasons.push(`+ Insurer contact`);
    breakdown.push({ factor: "insurer_contact", delta: W.INSURER_CONTACT, reason: "Insurer contact" });
    trace.insurerContact = true;
  }

  if (W.MINOR_DAMAGE !== 0) {
    if (features.strings.property_damage === "minor") {
      score += W.MINOR_DAMAGE;
      reasons.push(`- Minor property damage`);
      breakdown.push({ factor: "minor_damage", delta: W.MINOR_DAMAGE, reason: "Minor property damage" });
      trace.minorPropertyDamage = true;
    }
  }

  // use regex check as fallback if LLM didn't pre-existing
  if (matchesPattern(t, /(slipped a disc|prior back)/i)) {
    const feelsDifferent = matchesPattern(t, /(feels different|new pain)/i);

    if (feelsDifferent) {
      score += W.PRE_EXISTING_DIFFERENT;
      reasons.push(`~ Pre-existing noted, but different presentation`);
      breakdown.push({ factor: "pre_existing_different", delta: W.PRE_EXISTING_DIFFERENT, reason: "Pre-existing noted, but different presentation" });
    } else {
      score += W.PRE_EXISTING;
      reasons.push(`- Pre-existing similar condition`);
      breakdown.push({ factor: "pre_existing", delta: W.PRE_EXISTING, reason: "Pre-existing similar condition" });
    }
    trace.preExistingCondition = true;
  }

  if (features.booleans.is_pedestrian_or_bicyclist) {
    score += W.PEDESTRIAN_OR_BICYCLIST;
    reasons.push(`+ Pedestrian/bicyclist case`);
    breakdown.push({ factor: "pedestrian_or_bicyclist", delta: W.PEDESTRIAN_OR_BICYCLIST, reason: "Pedestrian/bicyclist case" });
  }

  if (features.booleans.in_crosswalk) {
    score += W.CROSSWALK_BONUS;
    reasons.push(`+ In crosswalk`);
    breakdown.push({ factor: "crosswalk_bonus", delta: W.CROSSWALK_BONUS, reason: "In crosswalk" });
  }

  if (!features.booleans.helmet_worn && features.booleans.is_pedestrian_or_bicyclist) {
    score += W.NO_HELMET_PENALTY;
    reasons.push(`- No helmet worn`);
    breakdown.push({ factor: "no_helmet_penalty", delta: W.NO_HELMET_PENALTY, reason: "No helmet worn" });
  }

  if (features.booleans.is_rideshare) {
    score += W.RIDESHARE;
    reasons.push(`+ Rideshare case`);
    breakdown.push({ factor: "rideshare", delta: W.RIDESHARE, reason: "Rideshare case" });
  }

  if (features.booleans.is_commercial_vehicle) {
    score += W.COMMERCIAL_VEHICLE;
    reasons.push(`+ Commercial vehicle`);
    breakdown.push({ factor: "commercial_vehicle", delta: W.COMMERCIAL_VEHICLE, reason: "Commercial vehicle" });
  }

  if (features.booleans.hit_and_run) {
    score += W.HIT_AND_RUN;
    reasons.push(`- Hit and run`);
    breakdown.push({ factor: "hit_and_run", delta: W.HIT_AND_RUN, reason: "Hit and run" });
  }

  if (features.booleans.dui_other_driver) {
    score += W.DUI_OTHER_DRIVER;
    reasons.push(`+ Other driver DUI`);
    breakdown.push({ factor: "dui_other_driver", delta: W.DUI_OTHER_DRIVER, reason: "Other driver DUI" });
  }

  if (features.booleans.um_uim_applicable) {
    score += W.UM_UIM_APPLICABLE;
    reasons.push(`+ UM/UIM applicable`);
    breakdown.push({ factor: "um_uim_applicable", delta: W.UM_UIM_APPLICABLE, reason: "UM/UIM applicable" });
  }

  if (features.booleans.airbag_deployed) {
    score += W.AIRBAG_DEPLOYED;
    reasons.push(`+ Airbag deployed`);
    breakdown.push({ factor: "airbag_deployed", delta: W.AIRBAG_DEPLOYED, reason: "Airbag deployed" });
  }

  if (features.strings.property_damage === "severe") {
    score += W.SEVERE_DAMAGE_BONUS;
    reasons.push(`+ Severe property damage`);
    breakdown.push({ factor: "severe_damage_bonus", delta: W.SEVERE_DAMAGE_BONUS, reason: "Severe property damage" });
  }

  // for recency, use incident_date_iso if available, otherwise incidentDate, then intake.incident_date
  const effectiveIncidentDate = features.strings.incident_date_iso ?? incidentDate ?? intake.incident_date ?? null;
  const normalizedIncidentDate = normalizeIncidentDate(effectiveIncidentDate, now);
  const daysSinceIncident = daysSince(normalizedIncidentDate, now);
  trace.daysSinceIncident = daysSinceIncident;

  if (daysSinceIncident !== null) {
    if (daysSinceIncident <= W.RECENT_30D_DAYS) {
      score += W.RECENT_30D;
      reasons.push(`+ Recent incident (<30d)`);
      breakdown.push({ factor: "recent_30d", delta: W.RECENT_30D, reason: "Recent incident (<30d)" });
      trace.recentIncident = true;
    } else if (daysSinceIncident <= W.RECENT_180D_DAYS) {
      score += W.RECENT_180D;
      reasons.push(`+ Recent incident (<180d)`);
      breakdown.push({ factor: "recent_180d", delta: W.RECENT_180D, reason: "Recent incident (<180d)" });
    } else if (daysSinceIncident > W.OLD_INCIDENT_DAYS) {
      score += W.OLD_INCIDENT;
      reasons.push(`- Old incident (>1yr)`);
      breakdown.push({ factor: "old_incident", delta: W.OLD_INCIDENT, reason: "Old incident (>1yr)" });
      trace.oldIncident = true;
    }
  } else {
    // check year inference from case number
    const caseNumberMatch = t.match(/\b(\d{2})[- ]?\d{4}[- ]?\d+\b/);
    if (caseNumberMatch && !effectiveIncidentDate?.includes("20")) {
      const year = parseInt("20" + caseNumberMatch[1], 10);
      const currentYear = (now || new Date()).getFullYear();
      if (year <= currentYear && year >= currentYear - 2) {
        clarifications.push("incident_year");
      }
    }
    reasons.push("~ Incident year unknown");
  }

  // check relative time phrases (when absolute daysSince is unknown)
  if (daysSinceIncident === null) {
    if (matchesPattern(t, /\b(last Friday|two Fridays ago|last week)\b/i)) {
      score += W.RECENT_RELATIVE;
      reasons.push(`+ Recent incident (≤${W.RECENT_RELATIVE_DAYS}d)`);
      breakdown.push({ factor: "recent_relative", delta: W.RECENT_RELATIVE, reason: `Recent incident (≤${W.RECENT_RELATIVE_DAYS}d)` });
      trace.recentIncident = true;
    }
  }

  // add LLM uncertain items to clarifications
  clarifications.push(...features.uncertain);

  score = Math.max(W.MIN_SCORE, Math.min(W.MAX_SCORE, score));

  let decision: "ACCEPT" | "REVIEW" | "DECLINE";
  if (score >= W.ACCEPT_THRESHOLD) {
    decision = "ACCEPT";
  } else if (score < W.DECLINE_THRESHOLD) {
    decision = "DECLINE";
  } else {
    decision = "REVIEW";
  }

  // deterministic nudge: 
  // if result is DECLINE with 30–39 and missing deterministic fields, bump to REVIEW
  if (decision === "DECLINE" && score >= W.REVIEW_NUDGE_MIN && score < W.REVIEW_NUDGE_MAX) {
    const hasMissingDob = !intake.date_of_birth || intake.date_of_birth.trim() === "";
    const hasMissingIncidentDate = !effectiveIncidentDate || effectiveIncidentDate.trim() === "";
    const hasMissingEstimatedValue = !intake.estimated_value || intake.estimated_value === 0;
    
    if (hasMissingDob || hasMissingIncidentDate || hasMissingEstimatedValue) {
      decision = "REVIEW";
    }
  }

  const uniqueReasons = [...new Set(reasons)];

  return {
    score,
    decision,
    reasons: uniqueReasons,
    clarifications,
    breakdown,
    trace,
  };
}

// check if ER same day
function hasERSameDay(transcript: string | null | undefined): boolean {
  if (!transcript) return false;
  const erPattern = /\b(ER|E\.R\.|emergency (room|dept)|hospital)\b/i;
  return erPattern.test(transcript);
}
