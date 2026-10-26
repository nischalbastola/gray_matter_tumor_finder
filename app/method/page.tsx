import type { Metadata } from "next";
import Link from "next/link";
import metricsJson from "@/lib/metrics.json";
import type { Metrics } from "@/lib/types";

const metrics = metricsJson as Metrics;

export const metadata: Metadata = {
  title: "Method",
  description:
    "How Nidus trains and evaluates a four-class brain MRI classifier on the Nickparvar dataset: crop, MobileNetV3-Small, a sealed test split, and the limits of a slice-level model.",
  alternates: { canonical: "/method" },
  openGraph: {
    title: "Method · Nidus",
    description:
      "Training protocol, preprocessing, and limits for the Nidus brain MRI tumor classifier.",
    url: "/method",
  },
};

export default function MethodPage() {
  return (
    <article className="paper">
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs tracking-[0.16em] text-[var(--muted-foreground)] uppercase">Model card</p>
        <h1 className="mt-2 text-4xl sm:text-5xl">How this classifier was built</h1>
        <p className="mt-4 text-lg leading-8">
          Nidus is a slice classifier, not a radiology workstation. One JPEG goes in. Four scores come out. This page
          is the protocol behind those scores.
        </p>

        <h2 className="mt-12 text-3xl">Dataset</h2>
        <p className="mt-3 text-base leading-7 text-[var(--muted-foreground)]">
          Images come from the Brain Tumor MRI Dataset published by Masoud Nickparvar on Kaggle
          (masoudnickparvar/brain-tumor-mri-dataset, CC BY 4.0). The weights in this app were fit on the public Zenodo
          archive of that dataset, DOI{" "}
          <a className="underline underline-offset-4" href="https://doi.org/10.5281/zenodo.12735702">
            10.5281/zenodo.12735702
          </a>
          . Classes are glioma, meningioma, pituitary, and no tumor. Nickparvar assembled the set from figshare, the
          SARTAJ collection, and Br35H, and replaced unreliable glioma labels from SARTAJ with figshare glioma images.
        </p>
        <p className="mt-3 text-base leading-7 text-[var(--muted-foreground)]">
          {metrics.placeholder || metrics.trainImages == null ? (
            "Image counts are written into the model card when training finishes."
          ) : (
            <>
              This run used {metrics.trainImages.toLocaleString("en")} training images,{" "}
              {metrics.valImages?.toLocaleString("en")} validation images drawn from the Training folder, and{" "}
              {metrics.testImages.toLocaleString("en")} images from the official Testing folder.
            </>
          )}
        </p>

        <h2 className="mt-12 text-3xl">Preprocessing</h2>
        <p className="mt-3 text-base leading-7 text-[var(--muted-foreground)]">
          Slices in the dataset have different dimensions and a dark border. Training and the browser use the same
          rule: convert to RGB, mark pixels whose luma (0.299R + 0.587G + 0.114B) is above 15, crop to that bounding
          box, then stretch to 160×160 with bilinear resampling. Pixels are scaled to 0–1 and normalized with ImageNet
          mean (0.485, 0.456, 0.406) and standard deviation (0.229, 0.224, 0.225), because the backbone starts from
          ImageNet weights.
        </p>
        <p className="mt-3 text-base leading-7 text-[var(--muted-foreground)]">
          Training augmentation is a horizontal flip, a rotation within 12 degrees, and mild brightness and contrast
          jitter. The browser does not augment. It only crops, resizes, and normalizes.
        </p>

        <h2 className="mt-12 text-3xl">Network and selection</h2>
        <p className="mt-3 text-base leading-7 text-[var(--muted-foreground)]">
          The architecture is torchvision MobileNetV3-Small with the final linear layer replaced by four outputs. The
          first phase trains the classifier head while the convolutional trunk stays frozen. The second phase
          fine-tunes the whole network with a lower learning rate on the trunk. Loss is cross-entropy with label
          smoothing of 0.05. The checkpoint with the highest validation accuracy is the one exported to ONNX opset 17
          and checked against PyTorch before it is published.
        </p>

        <h2 className="mt-12 text-3xl">What the test number is</h2>
        <p className="mt-3 text-base leading-7 text-[var(--muted-foreground)]">
          The Testing directory is scored after the checkpoint is chosen. It does not guide early stopping. A high
          number on that split still means “this model separates these four folders.” It does not mean the model has
          seen your scanner, your protocol, or your patients. There is no external hospital cohort here.
        </p>

        <h2 className="mt-12 text-3xl">Limits you should assume</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-7 text-[var(--muted-foreground)]">
          <li>One axial slice cannot stand in for a multi-sequence study.</li>
          <li>Every image is forced into one of four labels, including images that are not brain MRIs.</li>
          <li>No tumor is the absence of the three tumor patterns, not a normal examination.</li>
          <li>Left-right flips during training ignore the fact that anatomy has a side.</li>
          <li>JPEG compression and screen photos change pixels the model never learned as a separate domain.</li>
        </ul>

        <h2 className="mt-12 text-3xl">Citation</h2>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-[var(--console)] p-4 text-xs leading-5 text-[var(--console-ink)]">
          <code>{`@misc{nickparvar_brain_tumor_mri,
  author = {Nickparvar, Masoud},
  title = {Brain Tumor MRI Dataset},
  year = {2021},
  publisher = {Kaggle},
  url = {https://www.kaggle.com/datasets/masoudnickparvar/brain-tumor-mri-dataset},
  note = {CC BY 4.0. Training snapshot: doi:10.5281/zenodo.12735702}
}`}</code>
        </pre>
        <p className="mt-8 text-base leading-7">
          <Link className="underline underline-offset-4" href="/">
            Back to the reader
          </Link>
        </p>
      </div>
    </article>
  );
}
