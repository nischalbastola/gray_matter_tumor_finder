"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CLASSES } from "@/lib/classes";
import { classifyScan, preloadClassifier } from "@/lib/inference";
import { fileToImageData, prepareScan } from "@/lib/preprocess";
import type { LabelId, Metrics, SampleImage } from "@/lib/types";

type Status = "booting" | "ready" | "reading" | "done" | "failed";

type Readout = {
  label: LabelId;
  scores: number[];
  previewUrl: string;
  fileName: string;
  datasetLabel: LabelId | null;
  grayscaleRatio: number;
};

const percent = new Intl.NumberFormat("en", { style: "percent", maximumFractionDigits: 1 });

function accepted(file: File): boolean {
  if (file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp") return true;
  return /\.(jpe?g|png|webp)$/i.test(file.name);
}

export function Scanner({ metrics, samples }: { metrics: Metrics; samples: SampleImage[] }) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const [status, setStatus] = useState<Status>(metrics.placeholder ? "failed" : "booting");
  const [bootError, setBootError] = useState<string | null>(
    metrics.placeholder ? "Classifier weights are not in this build yet." : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [readout, setReadout] = useState<Readout | null>(null);

  useEffect(() => {
    if (metrics.placeholder) return;
    let cancelled = false;
    preloadClassifier()
      .then(() => {
        if (!cancelled) setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setBootError("The classifier did not load in this browser.");
        setStatus("failed");
      });
    return () => {
      cancelled = true;
    };
  }, [metrics.placeholder]);

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  async function runFile(file: File, datasetLabel: LabelId | null) {
    if (!accepted(file)) {
      setError("Use a JPEG, PNG, or WebP export of a single MRI slice.");
      setStatus(readout ? "done" : "ready");
      return;
    }
    if (file.size > 12_000_000) {
      setError("That file is over 12 MB. Export a single slice and try again.");
      setStatus(readout ? "done" : "ready");
      return;
    }
    setError(null);
    setStatus("reading");
    try {
      const image = await fileToImageData(file);
      const prepared = prepareScan(image, metrics);
      const result = await classifyScan(prepared.tensor, metrics);
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      const previewUrl = URL.createObjectURL(file);
      previewRef.current = previewUrl;
      setReadout({
        label: result.label,
        scores: result.scores,
        previewUrl,
        fileName: file.name,
        datasetLabel,
        grayscaleRatio: prepared.grayscaleRatio,
      });
      setStatus("done");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not read that slice.";
      setError(message);
      setStatus(readout ? "done" : "ready");
    }
  }

  async function runSample(sample: SampleImage) {
    setError(null);
    setStatus("reading");
    try {
      const response = await fetch(sample.src);
      if (!response.ok) throw new Error("That example slice did not load.");
      const blob = await response.blob();
      const file = new File([blob], sample.file, { type: blob.type || "image/jpeg" });
      await runFile(file, sample.label);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "That example slice did not load.";
      setError(message);
      setStatus(readout ? "done" : "ready");
    }
  }

  const profile = readout ? CLASSES[readout.label] : null;
  const topScore = readout ? Math.max(...readout.scores) : 0;
  const busy = status === "reading" || status === "booting";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
      <div>
        <div
          className={`film relative min-h-72 overflow-hidden rounded-2xl sm:min-h-96 ${dragging ? "ring-2 ring-[var(--signal)]" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files[0];
            if (file) void runFile(file, null);
          }}
        >
          {readout ? (
            <>
              {/* Blob previews are created in the browser, so next/image cannot optimize them. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={readout.previewUrl}
                alt={
                  profile
                    ? `Brain MRI slice. The model call is ${profile.name}.`
                    : "Brain MRI slice waiting for a model call."
                }
                className="mx-auto max-h-[min(70vh,38rem)] w-full object-contain"
              />
              <div className="pointer-events-none absolute inset-0" aria-hidden>
                <div className="absolute top-0 left-1/2 h-full w-px bg-[var(--signal)]/25" />
                <div className="absolute top-1/2 left-0 h-px w-full bg-[var(--signal)]/25" />
              </div>
            </>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3 px-6 py-16 text-center sm:min-h-96">
              <p className="font-serif text-2xl text-[var(--console-ink)]">Drop an axial brain MRI slice</p>
              <p className="max-w-sm text-sm leading-6 text-[var(--console-muted)]">
                JPEG, PNG, or WebP. The file is classified in this browser and is not uploaded.
              </p>
            </div>
          )}
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            ref={inputRef}
            id={inputId}
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void runFile(file, null);
            }}
          />
          <Button
            type="button"
            className="h-11 min-h-11 bg-[var(--signal)]! px-4 text-[var(--console)]! hover:bg-[var(--signal)]/90"
            disabled={busy || status === "failed"}
            onClick={() => inputRef.current?.click()}
          >
            Choose a slice
          </Button>
          {readout ? (
            <Button
              type="button"
              variant="outline"
              className="h-11 min-h-11 border-white/20 bg-transparent px-4 text-[var(--console-ink)] hover:bg-white/10 hover:text-[var(--console-ink)]"
              onClick={() => {
                if (previewRef.current) URL.revokeObjectURL(previewRef.current);
                previewRef.current = null;
                setReadout(null);
                setError(null);
                setStatus("ready");
              }}
            >
              Clear
            </Button>
          ) : null}
          <p className="text-sm text-[var(--console-muted)]" aria-live="polite">
            {status === "booting" && "Loading the classifier…"}
            {status === "reading" && "Reading the slice…"}
            {status === "ready" && "Classifier ready."}
            {status === "failed" && bootError}
            {status === "done" && readout && `Showing ${readout.fileName}.`}
          </p>
        </div>
        {error ? (
          <p className="mt-3 text-sm text-[#ffb4a2]" role="alert">
            {error}
          </p>
        ) : null}
        {samples.length > 0 ? (
          <div className="mt-5">
            <p className="text-xs tracking-[0.14em] text-[var(--console-muted)] uppercase">Held-out test slices</p>
            <ul className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {samples.map((sample) => (
                <li key={sample.src} className="shrink-0">
                  <button
                    type="button"
                    className="block overflow-hidden rounded-lg ring-1 ring-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--signal)]"
                    onClick={() => void runSample(sample)}
                    aria-label={`Classify a held-out ${CLASSES[sample.label].name} slice`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sample.src} alt="" width={96} height={96} className="size-16 object-cover sm:size-20" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <aside className="rounded-2xl border border-white/10 bg-black/25 p-4 sm:p-5" aria-live="polite">
        {profile && readout ? (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs tracking-[0.14em] text-[var(--console-muted)] uppercase">Model call</p>
              <h2 className="mt-1 text-4xl text-[var(--console-ink)]">{profile.name}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--console-muted)]">{profile.summary}</p>
            </div>
            <ul className="flex flex-col gap-3">
              {metrics.labels.map((label, index) => (
                <li key={label} className={`meter-${label}`}>
                  <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                    <span>{CLASSES[label].name}</span>
                    <span className="tabular-nums text-[var(--console-muted)]">{percent.format(readout.scores[index] ?? 0)}</span>
                  </div>
                  <Progress value={(readout.scores[index] ?? 0) * 100} aria-label={`${CLASSES[label].name} score`} />
                </li>
              ))}
            </ul>
            {topScore < 0.6 ? (
              <p className="text-sm leading-6 text-[var(--signal)]">
                The scores are split. The slice may not look like the training images, or the pattern is ambiguous.
              </p>
            ) : null}
            {readout.grayscaleRatio < 0.72 ? (
              <p className="text-sm leading-6 text-[var(--signal)]">
                This image is more colorful than a typical MRI export. The four-class call is unreliable on photos,
                diagrams, and color screenshots.
              </p>
            ) : null}
            {readout.datasetLabel ? (
              <p className="text-sm leading-6 text-[var(--console-ink)]">
                Dataset label: {CLASSES[readout.datasetLabel].name}.
                {readout.datasetLabel === readout.label
                  ? " The model call matches that label."
                  : " The model call does not match that label."}
              </p>
            ) : (
              <p className="text-sm leading-6 text-[var(--console-muted)]">
                Uploaded slices have no dataset label here. The bar chart is the model, not a chart review.
              </p>
            )}
          </div>
        ) : (
          <div>
            <p className="text-xs tracking-[0.14em] text-[var(--console-muted)] uppercase">Waiting for a slice</p>
            <h2 className="mt-1 text-3xl">Four scores, one slice</h2>
            <ol className="mt-4 flex flex-col gap-3 text-sm leading-6 text-[var(--console-muted)]">
              <li>1. Near-black margins are cropped with the same luminance rule used in training.</li>
              <li>2. The crop is stretched to 160×160 and normalized with ImageNet mean and standard deviation.</li>
              <li>3. MobileNetV3-Small returns a score for glioma, meningioma, pituitary, and no tumor.</li>
            </ol>
          </div>
        )}
      </aside>
    </div>
  );
}
