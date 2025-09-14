import { validateRequest } from "@/lib/auth/lucia";
import { redirect } from "next/navigation";
import LoginForm from "@/app/(auth)/login/_client-form";

export default async function LoginPage() {
  const { user } = await validateRequest();
  if (user) redirect("/dashboard");
  return <LoginForm />;
}
