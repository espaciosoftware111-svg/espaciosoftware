import { redirect } from "next/navigation";
import { AuthService } from "@/modules/auth/auth.service";

export default async function RootPage() {
  const session = await AuthService.getSessionFromCookies();
  if (!session) {
    redirect("/login");
  }
  redirect("/dashboard");
}