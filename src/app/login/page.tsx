import { redirect } from "next/navigation";
import { AuthService } from "@/modules/auth/auth.service";
import LoginForm from "./login-form";

export const metadata = {
  title: "Sign In | ESPACIO ERP",
  description: "Enterprise login portal for ESPACIO Interiors and Modular Management System.",
};

export default async function LoginPage() {
  const session = await AuthService.getSessionFromCookies();

  // If already authenticated with a valid session, redirect immediately to dashboard
  if (session) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}
