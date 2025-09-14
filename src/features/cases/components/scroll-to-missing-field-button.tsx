"use client";

import { ActionButton } from "@/components/ui/action-button";
import { Icons } from "@/components/ui/icons";

interface ScrollToMissingFieldButtonProps {
  missingFields: string[];
  className?: string;
}

export default function ScrollToMissingFieldButton({
  missingFields,
  className = "",
}: ScrollToMissingFieldButtonProps) {
  const handleScrollToFirstMissingField = () => {
    // find first missing field
    const fieldMap: { [key: string]: string } = {
      Name: "client_name",
      DOB: "date_of_birth",
      Email: "email",
      "Incident date": "incident_date",
      Description: "incident_description",
    };

    const firstMissingField = missingFields[0];
    const fieldId = fieldMap[firstMissingField];

    if (fieldId) {
      const element = document.getElementById(fieldId);
      if (element) {
        element.focus();
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  };

  if (missingFields.length === 0) return null;

  return (
    <ActionButton
      onClick={handleScrollToFirstMissingField}
      variant="warning"
      size="sm"
      className={`mt-2 ${className}`}
      icon={<Icons.Warning size="sm" />}
    >
      Go to first missing field
    </ActionButton>
  );
}
