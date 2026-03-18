import { redirect } from "next/navigation";
import { getAuthUserFromCookies } from "@/lib/auth";

export default async function Home() {
  const user = await getAuthUserFromCookies();
  if (user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
