"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

/**
 * Browser Supabase client. Safe to use in Client Components.
 * Only ever configured with the PUBLISHABLE key — RLS on the
 * database is what actually enforces authorization, not this key.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = 
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. " +
        "Copy .env.example to .env.local and fill in your project values."
    );
  }

  return createBrowserClient<Database>(url, publishableKey, {
    auth: {
      persistSession: true, // <-- Yeh line session ko band hone ke baad bhi barqarar rakhegi
      autoRefreshToken: true,
    },
  });
}