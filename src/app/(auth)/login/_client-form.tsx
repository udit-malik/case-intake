"use client";

import { z } from "zod";
import { useAuthForm } from "@/hooks/use-auth-form";
import { AuthForm } from "@/features/auth/components/auth-form";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const { form, isSubmitting, formError, clearError, handleSubmit } =
    useAuthForm<LoginFormData>({
      schema: loginSchema,
      defaultValues: { email: "", password: "" },
      endpoint: "/api/auth/login",
      successMessage: "Login successful!",
      redirectPath: "/dashboard",
    });

  const {
    register,
    handleSubmit: formHandleSubmit,
    formState: { errors },
  } = form;

  return (
    <AuthForm
      title="Welcome back"
      description="Sign in to your account to continue"
      cardTitle="Sign in"
      cardDescription="Enter your credentials to access your dashboard"
      submitButtonText="Sign in"
      submitButtonLoadingText="Signing in..."
      linkText="Don't have an account?"
      linkHref="/signup"
      linkLabel="Create one"
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
