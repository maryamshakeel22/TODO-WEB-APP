import Link from "next/link";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";

export default function GroupNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <EmptyState
        icon={Users}
        title="Group not found"
        description="This group doesn't exist, or it's private and you don't have access to it."
        action={
          <Button asChild size="sm">
            <Link href="/groups">Back to groups</Link>
          </Button>
        }
      />
    </div>
  );
}
