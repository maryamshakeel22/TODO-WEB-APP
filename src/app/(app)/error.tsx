"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/states";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md">
        <ErrorState
          title="We hit a snag loading this page"
          description="Please try again. If the problem continues, refresh the page."
          onRetry={reset}
        />
      </div>
    </div>
  );
}
