"use client";

import { useState, useEffect } from "react";
import { StatusButton } from "@/components/ui/status-button";
import { Icons } from "@/components/ui/icons";
import { useCaseActions } from "@/hooks/use-case-action";
import { getMissingSubmitFields } from "@/lib/validation/submit-validation";

interface SubmitDecisionButtonProps {
  caseId: string;
  intakeDraft: any;
  disabled?: boolean;
  submittedAt?: Date;
}

export default function SubmitDecisionButton({
  caseId,
  intakeDraft: _intakeDraft,
  disabled = false,
  submittedAt,
}: SubmitDecisionButtonProps) {
  const [isFormComplete, setIsFormComplete] = useState(false);

  const { execute: handleSubmit, isLoading: isSubmitting } =
    useCaseActions.submit(caseId, {
      onError: (error) => {
        alert(`Failed to submit decision: ${error}`);
      },
      onSuccess: () => {
        window.location.reload();
      },
    });

  // check if form is complete
  useEffect(() => {
    const checkFormCompletion = () => {
      const form = document.querySelector("form");
      if (!form) {
        setIsFormComplete(false);
        return;
      }

      const formData = new FormData(form);
      const intakeData = {
        client_name: formData.get("client_name") || "",
        date_of_birth: formData.get("date_of_birth") || "",
        email: formData.get("email") || "",
        incident_date: formData.get("incident_date") || "",
        incident_description: formData.get("incident_description") || "",
      };

      const missingFields = getMissingSubmitFields(intakeData);
      setIsFormComplete(missingFields.length === 0);
    };

    checkFormCompletion();

    // listen for form changes
    const form = document.querySelector("form");
    if (form) {
      form.addEventListener("input", checkFormCompletion);
      form.addEventListener("change", checkFormCompletion);

      return () => {
        form.removeEventListener("input", checkFormCompletion);
        form.removeEventListener("change", checkFormCompletion);
      };
    }
  }, []);

  return (
    <StatusButton
      onClick={handleSubmit}
      isLoading={isSubmitting}
      disabled={disabled || !isFormComplete}
      loadingText="Submitting..."
      variant="success"
      status={submittedAt ? "success" : "idle"}
      statusMessage={submittedAt ? `at ${submittedAt.toLocaleString()}` : undefined}
      showStatus={!!submittedAt}
      icon={<Icons.Submit />}
    >
      Submit Decision
    </StatusButton>
  );
}
