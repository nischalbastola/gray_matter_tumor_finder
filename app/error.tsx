"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="paper flex flex-1 items-center">
      <div className="mx-auto w-full max-w-xl px-4 py-20 sm:px-6">
        <h1 className="text-4xl">This page failed to render.</h1>
        <p className="mt-3 text-base leading-7 text-[var(--muted-foreground)]">
          The reader can be opened again. Your slice, if you had one selected, was only in this tab.
        </p>
        <Button type="button" className="mt-6 h-11 min-h-11 px-4" onClick={() => reset()}>
          Try again
        </Button>
      </div>
    </div>
  );
}
