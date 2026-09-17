import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profile";
import { getUnreadNotificationCount } from "@/lib/data/notifications";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defense in depth: middleware already protects these routes, but
  // a Server Component should never assume that held true.
  if (!user) redirect("/login");

  const [profile, unreadCount] = await Promise.all([getCurrentProfile(), getUnreadNotificationCount()]);

  return (
    <AppShell profile={profile} email={user.email} userId={user.id} unreadCount={unreadCount}>
      {children}
    </AppShell>
  );
}
