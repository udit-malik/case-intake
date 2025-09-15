import { CaseType, CaseFeatures } from "./types";
import { SCORING_VERSION, ENABLE_LLM_FEATURES, EXTRACTION_RULES_VERSION } from "./constants";
import { 
  asBool, 
  asNum, 
  asStr, 
  asEnum, 
  asStringArray, 
  parseMaybeISO, 
  stripCodeFences 
} from "./utils";

// process-wide memo cache for LLM feature extraction
const FEATURE_CACHE = (globalThis as any).__FEATURE_CACHE || ((globalThis as any).__FEATURE_CACHE = new Map<string, Partial<CaseFeatures>>());

async function extractFeaturesLLM(transcript: string, anchorDateISO: string): Promise<Partial<CaseFeatures>> {
  if (!process.env.OPENAI_API_KEY || !ENABLE_LLM_FEATURES) {
    return {};
  }

  // create canonical transcript
  const canonicalTranscript = transcript
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[—–]/g, "-")
    .replace(/[""''`]/g, '"')
    .toLowerCase();

  // generate stable cache key
  const model = "gpt-4o-mini-2024-07-18";
  const seed = 42;
  const cacheKey = `${SCORING_VERSION}|${EXTRACTION_RULES_VERSION}|${model}|${seed}|${anchorDateISO}|${canonicalTranscript}`;
  
  if (FEATURE_CACHE.has(cacheKey)) {
    return FEATURE_CACHE.get(cacheKey)!;
  }

  try {
    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt =
      "You are extracting deterministic PI case features. Output strict JSON ONLY, matching the exact keys and types requested. Do not include any prose.";
    
    const userPrompt = `Extract these exact keys from transcript (ALL required; use null when unknown):

- case_type: "MVA_REAR_END" | "MVA_LEFT_TURN" | "MVA_T_BONE" | "MVA_SIDESWIPE" | "PREMISES_WET_FLOOR" | "PREMISES_ICE_SNOW" | "PREMISES_TRIP_HAZARD" | "DOG_BITE" | "PEDESTRIAN_OR_BICYCLE" | "RIDESHARE_MVA" | "OTHER"
- rear_ended: boolean
- no_warning_signs: boolean
- admission_of_fault: boolean
- police_report_present: boolean
- defendant_identified: boolean
- witness_present: boolean
- injury_sites: string[]
- peak_pain_0_10: number (0-10)
- first_treatment_latency_hours: number | null
- providers: {
    pt: number,
    physician: number,
    chiro: number,
    er: boolean,
    imaging_ordered: boolean,
    imaging_completed: boolean
  }
- missed_work_days: number | null
- neurologic_symptoms: boolean
- incident_date_iso: string | null  // resolve relative phrases against anchor date: ${anchorDateISO}
- relative_time_mentions: string[]
- client_auto_carrier: string | null
- client_health_carrier: string | null
- property_damage: "none" | "minor" | "moderate" | "severe"
- other_insurer_contacted: boolean
- is_pedestrian_or_bicyclist: boolean
- in_crosswalk: boolean
- helmet_worn: boolean
- is_rideshare: boolean
- is_commercial_vehicle: boolean
- hit_and_run: boolean
- dui_other_driver: boolean
- um_uim_applicable: boolean
- airbag_deployed: boolean
- uncertain: string[]
- evidence: Record<string, { quote: string }>  // short quotes (10–50 chars), each keyed by a feature name
- admission_attribution: "self" | "other" | "ambiguous"
- admission_rationale: "direct_admission" | "negligent_act" | "third_party_claim" | "ambiguous"
- admission_evidence: string | null  // short quote from caller
- admission_rules_version: "admission-rules-v1"  // ALWAYS set to this exact value

## Admission Rules
True only if (attribution=self) AND (rationale in: direct_admission|negligent_act) AND (admission_evidence contains a short direct quote from the caller).
Disqualify third-party claims and ambiguous phrasing.

### Positive Examples:
1. "I ran the red light and hit the other car" → attribution=self, rationale=direct_admission, evidence="ran the red light"
2. "I was speeding and caused the accident" → attribution=self, rationale=negligent_act, evidence="was speeding and caused"

### Negative Examples:
1. "The other driver said it was my fault" → attribution=other, rationale=third_party_claim, evidence=null
2. "It might have been my mistake" → attribution=ambiguous, rationale=ambiguous, evidence=null

// New universal modifiers above are booleans; return true/false or null→false.

TRANSCRIPT:
${canonicalTranscript}

Return JSON only.`;

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0,
      top_p: 1,
      seed: 42,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "CaseFeatures",
          schema: {
            type: "object",
            properties: {
              case_type: {
                type: "string",
                enum: ["MVA_REAR_END", "MVA_LEFT_TURN", "MVA_T_BONE", "MVA_SIDESWIPE", "PREMISES_WET_FLOOR", "PREMISES_ICE_SNOW", "PREMISES_TRIP_HAZARD", "DOG_BITE", "PEDESTRIAN_OR_BICYCLE", "RIDESHARE_MVA", "OTHER"]
              },
              rear_ended: { type: "boolean" },
              no_warning_signs: { type: "boolean" },
              admission_of_fault: { type: "boolean" },
              police_report_present: { type: "boolean" },
              defendant_identified: { type: "boolean" },
              witness_present: { type: "boolean" },
              injury_sites: {
                type: "array",
                items: { type: "string" }
              },
              peak_pain_0_10: { type: "number", minimum: 0, maximum: 10 },
              first_treatment_latency_hours: { type: ["number", "null"] },
              providers: {
                type: "object",
                properties: {
                  pt: { type: "number", minimum: 0, maximum: 12 },
                  physician: { type: "number", minimum: 0, maximum: 12 },
                  chiro: { type: "number", minimum: 0, maximum: 12 },
                  er: { type: "boolean" },
                  imaging_ordered: { type: "boolean" },
                  imaging_completed: { type: "boolean" }
                },
                required: ["pt", "physician", "chiro", "er", "imaging_ordered", "imaging_completed"]
              },
              missed_work_days: { type: ["number", "null"] },
              neurologic_symptoms: { type: "boolean" },
              incident_date_iso: { type: ["string", "null"] },
              relative_time_mentions: {
                type: "array",
                items: { type: "string" }
              },
              client_auto_carrier: { type: ["string", "null"] },
              client_health_carrier: { type: ["string", "null"] },
              property_damage: {
                type: "string",
                enum: ["none", "minor", "moderate", "severe"]
              },
              other_insurer_contacted: { type: "boolean" },
              is_pedestrian_or_bicyclist: { type: "boolean" },
              in_crosswalk: { type: "boolean" },
              helmet_worn: { type: "boolean" },
              is_rideshare: { type: "boolean" },
              is_commercial_vehicle: { type: "boolean" },
              hit_and_run: { type: "boolean" },
              dui_other_driver: { type: "boolean" },
              um_uim_applicable: { type: "boolean" },
              airbag_deployed: { type: "boolean" },
              uncertain: {
                type: "array",
                items: { type: "string" }
              },
              evidence: {
                type: "object",
                additionalProperties: {
                  type: "object",
                  properties: {
                    quote: { type: "string" }
                  },
                  required: ["quote"]
                }
              },
              admission_attribution: {
                type: "string",
                enum: ["self", "other", "ambiguous"]
              },
              admission_rationale: {
                type: "string",
                enum: ["direct_admission", "negligent_act", "third_party_claim", "ambiguous"]
              },
              admission_evidence: {
                type: ["string", "null"]
              },
              admission_rules_version: {
                type: "string"
              }
            },
            required: ["case_type", "rear_ended", "no_warning_signs", "admission_of_fault", "police_report_present", "defendant_identified", "witness_present", "injury_sites", "peak_pain_0_10", "first_treatment_latency_hours", "providers", "missed_work_days", "neurologic_symptoms", "incident_date_iso", "relative_time_mentions", "client_auto_carrier", "client_health_carrier", "property_damage", "other_insurer_contacted", "is_pedestrian_or_bicyclist", "in_crosswalk", "helmet_worn", "is_rideshare", "is_commercial_vehicle", "hit_and_run", "dui_other_driver", "um_uim_applicable", "airbag_deployed", "uncertain", "evidence", "admission_attribution", "admission_rationale", "admission_evidence", "admission_rules_version"]
          },
          strict: true
        }
      },
      max_tokens: 800,
    });

    let content = resp.choices?.[0]?.message?.content ?? "";
    if (!content) return {};

    if (content.startsWith("```")) content = stripCodeFences(content);

    let raw: any;
    try {
      raw = JSON.parse(content);
    } catch {
      return {};
    }

    // compute gated admission of fault based on new admission rules
    const admissionOfFaultGated = 
      raw.admission_attribution === "self" &&
      (raw.admission_rationale === "direct_admission" || raw.admission_rationale === "negligent_act") &&
      raw.admission_evidence && raw.admission_evidence.trim().length > 0;

    // map to Partial<CaseFeatures> 
    const ct = asEnum(
      raw.case_type,
      [
        "MVA_REAR_END",
        "MVA_LEFT_TURN",
        "MVA_T_BONE",
        "MVA_SIDESWIPE",
        "PREMISES_WET_FLOOR",
        "PREMISES_ICE_SNOW",
        "PREMISES_TRIP_HAZARD",
        "DOG_BITE",
        "PEDESTRIAN_OR_BICYCLE",
        "RIDESHARE_MVA",
        "OTHER",
      ] as const,
      "OTHER"
    );

    const providers = {
      pt: asNum(raw?.providers?.pt, { min: 0, max: 12, nullable: false }) ?? 0,
      physician: asNum(raw?.providers?.physician, { min: 0, max: 12, nullable: false }) ?? 0,
      chiro: asNum(raw?.providers?.chiro, { min: 0, max: 12, nullable: false }) ?? 0,
      er: asBool(raw?.providers?.er),
      imaging_ordered: asBool(raw?.providers?.imaging_ordered),
      imaging_completed: asBool(raw?.providers?.imaging_completed),
    };

    const out: Partial<CaseFeatures> = {
      case_type: ct as CaseType,
      booleans: {
        rear_ended: asBool(raw.rear_ended),
        no_warning_signs: asBool(raw.no_warning_signs),
        admission_of_fault: admissionOfFaultGated,
        police_report_present: asBool(raw.police_report_present),
        defendant_identified: asBool(raw.defendant_identified),
        witness_present: asBool(raw.witness_present),
        imaging_ordered: providers.imaging_ordered,
        imaging_completed: providers.imaging_completed,
        neurologic_symptoms: asBool(raw.neurologic_symptoms),
        other_insurer_contacted: asBool(raw.other_insurer_contacted),
        is_pedestrian_or_bicyclist: asBool(raw.is_pedestrian_or_bicyclist),
        in_crosswalk: asBool(raw.in_crosswalk),
        helmet_worn: asBool(raw.helmet_worn),
        is_rideshare: asBool(raw.is_rideshare),
        is_commercial_vehicle: asBool(raw.is_commercial_vehicle),
        hit_and_run: asBool(raw.hit_and_run),
        dui_other_driver: asBool(raw.dui_other_driver),
        um_uim_applicable: asBool(raw.um_uim_applicable),
        airbag_deployed: asBool(raw.airbag_deployed),
      },
      numbers: {
        peak_pain_0_10: asNum(raw.peak_pain_0_10, { min: 0, max: 10, nullable: false }) ?? 0,
        first_treatment_latency_hours: asNum(raw.first_treatment_latency_hours, { min: 0, max: 24 * 60, nullable: true }),
        missed_work_days: asNum(raw.missed_work_days, { min: 0, max: 365, nullable: true }),
      },
      strings: {
        injury_sites: asStringArray(raw.injury_sites, { limit: 8, itemMax: 30 }),
        incident_date_iso: parseMaybeISO(raw.incident_date_iso),
        relative_time_mentions: asStringArray(raw.relative_time_mentions, { limit: 6, itemMax: 32 }),
        client_auto_carrier: asStr(raw.client_auto_carrier),
        client_health_carrier: asStr(raw.client_health_carrier),
        property_damage: asEnum(raw.property_damage, ["none", "minor", "moderate", "severe"] as const, "none"),
      },
      providers: {
        pt: providers.pt,
        physician: providers.physician,
        chiro: providers.chiro,
        er: providers.er,
      },
      uncertain: asStringArray(raw.uncertain, { limit: 10, itemMax: 40 }),
      evidence: (() => {
        const evIn = raw.evidence;
        const evOut: Record<string, { quote: string }> = {};
        if (evIn && typeof evIn === "object") {
          for (const k of Object.keys(evIn)) {
            const q = asStr(evIn[k]?.quote) ?? "";
            if (q) evOut[k] = { quote: q.slice(0, 80) };
          }
        }
        return evOut;
      })(),
      admission_meta: {
        attribution: asEnum(raw.admission_attribution, ["self", "other", "ambiguous"] as const, "ambiguous"),
        rationale: asEnum(raw.admission_rationale, ["direct_admission", "negligent_act", "third_party_claim", "ambiguous"] as const, "ambiguous"),
        evidence: asStr(raw.admission_evidence) ?? "",
      },
    };

    // store cache
    FEATURE_CACHE.set(cacheKey, out);
    return out;
  } catch {
    // don't throw from LLM path, stay deterministic via fallback
    return {};
  }
}

