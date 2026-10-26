"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CLASSES } from "@/lib/classes";
import { classifyScan, preloadClassifier } from "@/lib/inference";
import { fileToImageData, prepareScan } from "@/lib/preprocess";
import { readingNote } from "@/lib/reading";
import type { LabelId, Metrics } from "@/lib/types";

type TestImage = {
  src: string;
  label: LabelId;
  file: string;
};

type Catalog = {
  count: number;
  counts: Record<LabelId, number>;
  images: TestImage[];
};

type Readout = {
  label: LabelId;
  scores: number[];
};

const PAGE_SIZE = 24;
const percent = new Intl.NumberFormat("en", { style: "percent", maximumFractionDigits: 1 });

export function TestBrowser({ metrics }: { metrics: Metrics }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [klass, setKlass] = useState<LabelId | "all">("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<TestImage | null>(null);
  const [readout, setReadout] = useState<Readout | null>(null);
  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancel = false;
    fetch("/test-set/index.json")
      .then((response) => {
        if (!response.ok) throw new Error("The test-slice list did not load.");
        return response.json() as Promise<Catalog>;
      })
      .then((data) => {
        if (!cancel) setCatalog(data);
      })
      .catch((reason: unknown) => {
        if (!cancel) setCatalogError(reason instanceof Error ? reason.message : "The test-slice list did not load.");
      });
    preloadClassifier()
      .then(() => {
        if (!cancel) setReady(true);
      })
      .catch((reason: unknown) => {
        if (!cancel) setModelError(reason instanceof Error ? reason.message : "The classifier did not load in this browser.");
      });
    return () => {
      cancel = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!catalog) return [];
    const needle = query.trim().toLowerCase();
    return catalog.images.filter((image) => {
      if (klass !== "all" && image.label !== klass) return false;
      if (needle && !image.file.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [catalog, klass, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  async function choose(image: TestImage) {
    setSelected(image);
    setReadout(null);
    setReadError(null);
    setCopied(false);
    setReading(true);
    try {
      const response = await fetch(image.src);
      if (!response.ok) throw new Error("That slice did not load.");
      const blob = await response.blob();
      const file = new File([blob], image.file, { type: blob.type || "image/jpeg" });
      const prepared = prepareScan(await fileToImageData(file), metrics);
      const result = await classifyScan(prepared.tensor, metrics);
      setReadout({ label: result.label, scores: result.scores });
    } catch (reason) {
      setReadError(reason instanceof Error ? reason.message : "That slice could not be read.");
    } finally {
      setReading(false);
    }
  }

  async function copyReading() {
    if (!selected || !readout) return;
    const text = readingNote({
      fileName: selected.file,
      label: readout.label,
      scores: readout.scores,
      labels: metrics.labels,
      datasetLabel: selected.label,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setReadError("Clipboard is blocked in this browser. Select the reading and copy it manually.");
    }
  }

  const trueRank =
    readout && selected ? readout.scores.map((score, index) => ({ score, index })).sort((a, b) => b.score - a.score).findIndex((item) => metrics.labels[item.index] === selected.label) + 1 : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <label className="text-sm text-muted-foreground" htmlFor="test-search">
          Find a file name
        </label>
        <input
          id="test-search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(0);
          }}
          placeholder="Te-gl_0095"
          className="h-11 w-full rounded-lg border border-border bg-card px-3 text-base sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by dataset label">
          <FilterButton
            active={klass === "all"}
            label={`All ${catalog ? catalog.count.toLocaleString("en") : ""}`.trim()}
            onClick={() => {
              setKlass("all");
              setPage(0);
            }}
          />
          {catalog
            ? metrics.labels.map((label) => (
                <FilterButton
                  key={label}
                  active={klass === label}
                  label={`${CLASSES[label].name} ${catalog.counts[label] ?? 0}`}
                  dot={CLASSES[label].tone}
                  onClick={() => {
                    setKlass(label);
                    setPage(0);
                  }}
                />
              ))
            : null}
        </div>
      </div>

      {catalogError ? <p className="text-sm text-destructive">{catalogError}</p> : null}
      {modelError ? <p className="text-sm text-destructive">{modelError}</p> : null}
      {!catalog && !catalogError ? (
        <p className="text-sm text-muted-foreground">Loading the {metrics.testImages.toLocaleString("en")} test slices…</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="flex flex-col gap-3">
          {catalog && visible.length === 0 ? (
            <p className="rounded-xl bg-card px-4 py-8 text-sm text-muted-foreground ring-1 ring-foreground/10">
              No slices match that filter.
            </p>
          ) : null}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {visible.map((image) => {
              const active = selected?.src === image.src;
              return (
                <button
                  key={image.src}
                  type="button"
                  onClick={() => void choose(image)}
                  disabled={!ready || reading}
                  aria-pressed={active}
                  className={`rounded-lg bg-card p-1 text-left ring-2 ring-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${active ? "ring-primary" : "ring-transparent"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.src}
                    alt={`Test slice ${image.file}, dataset label ${CLASSES[image.label].name}`}
                    className="aspect-square w-full rounded-md bg-muted object-cover"
                  />
                  <span className="mt-1 block truncate text-[10px] leading-tight text-muted-foreground">
                    {CLASSES[image.label].name}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="text-muted-foreground">
              {filtered.length.toLocaleString("en")} slices · page {safePage + 1} of {pageCount}
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="!h-11 min-h-11 bg-card px-4" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                className="!h-11 min-h-11 bg-card px-4"
                disabled={safePage >= pageCount - 1}
                onClick={() => setPage(safePage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>

        <Card className="h-fit lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">This slice</CardTitle>
            <CardDescription>
              {ready
                ? "Pick any held-out image. The dataset label stays off the weights."
                : "Loading the classifier into this browser."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4" aria-live="polite">
            {!selected ? <p className="text-sm text-muted-foreground">Nothing selected yet.</p> : null}
            {selected ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selected.src} alt={`Selected test slice ${selected.file}`} className="h-40 w-40 rounded-lg bg-muted object-cover" />
                <p className="text-sm text-muted-foreground">{selected.file}</p>
                <p>
                  Dataset label <span className="font-medium">{CLASSES[selected.label].name}</span>
                </p>
              </>
            ) : null}
            {reading ? <p className="text-sm text-muted-foreground">Reading the slice…</p> : null}
            {readError ? <p className="text-sm text-destructive">{readError}</p> : null}
            {readout && selected ? (
              <>
                <p className="font-heading text-3xl leading-tight">
                  {readout.label === selected.label ? "Correct" : "Miss"}
                  <span className="mt-1 block text-xl font-normal text-foreground">
                    Called {CLASSES[readout.label].name} · {percent.format(Math.max(...readout.scores))}
                  </span>
                </p>
                {readout.label !== selected.label ? (
                  <p className="text-sm text-muted-foreground">
                    {CLASSES[selected.label].name} was rank {trueRank} at{" "}
                    {percent.format(readout.scores[metrics.labels.indexOf(selected.label)] ?? 0)}.
                  </p>
                ) : null}
                <ul className="flex flex-col gap-2">
                  {metrics.labels.map((label, index) => (
                    <li key={label}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                        <span className="flex items-center gap-2">
                          <span className="size-2.5 rounded-full" style={{ backgroundColor: CLASSES[label].tone }} aria-hidden />
                          {CLASSES[label].name}
                          {label === selected.label ? <span className="text-xs text-muted-foreground">true</span> : null}
                        </span>
                        <span className="tabular-nums text-muted-foreground">{percent.format(readout.scores[index] ?? 0)}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(2, (readout.scores[index] ?? 0) * 100)}%`,
                            backgroundColor: CLASSES[label].tone,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
                <Button type="button" variant="outline" className="!h-11 min-h-11 bg-card px-4" onClick={() => void copyReading()}>
                  {copied ? "Copied" : "Copy reading"}
                </Button>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FilterButton({
  active,
  label,
  onClick,
  dot,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  dot?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm ring-1 ring-foreground/10 ${active ? "bg-primary text-primary-foreground" : "bg-card"}`}
    >
      {dot ? <span className="size-2.5 rounded-full" style={{ backgroundColor: active ? "currentColor" : dot }} aria-hidden /> : null}
      {label}
    </button>
  );
}
