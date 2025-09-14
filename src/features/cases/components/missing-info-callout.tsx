"use client";

import { Card, CardContent } from "@/components/ui/card";
import ScrollToMissingFieldButton from "@/features/cases/components/scroll-to-missing-field-button";

interface MissingInfoCalloutProps {
  clarifications?: string[]; 
  missingSubmitKeys?: string[]; 
  caseId: string;
}

// map machine keys to human labels
const FIELD_LABELS: { [key: string]: string } = {
  client_name: "Name",
  date_of_birth: "DOB",
  email: "Email",
  incident_date: "Incident date",
  incident_description: "Description",
};

// check if clarification string contains field label already in missing submit fields
const isClarificationDuplicate = (
  clarification: string,
  missingSubmitLabels: string[]
): boolean => {
  const lowerClarification = clarification.toLowerCase();
  return missingSubmitLabels.some((label) =>
    lowerClarification.includes(label.toLowerCase())
  );
};

export default function MissingInfoCallout({
  clarifications = [],
  missingSubmitKeys = [],
  caseId: _caseId,
}: MissingInfoCalloutProps) {
  if (clarifications.length === 0 && missingSubmitKeys.length === 0) {
    return null;
  }

  // map missing submit keys to human labels
  const missingSubmitLabels = missingSubmitKeys.map(
    (key) => FIELD_LABELS[key] || key
  );

  // dedup clarifications + filter overlap with submit-missing
  const deduplicatedClarifications = Array.from(new Set(clarifications)).filter(
    (clarification) =>
      !isClarificationDuplicate(clarification, missingSubmitLabels)
  );

  return (
    <Card
      className="bg-yellow-50 border-yellow-200 shadow-lg mt-6"
      data-testid="missing-info-callout"
    >
      <CardContent className="pt-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-yellow-900">
            Missing Information
          </h3>

          {/* clarifications */}
          {deduplicatedClarifications.length > 0 && (
            <div data-testid="clarifications-section">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">
                Clarifications
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1 mb-3">
                {deduplicatedClarifications.map((clarification, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="text-yellow-600">•</span>
                    <span>{clarification}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* reqd for submit */}
          {missingSubmitLabels.length > 0 && (
            <div data-testid="submit-missing-section">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">
                Required for submission
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1 mb-3">
                {missingSubmitLabels.map((label, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="text-yellow-600">•</span>
                    <span>{label}</span>
                  </li>
                ))}
              </ul>

              {/* scroll to missing field */}
              <ScrollToMissingFieldButton missingFields={missingSubmitLabels} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
