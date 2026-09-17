import { Compass } from "lucide-react";
import { EmptyState } from "@/components/ui/states";
import { GroupCard } from "@/components/groups/group-card";
import { GroupFinderSearch } from "@/components/groups/group-finder-search";
import { searchPublicGroups } from "@/lib/data/groups";

export default async function GroupFinderPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const groups = await searchPublicGroups(params.q);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Group Finder</h2>
        <p className="text-sm text-muted-foreground">
          Discover public groups. Private groups aren&apos;t shown here — you&apos;ll need an invitation.
        </p>
      </div>

      <GroupFinderSearch />

      {groups.length === 0 ? (
        <EmptyState
          title={params.q ? "No groups match your search" : "No public groups yet"}
          description={params.q ? "Try a different search term." : "Be the first to create one."}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} showJoin />
          ))}
        </div>
      )}
    </div>
  );
}