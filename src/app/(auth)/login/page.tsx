import { redirect } from "next/navigation";
import { getAuthUserFromCookies } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  const user = await getAuthUserFromCookies();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">RAG Explorer</h1>
          <p className="text-gray-500 mt-2">Sign in to your account</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
