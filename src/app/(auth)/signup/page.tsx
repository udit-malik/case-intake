import { validateRequest } from "@/lib/auth/lucia";
import { redirect } from "next/navigation";
import SignupForm from "@/app/(auth)/signup/_client-form";

export default async function SignupPage() {
  const { user } = await validateRequest();
  if (user) redirect("/dashboard");
  return <SignupForm />;
}
