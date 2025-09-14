"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { logger } from "@/lib/logger";

interface AutoSettingsToggleProps {
  userId: string;
  initialAutoTranscribe: boolean;
  initialAutoExtract: boolean;
}

export default function AutoSettingsToggle({
  userId: _userId,
  initialAutoTranscribe,
  initialAutoExtract,
}: AutoSettingsToggleProps) {
  const [autoTranscribe, setAutoTranscribe] = useState(initialAutoTranscribe);
  const [autoExtract, setAutoExtract] = useState(initialAutoExtract);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateSetting = async (
    setting: "autoTranscribe" | "autoExtract",
    value: boolean
  ) => {
    setIsUpdating(true);
    try {
      const response = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [setting]: value,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update setting");
      }

      if (setting === "autoTranscribe") {
        setAutoTranscribe(value);
      } else {
        setAutoExtract(value);
      }
    } catch (error) {
      logger.error("Error updating setting", {
        error,
        setting,
        value,
        userId: _userId,
      });
      
      if (setting === "autoTranscribe") {
        setAutoTranscribe(!value);
      } else {
        setAutoExtract(!value);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="auto-transcribe" className="text-sm font-medium">
            Auto-transcribe on upload
          </Label>
          <p className="text-xs text-slate-500">
            Automatically start transcription when audio is uploaded
          </p>
        </div>
        <Switch
          id="auto-transcribe"
          checked={autoTranscribe}
          onCheckedChange={(checked: boolean) =>
            updateSetting("autoTranscribe", checked)
          }
          disabled={isUpdating}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="auto-extract" className="text-sm font-medium">
            Auto-extract after transcription
          </Label>
          <p className="text-xs text-slate-500">
            Automatically extract case information after transcription completes
          </p>
        </div>
        <Switch
          id="auto-extract"
          checked={autoExtract}
          onCheckedChange={(checked: boolean) =>
            updateSetting("autoExtract", checked)
          }
          disabled={isUpdating}
        />
      </div>
    </div>
  );
}
