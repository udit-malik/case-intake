import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { AuthFormConfig, AuthFormReturn } from "@/types";

/**
 * Reusable hook for authentication forms (login/signup)
 * Handles common patterns like loading states, error handling, and navigation
 */
export function useAuthForm<T extends FieldValues>(
  config: AuthFormConfig<T>
): AuthFormReturn<T> {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<T>({
    resolver: zodResolver(config.schema as any),
    defaultValues: config.defaultValues as any,
  });

  const clearError = () => {
    if (formError) {
      setFormError(null);
    }
  };

  const handleSubmit = async (data: T) => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch(config.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(config.successMessage);
        // Dispatch custom event to update header
        window.dispatchEvent(new CustomEvent("auth-changed"));
        router.push(config.redirectPath);
      } else {
        const error = await response.json();
        const errorMessage =
          error.error ||
          "An error occurred. Please check your credentials and try again.";
        setFormError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      logger.error("Auth form error", { error, endpoint: config.endpoint });
      const errorMessage =
        "An error occurred. Please check your connection and try again.";
      setFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form: form as any,
    isSubmitting,
    formError,
    clearError,
    handleSubmit,
  };
}
