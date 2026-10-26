"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CLASSES } from "@/lib/classes";
import { classifyScan, preloadClassifier } from "@/lib/inference";
import { fileToImageData, prepareScan } from "@/lib/preprocess";
import { readingNote } from "@/lib/reading";
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
  const [copied, setCopied] = useState(false);

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
      setCopied(false);
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

  async function copyReading() {
    if (!readout) return;
    const text = readingNote({
      fileName: readout.fileName,
      label: readout.label,
      scores: readout.scores,
      labels: metrics.labels,
      datasetLabel: readout.datasetLabel,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Clipboard is blocked in this browser. Select the reading and copy it manually.");
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-2xl">One axial slice</CardTitle>
          <CardDescription>
            A held-out example, or a JPEG, PNG, or WebP of your own. The file is scored in this browser and is not
            uploaded.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`relative min-h-72 overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10 sm:min-h-96 ${dragging ? "ring-2 ring-primary" : ""}`}
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
              </>
            ) : (
              <div className="flex min-h-72 flex-col items-center justify-center gap-3 px-6 py-16 text-center sm:min-h-96">
                <p className="font-heading text-2xl">Drop an axial brain MRI slice</p>
                <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                  JPEG, PNG, or WebP. The file stays on this device.
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
            <Button type="button" className="!h-11 min-h-11 px-4" disabled={busy || status === "failed"} onClick={() => inputRef.current?.click()}>
              Choose a slice
            </Button>
            {readout ? (
              <Button
                type="button"
                variant="outline"
                className="!h-11 min-h-11 bg-card px-4"
                onClick={() => {
                  if (previewRef.current) URL.revokeObjectURL(previewRef.current);
                  previewRef.current = null;
                  setReadout(null);
                  setError(null);
                  setCopied(false);
                  setStatus("ready");
                }}
              >
                Clear
              </Button>
            ) : null}
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {status === "booting" && "Loading the classifier…"}
              {status === "reading" && "Reading the slice…"}
              {status === "ready" && "Classifier ready."}
              {status === "failed" && bootError}
              {status === "done" && readout && `Showing ${readout.fileName}.`}
            </p>
          </div>
          {error ? (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          {samples.length > 0 ? (
            <div className="mt-5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm text-muted-foreground">A few held-out slices</p>
                <Link href="/test" className="text-sm text-primary underline-offset-4 hover:underline">
                  All {metrics.testImages.toLocaleString("en")} test slices
                </Link>
              </div>
              <ul className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {samples.map((sample) => (
                  <li key={sample.src} className="shrink-0">
                    <button
                      type="button"
                      className="block overflow-hidden rounded-lg bg-card ring-1 ring-foreground/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
        </CardContent>
      </Card>

      <Card className="h-fit" aria-live="polite">
        <CardContent className="flex flex-col gap-4">
          {profile && readout ? (
            <>
              <div>
                <p className="text-sm text-muted-foreground">Model call</p>
                <h2 className="mt-1 font-heading text-4xl">{profile.name}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{profile.summary}</p>
              </div>
              <ul className="flex flex-col gap-3">
                {metrics.labels.map((label, index) => (
                  <li key={label}>
                    <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full" style={{ backgroundColor: CLASSES[label].tone }} aria-hidden />
                        {CLASSES[label].name}
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
              {topScore < 0.6 ? (
                <p className="rounded-lg bg-secondary px-3 py-2 text-sm leading-6">
                  The scores are split. The slice may not look like the training images, or the pattern is ambiguous.
                </p>
              ) : null}
              {readout.grayscaleRatio < 0.72 ? (
                <p className="rounded-lg bg-secondary px-3 py-2 text-sm leading-6">
                  This image is more colorful than a typical MRI export. The four-class call is unreliable on photos,
                  diagrams, and color screenshots.
                </p>
              ) : null}
              {readout.datasetLabel ? (
                <p className="text-sm leading-6">
                  Dataset label: {CLASSES[readout.datasetLabel].name}.{" "}
                  {readout.datasetLabel === readout.label ? "The model call matches that label." : "The model call does not match that label."}
                </p>
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">
                  Uploaded slices have no dataset label here. The bars are the model, not a chart review.
                </p>
              )}
              <Button type="button" variant="outline" className="!h-11 min-h-11 bg-card px-4" onClick={() => void copyReading()}>
                {copied ? "Copied" : "Copy reading"}
              </Button>
            </>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground">Waiting for a slice</p>
              <h2 className="mt-1 font-heading text-3xl">Four scores, one slice</h2>
              <ol className="mt-4 flex flex-col gap-3 text-sm leading-6 text-muted-foreground">
                <li>1. Near-black margins are cropped with the same luminance rule used in training.</li>
                <li>2. The crop is stretched to 160×160 and normalized with ImageNet mean and standard deviation.</li>
                <li>3. MobileNetV3-Small returns a score for glioma, meningioma, pituitary, and no tumor.</li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
