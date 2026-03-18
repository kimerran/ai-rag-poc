import { redirect } from "next/navigation";
import { getAuthUserFromCookies } from "@/lib/auth";
import AppShell from "@/components/AppShell";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUserFromCookies();
  if (!user) redirect("/login");

  return <AppShell>{children}</AppShell>;
}
