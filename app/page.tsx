import { FaqList, FAQS } from "@/components/faq";
import { MetricsPanel } from "@/components/metrics-panel";
import { Scanner } from "@/components/scanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CLASS_LIST } from "@/lib/classes";
import metricsJson from "@/lib/metrics.json";
import samplesJson from "@/lib/samples.json";
import { siteUrl } from "@/lib/site";
import type { Metrics, SampleImage } from "@/lib/types";

const metrics = metricsJson as Metrics;
const samples = samplesJson as SampleImage[];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Nidus",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      url: siteUrl(),
      isAccessibleForFree: true,
      description:
        "Browser-based research classifier for brain MRI slices. Labels are glioma, meningioma, pituitary tumor, and no tumor. Not a medical device.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQS.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="console">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <p className="text-xs tracking-[0.16em] text-[var(--signal)] uppercase">Axial brain MRI · four labels</p>
          <h1 className="mt-2 max-w-3xl text-4xl leading-tight text-[var(--console-ink)] sm:text-6xl">
            A slice-level call for glioma, meningioma, pituitary, or no tumor.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--console-muted)] sm:text-lg">
            Nidus scores one MRI image with a MobileNetV3-Small network trained on the Nickparvar Brain Tumor MRI
            Dataset. It runs entirely in your browser. It does not diagnose a patient.
          </p>
          <div className="mt-8">
            <Scanner metrics={metrics} samples={samples} />
          </div>
        </div>
      </section>

      <div className="paper">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-14 sm:px-6 sm:py-20">
          <section aria-labelledby="classes-heading">
            <h2 id="classes-heading" className="text-3xl sm:text-4xl">
              What the four labels mean
            </h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted-foreground)]">
              These are teaching notes for the classes in the dataset, not imaging criteria you should apply to a
              patient.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {CLASS_LIST.map((item) => (
                <Card key={item.id} id={item.id}>
                  <CardHeader>
                    <p className="text-xs tracking-[0.14em] uppercase" style={{ color: item.tone }}>
                      {item.short}
                    </p>
                    <CardTitle className="text-2xl">
                      <h3>{item.name}</h3>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-base leading-7 text-[var(--muted-foreground)]">{item.detail}</CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section aria-labelledby="metrics-heading">
            <h2 id="metrics-heading" className="text-3xl sm:text-4xl">
              Held-out test performance
            </h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted-foreground)]">
              The Testing folder was not used to train or to pick the checkpoint. These figures describe that folder
              only. They are not a promise about the next scanner, hospital, or patient.
            </p>
            <div className="mt-6">
              <MetricsPanel metrics={metrics} />
            </div>
          </section>

          <section aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="text-3xl sm:text-4xl">
              Questions worth asking first
            </h2>
            <div className="mt-6 max-w-3xl">
              <FaqList />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
