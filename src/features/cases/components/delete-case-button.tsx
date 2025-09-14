"use client";

import { useState } from "react";
import { ConfirmationButton } from "@/components/ui/confirmation-button";
import { Icons } from "@/components/ui/icons";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/logger";

interface DeleteCaseButtonProps {
  caseId: string;
  label?: string;
}

export default function DeleteCaseButton({
  caseId,
  label = "Delete case",
}: DeleteCaseButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/cases/${caseId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deletedReason: "User requested deletion",
        }),
      });

      if (response.ok) {
        // redirect to dash after successful deletion
        router.push("/dashboard");
      } else {
        logger.error("Delete failed with status", {
          status: response.status,
          caseId,
        });
        alert("Failed to delete case. Please try again.");
      }
    } catch (error) {
      logger.error("Delete failed", { error, caseId });
      alert("Failed to delete case. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ConfirmationButton
      onConfirm={handleDelete}
      confirmationMessage="Are you sure you want to delete this case? This action cannot be undone."
      confirmationTitle="Delete Case"
      isLoading={isDeleting}
      variant="destructive"
      size="sm"
      loadingText="Deleting..."
      icon={<Icons.Delete />}
    >
      {label}
    </ConfirmationButton>
  );
}
