import Link from "next/link";
import { CheckSquare, Users, Bell, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: CheckSquare,
    title: "Personal & group tasks",
    description: "Keep your own to-dos organized while collaborating on shared ones with your team.",
  },
  {
    icon: Users,
    title: "Groups, built right",
    description: "Public or private groups, roles, invitations, and member management out of the box.",
  },
  {
    icon: Bell,
    title: "Real-time notifications",
    description: "Get notified the moment you're assigned a task, invited to a group, or work is done.",
  },
  {
    icon: Zap,
    title: "Live everywhere",
    description: "Changes sync instantly across web and mobile via Supabase Realtime.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <CheckSquare className="h-4 w-4" />
            </span>
            TaskTogether
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">
                <span>Sign in</span>
              </Link>
            </Button>
            <Button asChild>
              <Link href="/signup">
                <span>Get started</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="container flex flex-col items-center gap-6 py-24 text-center">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Tasks that work for you — and your team
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Personal to-dos, collaborative group tasks, real-time updates, and a group finder to
          discover teams worth joining. All in one clean workspace.
        </p>
        <div className="flex gap-3">
          <Button size="lg" asChild>
            <Link href="/signup">
              <span>Create your account</span>
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">
              <span>Sign in</span>
            </Link>
          </Button>
        </div>
      </section>

      <section className="container grid gap-6 pb-24 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className="rounded-lg border border-border bg-card p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-accent">
              <f.icon className="h-5 w-5 text-accent-foreground" />
            </div>
            <h3 className="mb-1 font-semibold">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}