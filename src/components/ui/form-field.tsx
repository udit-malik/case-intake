import React from "react";
import { FieldError } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface FormFieldProps {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  error?: FieldError | string;
  className?: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  errorMessage?: string;
  helpText?: string;
  disabled?: boolean;
}

// reusable form field component
// handles styling, error, required, help text
export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      name,
      label,
      type = "text",
      required = false,
      placeholder,
      error,
      className = "",
      inputProps = {},
      errorMessage,
      helpText,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const hasError = !!error;
    const displayError =
      errorMessage || (typeof error === "string" ? error : error?.message);

    return (
      <div className={`space-y-1 ${className}`}>
        <Label htmlFor={name} className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>

        <Input
          ref={ref}
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            ${
              hasError
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            }
            ${disabled ? "bg-slate-50 text-slate-500" : ""}
          `}
          {...inputProps}
          {...props}
        />

        {displayError && (
          <p className="text-red-500 text-sm mt-1" role="alert">
            {displayError}
          </p>
        )}

        {helpText && !hasError && (
          <p className="text-slate-500 text-sm mt-1">{helpText}</p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";


export interface FormTextareaFieldProps
  extends Omit<FormFieldProps, "type" | "inputProps"> {
  rows?: number;
  textareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
}

export const FormTextareaField = React.forwardRef<
  HTMLTextAreaElement,
  FormTextareaFieldProps
>(
  (
    {
      name,
      label,
      required = false,
      placeholder,
      error,
      className = "",
      textareaProps = {},
      errorMessage,
      helpText,
      disabled = false,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const hasError = !!error;
    const displayError =
      errorMessage || (typeof error === "string" ? error : error?.message);

    return (
      <div className={`space-y-1 ${className}`}>
        <Label htmlFor={name} className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>

        <textarea
          ref={ref}
          id={name}
          name={name}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={`
            w-full px-3 py-2 border rounded-md resize-vertical
            ${
              hasError
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            }
            ${disabled ? "bg-slate-50 text-slate-500" : ""}
            focus:outline-none focus:ring-2 focus:ring-opacity-50
          `}
          {...textareaProps}
          {...props}
        />

        {displayError && (
          <p className="text-red-500 text-sm mt-1" role="alert">
            {displayError}
          </p>
        )}

        {helpText && !hasError && (
          <p className="text-slate-500 text-sm mt-1">{helpText}</p>
        )}
      </div>
    );
  }
);

FormTextareaField.displayName = "FormTextareaField";
