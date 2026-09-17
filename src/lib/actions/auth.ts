"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/domain";

const emailSchema = z.string().trim().email("Enter a valid email address.");
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password is too long.");

function friendlyAuthError(message: string): string {
  // Dev terminal me real error log karein
  console.error("Supabase Raw Auth Error:", message);

  const known: Record<string, string> = {
    "Invalid login credentials": "That email or password is incorrect.",
    "Email not confirmed": "Please confirm your email address before signing in.",
    "User already registered": "An account with that email already exists.",
    "Password should be at least 6 characters.": "Password is too short.",
    "Signup requires a valid password": "Please enter a valid password.",
    "Email rate limit exceeded": "Too many attempts. Please wait a bit and try again.",
    "For security purposes, you can only request this after 60 seconds.":
      "Please wait a moment before trying again.",
  };

  // Fallback me exact message return karein (taake pata chale asal masla kya hai)
  return known[message] ?? message;
}

async function getOrigin() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host");
  return `${proto}://${host}`;
}

export async function signUpAction(formData: FormData): Promise<ActionResult<{ needsEmailConfirmation: boolean }>> {
  const email = emailSchema.safeParse(formData.get("email"));
  const password = passwordSchema.safeParse(formData.get("password"));
  const confirmPassword = formData.get("confirmPassword");
  const fullName = (formData.get("fullName") as string | null)?.trim() || null;

  if (!email.success) return { success: false, error: email.error.issues[0]!.message };
  if (!password.success) return { success: false, error: password.error.issues[0]!.message };
  if (password.data !== confirmPassword) {
    return { success: false, error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const origin = await getOrigin();

  const { data, error } = await supabase.auth.signUp({
    email: email.data,
    password: password.data,
    options: {
      emailRedirectTo: `${origin}/auth/callback?redirectTo=/dashboard`,
      data: fullName ? { full_name: fullName } : undefined,
    },
  });

  if (error) return { success: false, error: friendlyAuthError(error.message) };

  // If email confirmation is required by the project's Auth settings,
  // `session` will be null even though the user was created.
  const needsEmailConfirmation = !data.session;
  return { success: true, data: { needsEmailConfirmation } };
}

export async function signInAction(formData: FormData): Promise<ActionResult> {
  const email = emailSchema.safeParse(formData.get("email"));
  const password = formData.get("password");

  if (!email.success) return { success: false, error: email.error.issues[0]!.message };
  if (!password || typeof password !== "string") {
    return { success: false, error: "Enter your password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.data,
    password,
  });

  if (error) return { success: false, error: friendlyAuthError(error.message) };
  return { success: true, data: undefined };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordResetAction(formData: FormData): Promise<ActionResult> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { success: false, error: email.error.issues[0]!.message };

  const supabase = await createClient();
  const origin = await getOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${origin}/auth/callback?redirectTo=/reset-password`,
  });

  // Supabase intentionally does not reveal whether the email exists.
  if (error) return { success: false, error: friendlyAuthError(error.message) };
  return { success: true, data: undefined };
}

export async function updatePasswordAction(formData: FormData): Promise<ActionResult> {
  const password = passwordSchema.safeParse(formData.get("password"));
  const confirmPassword = formData.get("confirmPassword");

  if (!password.success) return { success: false, error: password.error.issues[0]!.message };
  if (password.data !== confirmPassword) {
    return { success: false, error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: password.data });

  if (error) return { success: false, error: friendlyAuthError(error.message) };
  return { success: true, data: undefined };
}
