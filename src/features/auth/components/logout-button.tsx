"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

export default function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return; // prevent multiple clicks

    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });

      if (response.ok) {
        // dispatch custom event to update header before redirect
        window.dispatchEvent(new CustomEvent("auth-changed"));
        // force a full page reload to ensure session cleanup
        window.location.href = "/login";
      } else {
        logger.error("Logout failed with status", { status: response.status });
        // if logout fails, redirect to login page
        window.location.href = "/login";
      }
    } catch (error) {
      logger.error("Logout failed", { error });
      //
      window.location.href = "/login";
    }
  };

  return (
    <Button
      onClick={handleLogout}
      variant="outline"
      size="sm"
      disabled={isLoggingOut}
      className="text-slate-600 hover:text-slate-900"
    >
      {isLoggingOut ? (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border border-slate-600 border-t-transparent rounded-full animate-spin" />
          Logging out...
        </div>
      ) : (
        "Logout"
      )}
    </Button>
  );
}
