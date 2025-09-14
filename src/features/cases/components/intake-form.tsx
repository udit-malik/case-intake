"use client";

import { useEffect, forwardRef, useImperativeHandle } from "react";
import { useFieldArray } from "react-hook-form";
import { IntakeBaseSchema, IntakeStrictSchema, type Intake } from "@/schemas/intake";
import { Button } from "@/components/ui/button";
import { FormField, FormTextareaField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { useSimpleForm } from "@/hooks/use-simple-form";
import { displayError } from "@/lib/errors";
import { caseApi } from "@/lib/api-client";
import { logger } from "@/lib/logger";
import { toast } from "sonner";

interface IntakeFormProps {
  caseId: string;
  initialData?: Intake;
  onSaveDraft: (data: Intake) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}


const IntakeForm = forwardRef<{ saveDraft: () => Promise<void> }, IntakeFormProps>(
  ({ caseId, initialData, onSaveDraft, onDirtyChange }, ref) => {
    const form = useSimpleForm<Intake>(
      IntakeStrictSchema,
      initialData || {
        client_name: "",
        date_of_birth: "",
        phone_number: "",
        email: "",
        incident_date: "",
        incident_description: "",
        incident_location: "",
        injuries: "",
        treatment_providers: [],
        insurance_provider: "",
        insurance_policy_number: "",
        employer: "",
        days_missed_work: undefined,
        pain_level: undefined,
        estimated_value: undefined,
        clarification_needed: [],
      }
    );

    const {
      register,
      control,
      handleSubmit,
      getValues,
      isDirty,
      isSubmitting,
      submitError,
      getFieldError,
    } = form;

    const { fields, append, remove } = useFieldArray({
      control,
      name: "treatment_providers" as never,
    });

    const saveDraft = async () => {
      try {
        const data = getValues();
        
        // ckean numeric fields - NaN to undefined
        const cleanedData = {
          ...data,
          days_missed_work: (typeof data.days_missed_work === 'number' && isNaN(data.days_missed_work)) ? undefined : data.days_missed_work,
          pain_level: (typeof data.pain_level === 'number' && isNaN(data.pain_level)) ? undefined : data.pain_level,
          estimated_value: (typeof data.estimated_value === 'number' && isNaN(data.estimated_value)) ? undefined : data.estimated_value,
        };
        
        const validatedData = IntakeBaseSchema.parse(cleanedData);
        
        await caseApi.saveIntake(caseId, validatedData);
        onSaveDraft(validatedData);
        
        toast.success("Draft saved successfully");
      } catch (error) {
        logger.error("Save draft error", { error, caseId });
        displayError(error, {
          showToast: false,
          showAlert: true,
        });
      }
    };

    // notify parent when dirty state changes
    useEffect(() => {
      onDirtyChange?.(isDirty);
    }, [isDirty, onDirtyChange]);

    // expose saveDraft to parents
    useImperativeHandle(ref, () => ({
      saveDraft,
    }));

    return (
      <div className="max-w-3xl mx-auto">
        {submitError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {submitError}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveDraft();
          }}
          className="space-y-6"
        >
          {/* personal info */}
          <FormSection title="Personal Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Client Name"
                required
                {...register("client_name")}
                error={getFieldError("client_name")}
              />

              <FormField
                label="Date of Birth"
                type="date"
                {...register("date_of_birth")}
                error={getFieldError("date_of_birth")}
              />

              <FormField
                label="Phone Number"
                type="tel"
                {...register("phone_number")}
                error={getFieldError("phone_number")}
              />

              <FormField
                label="Email"
                type="email"
                required
                {...register("email")}
                error={getFieldError("email")}
              />
            </div>
          </FormSection>

          {/* incident */}
          <FormSection title="Incident Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Incident Date"
                type="date"
                required
                {...register("incident_date")}
                error={getFieldError("incident_date")}
              />

              <FormField
                label="Incident Location"
                {...register("incident_location")}
                error={getFieldError("incident_location")}
              />
            </div>

            <FormTextareaField
              label="Incident Description"
              required
              rows={4}
              {...register("incident_description")}
              error={getFieldError("incident_description")}
            />

            <FormTextareaField
              label="Injuries"
              rows={3}
              {...register("injuries")}
              error={getFieldError("injuries")}
            />
          </FormSection>

          {/* med info */}
          <FormSection title="Medical Information">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Treatment Providers
              </label>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <FormField
                      label=""
                      placeholder="Provider name"
                      {...register(`treatment_providers.${index}`)}
                      error={getFieldError("treatment_providers")}
                    />
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="px-3 py-2 text-sm text-red-600 hover:text-red-800 rounded border border-red-200 hover:border-red-300"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => append("")}
                  className="w-full px-4 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-300 rounded"
                >
                  Add Treatment Provider
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Pain Level (0-10)"
                type="number"
                inputProps={{ min: 0, max: 10 }}
                {...register("pain_level", { valueAsNumber: true })}
                error={getFieldError("pain_level")}
              />

              <FormField
                label="Days Missed Work"
                type="number"
                inputProps={{ min: 0 }}
                {...register("days_missed_work", { valueAsNumber: true })}
                error={getFieldError("days_missed_work")}
              />
            </div>
          </FormSection>

          <FormSection title="Insurance & Employment">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Insurance Provider"
                {...register("insurance_provider")}
                error={getFieldError("insurance_provider")}
              />

              <FormField
                label="Policy Number"
                {...register("insurance_policy_number")}
                error={getFieldError("insurance_policy_number")}
              />

              <FormField
                label="Employer"
                {...register("employer")}
                error={getFieldError("employer")}
              />

              <FormField
                label="Estimated Value ($)"
                type="number"
                inputProps={{ min: 0 }}
                {...register("estimated_value", { valueAsNumber: true })}
                error={getFieldError("estimated_value")}
              />
            </div>
          </FormSection>

          <div className="flex justify-center pt-4">
            <Button type="submit" variant="outline" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Draft"}
            </Button>
          </div>
        </form>
      </div>
    );
  }
);

IntakeForm.displayName = "IntakeForm";

export default IntakeForm;
