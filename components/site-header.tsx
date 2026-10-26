import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-medium tracking-wide text-primary uppercase">
          <span className="inline-block size-2.5 rounded-sm bg-primary" aria-hidden />
          Nidus
        </Link>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground ring-1 ring-foreground/10">
          Research only
        </span>
        <nav className="ml-auto flex items-center gap-4 text-sm text-muted-foreground" aria-label="Primary">
          <Link href="/" className="underline-offset-4 hover:text-foreground hover:underline">
            Read a slice
          </Link>
          <Link href="/test" className="underline-offset-4 hover:text-foreground hover:underline">
            Test set
          </Link>
          <Link href="/method" className="underline-offset-4 hover:text-foreground hover:underline">
            Method
          </Link>
        </nav>
      </div>
    </header>
  );
}
