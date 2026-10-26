import type { Metadata } from "next";
import Link from "next/link";
import { ConfusionMatrix } from "@/components/confusion-matrix";
import { TestBrowser } from "@/components/test-browser";
import metricsJson from "@/lib/metrics.json";
import type { Metrics } from "@/lib/types";

const metrics = metricsJson as Metrics;

const description =
  "Every held-out brain MRI test slice. Open any image and compare the dataset label with the model call and all four scores.";

export const metadata: Metadata = {
  title: "Test set",
  description,
  alternates: { canonical: "/test" },
  openGraph: {
    title: "Test set · Nidus",
    description,
    url: "/test",
  },
};

export default function TestPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8 max-w-3xl">
        <h1 className="font-heading text-4xl leading-tight tracking-tight sm:text-5xl">The held-out test set</h1>
        <p className="mt-4 text-base leading-relaxed text-foreground/80 sm:text-lg">
          These {metrics.testImages.toLocaleString("en")} MRI slices were never used to update the weights or to pick
          the checkpoint. Pick one. The page runs the same model and shows every class score, including the ones it
          almost chose.
        </p>
      </header>

      <section aria-labelledby="matrix-heading" className="mb-12">
        <h2 id="matrix-heading" className="font-heading text-3xl tracking-tight">
          Confusion matrix
        </h2>
        <div className="mt-3">
          <ConfusionMatrix metrics={metrics} />
        </div>
      </section>

      <section aria-labelledby="browse-heading">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 id="browse-heading" className="font-heading text-3xl tracking-tight">
            Every test slice
          </h2>
          <Link href="/method" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
            How the split was sealed
          </Link>
        </div>
        <TestBrowser metrics={metrics} />
      </section>
    </div>
  );
}
