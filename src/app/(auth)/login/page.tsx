"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { signInAction } from "@/lib/actions/auth";
import { sanitizeRedirect } from "@/lib/utils";
import { AuthCard } from "@/components/auth/auth-card";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await signInAction(formData);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    toast.success("Welcome back!");
    const redirectTo = sanitizeRedirect(searchParams.get("redirectTo"));
    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <AuthCard
      title="Sign in"
      description="Welcome back to TaskTogether"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <form action={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <PasswordInput id="password" name="password" autoComplete="current-password" required />
        </div>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="w-full" loading={loading}>
          Sign in
        </Button>
      </form>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-10">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}