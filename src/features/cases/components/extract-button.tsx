"use client";

import { ActionButton } from "@/components/ui/action-button";
import { ErrorDisplay } from "@/components/ui/error-display";
import { Icons } from "@/components/ui/icons";
import { useCaseActions } from "@/hooks/use-case-action";

interface ExtractButtonProps {
  caseId: string;
}

export default function ExtractButton({ caseId }: ExtractButtonProps) {
  const {
    execute: handleExtract,
    isLoading,
    error,
  } = useCaseActions.extract(caseId, {
    onError: (error) => {
      alert(`Extraction failed: ${error}`);
    },
  });

  return (
    <div className="space-y-4">
      {/* action btn */}
      <div className="flex justify-center">
        <ActionButton
          onClick={handleExtract}
          isLoading={isLoading}
          loadingText="Extracting..."
          variant="default"
          icon={<Icons.Extract />}
        >
          Extract Fields
        </ActionButton>
      </div>

      <ErrorDisplay error={error} title="Extraction Failed" />
    </div>
  );
}
