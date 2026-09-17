import { createClient } from "@/lib/supabase/server";
import { listNotifications } from "@/lib/data/notifications";
import { NotificationsList } from "@/components/notifications/notifications-list";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const notifications = await listNotifications(50);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Notifications</h2>
        <p className="text-sm text-muted-foreground">Only visible to you.</p>
      </div>
      <NotificationsList notifications={notifications} userId={user?.id} />
    </div>
  );
}
