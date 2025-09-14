"use client";

import { useState, useRef } from "react";
import IntakeForm from "@/features/cases/components/intake-form";
import ScoreCaseButton from "@/features/cases/components/score-case-button";
import MissingInfoCallout from "@/features/cases/components/missing-info-callout";
import ScoreDisplay from "@/features/cases/components/score-display";
import SubmitDecisionButton from "@/features/cases/components/submit-decision-button";
import TranscribeButton from "@/features/cases/components/transcribe-button";
import ExtractButton from "@/features/cases/components/extract-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Intake } from "@/schemas/intake";

interface CasePageClientProps {
  caseId: string;
  status: string;
  hasScore: boolean;
  initialData?: Intake;
  showScoreButton?: boolean;
  missingSubmitKeys?: string[];
  clarifications?: string[];
  score?: number;
  decision?: "ACCEPT" | "REVIEW" | "DECLINE";
  decisionReasons?: string[];
  scoredAt?: Date;
  scoringVersion?: string;
  transcriptText?: string;
  submittedAt?: Date;
}

export default function CasePageClient({
  caseId,
  status,
  hasScore: _hasScore,
  initialData,
  showScoreButton = false,
  missingSubmitKeys = [],
  clarifications = [],
  score,
  decision,
  decisionReasons = [],
  scoredAt,
  scoringVersion,
  transcriptText,
  submittedAt,
}: CasePageClientProps) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const formRef = useRef<{ saveDraft: () => Promise<void> }>(null);

  const handleSaveDraft = async () => {
    if (formRef.current?.saveDraft) {
      await formRef.current.saveDraft();
    }
  };

  return (
    <div className="space-y-6">
      {/* transcribe btn */}
      {status === "UPLOADED" && (
        <div className="mb-6">
          <TranscribeButton caseId={caseId} />
        </div>
      )}

      {/* extract btn */}
      {status === "TRANSCRIBED" && (
        <div className="mb-6">
          <ExtractButton caseId={caseId} />
        </div>
      )}

      {/* transcription display */}
      {status === "TRANSCRIBED" && transcriptText && (
        <div className="mb-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Transcription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {transcriptText}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* score btn */}
      {showScoreButton && (
        <div className="mb-6">
          <ScoreCaseButton
            caseId={caseId}
            hasUnsavedChanges={hasUnsavedChanges}
            onSaveDraft={handleSaveDraft}
          />
        </div>
      )}

      {/* score display */}
      {score && decision && scoredAt && (
        <div className="mb-6">
          <ScoreDisplay
            score={score}
            decision={decision}
            decisionReasons={decisionReasons}
            scoredAt={scoredAt}
            scoringVersion={scoringVersion}
          />
        </div>
      )}

      {/* submit decision btn */}
      {score && decision && scoredAt && (
        <div className="mb-6">
          <SubmitDecisionButton
            caseId={caseId}
            intakeDraft={initialData}
            disabled={missingSubmitKeys.length > 0}
            submittedAt={submittedAt}
          />
        </div>
      )}

      {/* missing info - show only when case is extracted and there are missing fields */}
      {["EXTRACTED", "SCORED", "DECIDED"].includes(status) &&
        missingSubmitKeys.length > 0 && (
          <div className="mb-6">
            <MissingInfoCallout
              missingSubmitKeys={missingSubmitKeys}
              clarifications={clarifications}
              caseId={caseId}
            />
          </div>
        )}

      {/* intake form */}
      {["EXTRACTED", "SCORED", "DECIDED"].includes(status) && initialData && (
        <div className="mt-6">
          <IntakeForm
            ref={formRef}
            caseId={caseId}
            initialData={initialData}
            onSaveDraft={() => {}}
            onDirtyChange={setHasUnsavedChanges}
          />
        </div>
      )}
    </div>
  );
}
