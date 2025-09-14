"use client";

import { useCaseActions } from "@/hooks/use-case-action";
import { CaseActionButton } from "@/components/cases/case-action-button";

interface TranscribeButtonProps {
  caseId: string;
}

export default function TranscribeButton({ caseId }: TranscribeButtonProps) {
  const {
    execute: handleTranscribe,
    isLoading: isTranscribing,
    error,
  } = useCaseActions.transcribe(caseId);

  return (
    <CaseActionButton
      caseId={caseId}
      action="transcribe"
      isLoading={isTranscribing}
      error={error}
      onExecute={handleTranscribe}
      variant="default"
      showDescription={true}
    />
  );
}
