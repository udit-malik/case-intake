import { useForm, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";

// simple form hook
export function useSimpleForm<T extends FieldValues>(
  schema: z.ZodSchema<T>,
  defaultValues: T
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<T>({
    resolver: zodResolver(schema as any),
    defaultValues: defaultValues as any,
    mode: "onChange",
  });

  const {
    formState: { errors, isDirty },
  } = form;

  // err helper
  const getFieldError = (fieldName: keyof T) => {
    return errors[fieldName]?.message as string | undefined;
  };

  
  const handleSubmit = async (onSubmit: (data: T) => Promise<void>) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const data = form.getValues();
      await onSubmit(data);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Submission failed";
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    ...form,
    isSubmitting,
    submitError,
    isDirty,
    getFieldError,
    handleSubmit,
    clearError: () => setSubmitError(null),
  };
}