// address/business name pattern
function hasDefendantLocation(transcript: string | null | undefined): boolean {
  if (!transcript) return false;

  const addressPattern = /\b\d{3,5}\s+\w+(\s+\w+)*\s+(St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard)\b/i;
  if (addressPattern.test(transcript)) return true;

  const businessPattern = /\b(Market|Grocery|Store|Shop|Restaurant|Hotel|Mall|Center|Plaza)\b/i;
  if (businessPattern.test(transcript)) return true;

  const businessNamePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/i;
  if (businessNamePattern.test(transcript)) return true;

  return false;
}


function hasCaseNumber(transcript: string | null | undefined): boolean {
  if (!transcript) return false;
  const caseNumberPattern = /\b\d{2}[- ]?\d{4}[- ]?\d+\b/;
  return caseNumberPattern.test(transcript);
}


function parsePainLevel(transcript: string | null | undefined): number | null {
  if (!transcript) return null;
  const t = transcript.toLowerCase();

  let maxPain = 0;

  //  X/10 numeric
  for (const m of t.matchAll(/\b(\d{1,2})\s*\/\s*10\b/g)) {
    const n = parseInt(m[1], 10);
    if (n >= 0 && n <= 10) maxPain = Math.max(maxPain, n);
  }

  // X/10 spelled
  for (const m of t.matchAll(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\s*\/\s*10\b/g)) {
    const map: Record<string, number> = {one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10};
    const n = map[m[1]];
    if (n >= 0 && n <= 10) maxPain = Math.max(maxPain, n);
  }

  // X out of 10
  for (const m of t.matchAll(/\b(\d{1,2})\s*(?:out of|of)\s*10\b/g)) {
    const n = parseInt(m[1], 10);
    if (n >= 0 && n <= 10) maxPain = Math.max(maxPain, n);
  }

  // X out of 10 spelled
  for (const m of t.matchAll(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:out of|of)\s*10\b/g)) {
    const map: Record<string, number> = {one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10};
    const n = map[m[1]];
    if (n >= 0 && n <= 10) maxPain = Math.max(maxPain, n);
  }

  for (const m of t.matchAll(/\b(?:spikes to|up to|peaks to)\s+(?:an\s+)?(\d{1,2})\b/g)) {
    const n = parseInt(m[1], 10);
    if (n >= 0 && n <= 10) maxPain = Math.max(maxPain, n);
  }

  for (const m of t.matchAll(/\b(?:spikes to|up to|peaks to)\s+(?:an\s+)?(one|two|three|four|five|six|seven|eight|nine|ten)\b/g)) {
    const map: Record<string, number> = {one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10};
    const n = map[m[1]];
    if (n >= 0 && n <= 10) maxPain = Math.max(maxPain, n);
  }

  // generic pain fallback
  for (const m of t.matchAll(/\b(?:pain|hurt|ache)[^.\d]{0,40}?(\d{1,2})\b/g)) {
    const n = parseInt(m[1], 10);
    if (n >= 0 && n <= 10) {
      // skip if n === 10 and nearby text contains "/10" or "out of 10" (denominator)
      if (n === 10) {
        const start = Math.max(0, m.index! - 20);
        const end = Math.min(t.length, m.index! + m[0].length + 20);
        const nearbyText = t.substring(start, end);
        if (nearbyText.includes('/10') || nearbyText.includes('out of 10')) {
          continue;
        }
      }
      maxPain = Math.max(maxPain, n);
    }
  }
  for (const m of t.matchAll(/\b(?:pain|hurt|ache)[^.]{0,40}?\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/g)) {
    const map: Record<string, number> = {one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10};
    const n = map[m[1]];
    if (n >= 0 && n <= 10) {
      if (n === 10) {
        const start = Math.max(0, m.index! - 20);
        const end = Math.min(t.length, m.index! + m[0].length + 20);
        const nearbyText = t.substring(start, end);
        if (nearbyText.includes('/10') || nearbyText.includes('out of 10')) {
          continue;
        }
      }
      maxPain = Math.max(maxPain, n);
    }
  }

  return maxPain > 0 ? maxPain : null;
}

