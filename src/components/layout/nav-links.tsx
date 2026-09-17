import { LayoutDashboard, CheckSquare, Users, Compass, Bell, User, Settings } from "lucide-react";

export const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "My Tasks", icon: CheckSquare },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/groups/finder", label: "Group Finder", icon: Compass },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;
