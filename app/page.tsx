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
      name: "Gray Matter",
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

const percent = new Intl.NumberFormat("en", { style: "percent", maximumFractionDigits: 1 });

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-8 sm:px-6 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="mb-8 flex flex-col gap-6 sm:mb-10">
        <div className="max-w-3xl">
          <h1 className="font-heading text-4xl leading-[1.05] tracking-tight sm:text-6xl">
            Read one MRI slice. See which of the four labels it resembles.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/80 sm:text-lg">
            Gray Matter scores glioma, meningioma, pituitary, or no tumor with a MobileNetV3-Small network trained on the
            Nickparvar Brain Tumor MRI Dataset. The score is computed in your browser. It does not diagnose a patient.
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Fact term="Held-out accuracy" detail={percent.format(metrics.accuracy)} />
          <Fact term="Macro F1" detail={percent.format(metrics.macroF1)} />
          <Fact term="Test slices" detail={metrics.testImages.toLocaleString("en")} />
          <Fact term="Labels" detail="4" />
        </dl>
      </header>

      <section aria-labelledby="lab-heading" className="flex flex-col gap-4">
        <div>
          <h2 id="lab-heading" className="font-heading text-3xl tracking-tight sm:text-4xl">
            The reader
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Weights stay in the page. A slice you drop here is not sent to a server.
          </p>
        </div>
        <Scanner metrics={metrics} samples={samples} />
      </section>

      <section aria-labelledby="classes-heading" className="mt-14 border-t border-border pt-10 sm:mt-20">
        <h2 id="classes-heading" className="font-heading text-3xl tracking-tight sm:text-4xl">
          What the four labels mean
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
          These are teaching notes for the classes in the dataset, not imaging criteria you should apply to a patient.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {CLASS_LIST.map((item) => (
            <Card key={item.id} id={item.id}>
              <CardHeader>
                <p className="text-xs tracking-[0.14em] uppercase" style={{ color: item.tone }}>
                  {item.short}
                </p>
                <CardTitle className="font-heading text-2xl">
                  <h3>{item.name}</h3>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-base leading-7 text-muted-foreground">{item.detail}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="metrics-heading" className="mt-14 border-t border-border pt-10 sm:mt-20">
        <h2 id="metrics-heading" className="font-heading text-3xl tracking-tight sm:text-4xl">
          Held-out test performance
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
          The Testing folder was not used to train or to pick the checkpoint. These figures describe that folder only.
          They are not a promise about the next scanner, hospital, or patient.
        </p>
        <div className="mt-6">
          <MetricsPanel metrics={metrics} />
        </div>
      </section>

      <section aria-labelledby="faq-heading" className="mt-14 border-t border-border pt-10 sm:mt-20">
        <h2 id="faq-heading" className="font-heading text-3xl tracking-tight sm:text-4xl">
          Questions worth asking first
        </h2>
        <div className="mt-6 max-w-3xl">
          <FaqList />
        </div>
      </section>
    </div>
  );
}

function Fact({ term, detail }: { term: string; detail: string }) {
  return (
    <div className="rounded-xl bg-card px-3 py-3 ring-1 ring-foreground/10">
      <dt className="text-xs text-muted-foreground">{term}</dt>
      <dd className="font-heading text-xl leading-tight sm:text-2xl">{detail}</dd>
    </div>
  );
}
