"use client";

import { useCaseActions } from "@/hooks/use-case-action";
import { CaseActionButton } from "@/components/cases/case-action-button";

interface ScoreCaseButtonProps {
  caseId: string;
  hasUnsavedChanges?: boolean;
  onSaveDraft?: () => Promise<void>;
}

export default function ScoreCaseButton({
  caseId,
  hasUnsavedChanges = false,
  onSaveDraft,
}: ScoreCaseButtonProps) {
  const {
    execute: handleScore,
    isLoading: isScoring,
    error,
  } = useCaseActions.score(caseId, {
    hasUnsavedChanges,
    onSaveDraft,
    onError: (error) => {
      alert(`Failed to score case: ${error}`);
    },
  });

  return (
    <CaseActionButton
      caseId={caseId}
      action="score"
      isLoading={isScoring}
      error={error}
      onExecute={handleScore}
      variant="default"
      showDescription={false}
    />
  );
}