// count provider mentions exc ER/hospital
function countProviders(
  transcript: string | null | undefined
): { physicians: number; chiropractors: number } {
  if (!transcript) return { physicians: 0, chiropractors: 0 };

  const physicianPattern = /\b(doctor|dr\.|specialist|physical therapy|physical therapist|rehab|PT|urgent care|clinic|orthopedic|ortho)\b/gi;
  const chiroPattern = /\b(chiro|chiropractic|chiropractor)\b/gi;

  const physicians = (transcript.match(physicianPattern) || []).length;
  const chiropractors = (transcript.match(chiroPattern) || []).length;

  return { physicians, chiropractors };
}


function hasERSameDay(transcript: string | null | undefined): boolean {
  if (!transcript) return false;
  const erPattern = /\b(ER|E\.R\.|emergency (room|dept)|hospital)\b/i;
  return erPattern.test(transcript);
}


function getTreatmentLatency(
  transcript: string | null | undefined
): number | null {
  if (!transcript) return null;

  // check for immediate treatment patterns
  const immediatePattern = /\b(immediately|same day|that day|that night|that evening|later that night)\b/i;
  if (immediatePattern.test(transcript)) return 0;

  const rightAwayPattern = /\bright away\b/i;
  if (rightAwayPattern.test(transcript) && !transcript.includes("but after")) {
    return 0;
  }

  // "X hours later" or "next day"
  const hoursPattern = /\b(\d+)\s*hours?\s*later\b/i;
  const hoursMatch = transcript.match(hoursPattern);
  if (hoursMatch) {
    const hours = parseInt(hoursMatch[1], 10);
    return hours;
  }

  // "X days later"
  const daysPattern = /\b(\d+)\s*days?\s*later\b/i;
  const daysMatch = transcript.match(daysPattern);
  if (daysMatch) {
    const days = parseInt(daysMatch[1], 10);
    return days * 24;
  }

  // "after X days"
  const afterDaysPattern = /\bafter\s+(\d+)\s*days?\b/i;
  const afterDaysMatch = transcript.match(afterDaysPattern);
  if (afterDaysMatch) {
    const days = parseInt(afterDaysMatch[1], 10);
    return days * 24;
  }

  const nextDayPattern = /\bnext day\b/i;
  if (nextDayPattern.test(transcript)) return 24;

  return null;
}

