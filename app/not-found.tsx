import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center">
      <div className="mx-auto w-full max-w-xl px-4 py-20 sm:px-6">
        <p className="text-xs tracking-[0.16em] text-[var(--muted-foreground)] uppercase">404</p>
        <h1 className="mt-2 text-4xl">That page is not on this study.</h1>
        <p className="mt-3 text-base leading-7 text-[var(--muted-foreground)]">
          The reader, the test set, and the method notes are the pages Nidus publishes.
        </p>
        <Button
          className="mt-6 !h-11 min-h-11 px-4"
          render={<Link href="/" />}
        >
          Back to the reader
        </Button>
      </div>
    </div>
  );
}
