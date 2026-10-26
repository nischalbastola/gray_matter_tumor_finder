import { ConfusionMatrix } from "@/components/confusion-matrix";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CLASSES } from "@/lib/classes";
import type { Metrics } from "@/lib/types";

const percent = new Intl.NumberFormat("en", { style: "percent", maximumFractionDigits: 1 });

export function MetricsPanel({ metrics }: { metrics: Metrics }) {
  if (metrics.placeholder) {
    return (
      <p className="text-base leading-7">
        Held-out numbers publish with the trained weights. Until then, this page does not invent an accuracy.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Test accuracy</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl tabular-nums">{percent.format(metrics.accuracy)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Macro F1</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl tabular-nums">{percent.format(metrics.macroF1)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Test slices</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl tabular-nums">{metrics.testImages.toLocaleString("en")}</CardContent>
        </Card>
      </div>
      <ConfusionMatrix metrics={metrics} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
          <caption className="sr-only">Precision, recall, and F1 for each class on the test set.</caption>
          <thead>
            <tr>
              <th className="border-b border-[var(--border)] py-2 pr-3 font-medium">Class</th>
              <th className="border-b border-[var(--border)] px-2 py-2 font-medium">Precision</th>
              <th className="border-b border-[var(--border)] px-2 py-2 font-medium">Recall</th>
              <th className="border-b border-[var(--border)] px-2 py-2 font-medium">F1</th>
              <th className="border-b border-[var(--border)] px-2 py-2 font-medium">Support</th>
            </tr>
          </thead>
          <tbody>
            {metrics.perClass.map((row) => (
              <tr key={row.id}>
                <th className="py-2 pr-3 font-medium">{CLASSES[row.id].name}</th>
                <td className="px-2 py-2 tabular-nums">{percent.format(row.precision)}</td>
                <td className="px-2 py-2 tabular-nums">{percent.format(row.recall)}</td>
                <td className="px-2 py-2 tabular-nums">{percent.format(row.f1)}</td>
                <td className="px-2 py-2 tabular-nums">{row.support}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