function parseDaysMissedWork(
  transcript: string | null | undefined
): number | null {
  if (!transcript) return null;

  // "missed X days"
  const workPattern = /\bmiss(ed)?\s+(\d+)\s+days?\b/i;
  const workMatch = transcript.match(workPattern);
  if (workMatch) {
    const days = parseInt(workMatch[2], 10);
    return days >= 0 ? days : null;
  }

  const spelledWorkPattern = /\bmiss(ed)?\s+(one|two|three|four|five|six|seven|eight|nine|ten)\s+days?\b/i;
  const spelledWorkMatch = transcript.match(spelledWorkPattern);
  if (spelledWorkMatch) {
    const days = spelledNumberToInt(spelledWorkMatch[2]);
    return days;
  }

  // "missed half day/half-day"
  const halfDayPattern = /\bmiss(ed)?\s+half(?:\s*|-)?days?\b/i;
  const halfDayMatch = transcript.match(halfDayPattern);
  if (halfDayMatch) {
    return 1;
  }

  return null;
}


import { spelledNumberToInt } from "./utils";

// feature extraction w/ heuristic/regex
function extractFeaturesHeuristic(transcript: string): CaseFeatures {
  const t = transcript.replace(/\s+/g, " ").trim();
  
  let caseType: CaseType = CaseType.OTHER;
  if (/\b(pedestrian|crosswalk|walking|on foot|bike|bicycle|cyclist|e-?bike|scooter|dooring|left cross|right hook)\b/i.test(t)) {
    caseType = CaseType.PEDESTRIAN_OR_BICYCLE;
  } else if (/\b(Uber|Lyft|rideshare|TNC|driver mode|accepted a ride|passenger)\b/i.test(t)) {
    caseType = CaseType.RIDESHARE_MVA;
  } else if (/\brear[- ]?ended\b/i.test(t)) {
    caseType = CaseType.MVA_REAR_END;
  } else if (/(?:slip|fell).*(?:puddle|spill|wet).*(?:store|market|grocery)/i.test(t)) {
    caseType = CaseType.PREMISES_WET_FLOOR;
  } else if (/\bdog\b.*(?:bite|bit)/i.test(t)) {
    caseType = CaseType.DOG_BITE;
  }

  const painLevel = parsePainLevel(t) || 0;
  
  const treatmentLatency = getTreatmentLatency(t);
  
  const providers = countProviders(t);
  
  const missedWorkDays = parseDaysMissedWork(t);
  
  const hasPoliceReport = hasCaseNumber(t) || /\b(police|officer).*(?:report|case)\b/i.test(t);
  
  const hasDefendantLocationFlag = hasDefendantLocation(t);
  
  const hasER = hasERSameDay(t);
  
  const hasImaging = /(?:x-ray|x rays|ct|mri|imaging)/i.test(t);
  
  // neurological symptoms
  const hasNeurologic = /(?:tingling|numbness|radiating|pins and needles)/i.test(t);
  
  // admission of fault
  const hasAdmission = /\b(?:my fault|i caused|i (?:ran a red|cut.*off|merged too (?:fast|quickly)))\b/i.test(t);
  
  // no warning signs
  const hasNoWarningSigns = /(?:no (?:wet )?floor sign|no warning sign|no caution sign)/i.test(t);
  
  const hasWitness = /\b(?:witness|saw|observed|noticed)\b/i.test(t);
  
  const hasInsurerContact = /\b(?:insurer|insurance company).*called.*statement/i.test(t);
  
  const isPedestrianOrBicyclist = /\b(pedestrian|crosswalk|walking|on foot|bike|bicycle|cyclist|e-?bike|scooter|dooring|left cross|right hook)\b/i.test(t);
  const inCrosswalk = /\b(crosswalk|walk signal|walked on green)\b/i.test(t);
  const helmetWorn = /\bhelmet\b/i.test(t) && !/\b(no|without|wasn't|wasn't wearing).*helmet\b/i.test(t);
  const isRideshare = /\b(Uber|Lyft|rideshare|TNC|driver mode|accepted a ride|passenger)\b/i.test(t);
  const isCommercialVehicle = /\b(semi|18[- ]?wheeler|tractor trailer|box truck|delivery van|bus)\b/i.test(t) || /\b(UPS|FedEx|Amazon)\b/i.test(t);
  const hitAndRun = /\b(hit and run|fled|left the scene|no plate|couldn't get plate)\b/i.test(t);
  const duiOtherDriver = /\b(DUI|DWI|intoxicated|drunk|arrested|breathalyzer)\b/i.test(t);
  const umUimApplicable = /\b(uninsured|underinsured|UM\/UIM|no insurance)\b/i.test(t);
  const airbagDeployed = /\bairbag(s)? (went off|deployed)\b/i.test(t);
  
  let propertyDamage: "none" | "minor" | "moderate" | "severe" = "none";
  if (/(?:minor|scratched|taillights cracked)/i.test(t)) {
    propertyDamage = "minor";
  } else if (/(?:moderate|significant|substantial)/i.test(t)) {
    propertyDamage = "moderate";
  } else if (/(?:severe|major|totaled|destroyed)/i.test(t)) {
    propertyDamage = "severe";
  }

  const provCounts = countProviders(t);
const erFromText = hasERSameDay(t);

  return {
    case_type: caseType,
    providers: {
        pt: /(?:physical therapy|physical therapist|PT|rehab)/i.test(t) ? 1 : 0,
        physician: provCounts.physicians,    // regex count already includes doctor/specialist/PT/rehab
        chiro: provCounts.chiropractors,
        er: erFromText,
      },
    booleans: {
      rear_ended: /\brear[- ]?ended\b/i.test(t),
      no_warning_signs: hasNoWarningSigns,
      admission_of_fault: hasAdmission,
      police_report_present: hasPoliceReport,
      defendant_identified: hasDefendantLocationFlag,
      witness_present: hasWitness,
      imaging_ordered: hasImaging,
      imaging_completed: false,
      neurologic_symptoms: hasNeurologic,
      other_insurer_contacted: hasInsurerContact,
      is_pedestrian_or_bicyclist: isPedestrianOrBicyclist,
      in_crosswalk: inCrosswalk,
      helmet_worn: helmetWorn,
      is_rideshare: isRideshare,
      is_commercial_vehicle: isCommercialVehicle,
      hit_and_run: hitAndRun,
      dui_other_driver: duiOtherDriver,
      um_uim_applicable: umUimApplicable,
      airbag_deployed: airbagDeployed
    },
    numbers: {
      peak_pain_0_10: painLevel,
      first_treatment_latency_hours: treatmentLatency,
      missed_work_days: missedWorkDays,
    },
    strings: {
      injury_sites: [], // needs more complex parsing
      incident_date_iso: null,
      relative_time_mentions: [],
      client_auto_carrier: null,
      client_health_carrier: null,
      property_damage: propertyDamage,
    },
    uncertain: [],
    evidence: {},
  };
}

// combine LLM and heuristic extraction
export async function buildFeatures({ 
  transcript, 
  incidentDate, 
  now 
}: { 
  transcript?: string | null; 
  incidentDate?: string | null; 
  now?: Date 
}): Promise<CaseFeatures> {
  const t = (transcript ?? "").replace(/\s+/g, " ").trim();
  
  if (!t) {
    return extractFeaturesHeuristic("");
  }

  const anchorDateISO = getAnchorDate(incidentDate ?? null, now ?? new Date());
  const llm = await extractFeaturesLLM(t, anchorDateISO);
  const heur = extractFeaturesHeuristic(t);

  // merge: prefer LLM values when present, otherwise heuristic
  return {
    case_type: llm.case_type ?? heur.case_type,
    providers: {
        pt: llm.providers?.pt ?? heur.providers?.pt ?? 0,
        physician: llm.providers?.physician ?? heur.providers?.physician ?? 0,
        chiro: llm.providers?.chiro ?? heur.providers?.chiro ?? 0,
        er: llm.providers?.er ?? heur.providers?.er ?? false,
      },
    booleans: {
      rear_ended: (llm.booleans?.rear_ended === true) || (heur.booleans.rear_ended === true),
      no_warning_signs: llm.booleans?.no_warning_signs ?? heur.booleans.no_warning_signs,
      admission_of_fault: (llm.booleans?.admission_of_fault === true) || (heur.booleans.admission_of_fault === true),
      police_report_present: (llm.booleans?.police_report_present === true) || (heur.booleans.police_report_present === true),
      defendant_identified: (llm.booleans?.defendant_identified === true) || (heur.booleans.defendant_identified === true),
      witness_present: (llm.booleans?.witness_present === true) || (heur.booleans.witness_present === true),
      imaging_ordered: llm.booleans?.imaging_ordered ?? heur.booleans.imaging_ordered,
      imaging_completed: llm.booleans?.imaging_completed ?? heur.booleans.imaging_completed,
      neurologic_symptoms: llm.booleans?.neurologic_symptoms ?? heur.booleans.neurologic_symptoms,
      other_insurer_contacted: llm.booleans?.other_insurer_contacted ?? heur.booleans.other_insurer_contacted,
      is_pedestrian_or_bicyclist: llm.booleans?.is_pedestrian_or_bicyclist ?? heur.booleans.is_pedestrian_or_bicyclist,
      in_crosswalk: llm.booleans?.in_crosswalk ?? heur.booleans.in_crosswalk,
      helmet_worn: llm.booleans?.helmet_worn ?? heur.booleans.helmet_worn,
      is_rideshare: llm.booleans?.is_rideshare ?? heur.booleans.is_rideshare,
      is_commercial_vehicle: llm.booleans?.is_commercial_vehicle ?? heur.booleans.is_commercial_vehicle,
      hit_and_run: llm.booleans?.hit_and_run ?? heur.booleans.hit_and_run,
      dui_other_driver: llm.booleans?.dui_other_driver ?? heur.booleans.dui_other_driver,
      um_uim_applicable: llm.booleans?.um_uim_applicable ?? heur.booleans.um_uim_applicable,
      airbag_deployed: llm.booleans?.airbag_deployed ?? heur.booleans.airbag_deployed,
    },
    numbers: {
      peak_pain_0_10: llm.numbers?.peak_pain_0_10 ?? heur.numbers.peak_pain_0_10,
      first_treatment_latency_hours: llm.numbers?.first_treatment_latency_hours ?? heur.numbers.first_treatment_latency_hours,
      missed_work_days: llm.numbers?.missed_work_days ?? heur.numbers.missed_work_days,
    },
    strings: {
      injury_sites: llm.strings?.injury_sites ?? heur.strings.injury_sites,
      incident_date_iso: llm.strings?.incident_date_iso ?? heur.strings.incident_date_iso,
      relative_time_mentions: llm.strings?.relative_time_mentions ?? heur.strings.relative_time_mentions,
      client_auto_carrier: llm.strings?.client_auto_carrier ?? heur.strings.client_auto_carrier,
      client_health_carrier: llm.strings?.client_health_carrier ?? heur.strings.client_health_carrier,
      property_damage: llm.strings?.property_damage ?? heur.strings.property_damage,
    },
    uncertain: llm.uncertain ?? heur.uncertain,
    evidence: llm.evidence ?? heur.evidence,
  };
}

import { getAnchorDate } from "./utils";
