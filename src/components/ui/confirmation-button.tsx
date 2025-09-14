"use client";

import React, { useState } from "react";
import { ActionButton, ActionButtonProps } from "./action-button";

export interface ConfirmationButtonProps extends Omit<ActionButtonProps, 'onClick'> {
  onConfirm: () => void;
  confirmationMessage: string;
  confirmationTitle?: string;
  showConfirmation?: boolean;
}

export function ConfirmationButton({
  onConfirm,
  confirmationMessage,
  confirmationTitle = "Confirm Action",
  showConfirmation = true,
  isLoading = false,
  ...buttonProps
}: ConfirmationButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleClick = async () => {
    if (isLoading || isConfirming) return;

    if (!showConfirmation) {
      onConfirm();
      return;
    }

    // Show confirmation dialog
    const confirmed = window.confirm(
      confirmationTitle ? `${confirmationTitle}\n\n${confirmationMessage}` : confirmationMessage
    );

    if (!confirmed) return;

    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <ActionButton
      {...buttonProps}
      onClick={handleClick}
      isLoading={isLoading || isConfirming}
      loadingText={isConfirming ? "Processing..." : buttonProps.loadingText}
    />
  );
}
