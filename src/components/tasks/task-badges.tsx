import { Badge } from "@/components/ui/badge";
import type { TodoPriority, TodoStatus } from "@/types/domain";

const PRIORITY_STYLES: Record<TodoPriority, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-secondary text-secondary-foreground border-transparent" },
  medium: { label: "Medium", className: "bg-warning/15 text-warning border-transparent" },
  high: { label: "High", className: "bg-destructive/15 text-destructive border-transparent" },
};

const STATUS_STYLES: Record<TodoStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-secondary text-secondary-foreground border-transparent" },
  in_progress: { label: "In progress", className: "bg-accent text-accent-foreground border-transparent" },
  completed: { label: "Completed", className: "bg-success/15 text-success border-transparent" },
};

export function PriorityBadge({ priority }: { priority: TodoPriority }) {
  const s = PRIORITY_STYLES[priority];
  return <Badge className={s.className}>{s.label}</Badge>;
}

export function StatusBadge({ status }: { status: TodoStatus }) {
  const s = STATUS_STYLES[status];
  return <Badge className={s.className}>{s.label}</Badge>;
}
