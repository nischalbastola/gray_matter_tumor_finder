import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-sm leading-6 text-[var(--muted-foreground)] sm:px-6">
        <p>
          Gray Matter is a research demonstration. It is not a medical device, it is not a diagnosis, and it
          is not a substitute for a radiologist. Do not use it to decide treatment, to rule a tumor in,
          or to rule a tumor out.
        </p>
        <p>
          MRI slices and the classifier trained on them come from the{" "}
          <a
            className="underline decoration-[var(--border)] underline-offset-4 hover:text-[var(--foreground)]"
            href="https://www.kaggle.com/datasets/masoudnickparvar/brain-tumor-mri-dataset"
          >
            Brain Tumor MRI Dataset
          </a>{" "}
          by Masoud Nickparvar,{" "}
          <a
            className="underline decoration-[var(--border)] underline-offset-4 hover:text-[var(--foreground)]"
            href="https://creativecommons.org/licenses/by/4.0/"
          >
            CC BY 4.0
          </a>
          . The training snapshot is{" "}
          <a
            className="underline decoration-[var(--border)] underline-offset-4 hover:text-[var(--foreground)]"
            href="https://doi.org/10.5281/zenodo.12735702"
          >
            Zenodo 10.5281/zenodo.12735702
          </a>
          . Source collections include figshare, SARTAJ, and Br35H.
        </p>
        <p>
          <Link className="underline decoration-[var(--border)] underline-offset-4 hover:text-[var(--foreground)]" href="/method">
            Read the method, the split, and the limits
          </Link>
          .
        </p>
      </div>
    </footer>
  );
}
