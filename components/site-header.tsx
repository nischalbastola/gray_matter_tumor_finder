import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function SiteHeader() {
  return (
    <header className="console sticky top-0 z-30 border-b border-white/10">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <span
            aria-hidden
            className="grid size-8 place-items-center rounded-full border border-[var(--signal)]/70 text-xs font-semibold text-[var(--signal)]"
          >
            N
          </span>
          <span className="text-lg tracking-tight text-[var(--console-ink)]">Nidus</span>
        </Link>
        <Badge className="bg-[var(--signal)] text-[var(--console)] hover:bg-[var(--signal)]">
          Research only
        </Badge>
        <nav className="ml-auto flex items-center gap-1 text-sm" aria-label="Primary">
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-[var(--console-ink)] hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--signal)]"
          >
            Read a slice
          </Link>
          <Link
            href="/method"
            className="rounded-lg px-3 py-2 text-[var(--console-muted)] hover:bg-white/10 hover:text-[var(--console-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--signal)]"
          >
            Method
          </Link>
        </nav>
      </div>
    </header>
  );
}
