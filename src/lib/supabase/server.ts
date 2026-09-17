import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

/**
 * Server Supabase client for use in Server Components, Route
 * Handlers, and Server Actions. Reads/writes the user's session via
 * cookies so RLS is evaluated as the signed-in user - never as an
 * admin/service role. No secret key is used or needed here.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }: CookieToSet) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component - the middleware is
          // responsible for refreshing the session cookie in that
          // case, so this can be safely ignored.
        }
      },
    },
  });
}
