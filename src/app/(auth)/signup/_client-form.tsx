"use client";

import { z } from "zod";
import { useAuthForm } from "@/hooks/use-auth-form";
import { AuthForm } from "@/features/auth/components/auth-form";

const signupSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupForm() {
  const { form, isSubmitting, formError, clearError, handleSubmit } =
    useAuthForm<SignupFormData>({
      schema: signupSchema,
      defaultValues: { email: "", password: "" },
      endpoint: "/api/auth/signup",
      successMessage: "Account created successfully!",
      redirectPath: "/dashboard",
    });

  const {
    register,
    handleSubmit: formHandleSubmit,
    formState: { errors },
  } = form;

  return (
    <AuthForm
      title="Get started"
      description="Create your account to begin"
      cardTitle="Create account"
      cardDescription="Enter your details to create your account"
      submitButtonText="Create account"
      submitButtonLoadingText="Creating account..."
      linkText="Already have an account?"
      linkHref="/login"
      linkLabel="Sign in"
      formError={formError}
      isSubmitting={isSubmitting}
      errors={errors}
      register={register}
      handleSubmit={formHandleSubmit}
      clearError={clearError}
      onSubmit={handleSubmit}
    />
  );
}
