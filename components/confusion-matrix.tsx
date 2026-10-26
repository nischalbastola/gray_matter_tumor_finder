import { CLASSES } from "@/lib/classes";
import type { Metrics } from "@/lib/types";

const percent = new Intl.NumberFormat("en", { style: "percent", maximumFractionDigits: 0 });

export function ConfusionMatrix({ metrics }: { metrics: Metrics }) {
  const rows = metrics.confusionMatrix;
  const correct = rows.reduce((sum, row, index) => sum + (row[index] ?? 0), 0);
  const total = rows.reduce((sum, row) => sum + row.reduce((a, b) => a + b, 0), 0);
  const misses = total - correct;
  const offPeak = Math.max(
    1,
    ...rows.flatMap((row, rowIndex) => row.filter((_, columnIndex) => columnIndex !== rowIndex)),
  );

  return (
    <div>
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
        Rows are the dataset label. Columns are the model call. The diagonal is correct:{" "}
        {correct.toLocaleString("en")} of {total.toLocaleString("en")} slices,{" "}
        {percent.format(total ? correct / total : 0)} accuracy. The other {misses.toLocaleString("en")} are misses.
        Color on the diagonal tracks that row’s recall. Color off the diagonal tracks how often that miss happened.
      </p>
      <div className="mt-4 overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
          <caption className="sr-only">
            Confusion matrix for the held-out brain MRI test set. Rows are the dataset label. Columns are the model
            call.
          </caption>
          <thead>
            <tr>
              <th className="sticky left-0 bg-card px-3 py-3 font-medium">True \ Called</th>
              {metrics.labels.map((label) => (
                <th key={label} className="px-3 py-3 font-medium">
                  <span className="inline-flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: CLASSES[label].tone }} aria-hidden />
                    {CLASSES[label].name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => {
              const label = metrics.labels[rowIndex];
              const support = row.reduce((sum, value) => sum + value, 0);
              return (
                <tr key={label} className="border-t border-border">
                  <th className="sticky left-0 bg-card px-3 py-3 text-left font-medium">{CLASSES[label].name}</th>
                  {row.map((value, columnIndex) => {
                    const diagonal = rowIndex === columnIndex;
                    const share = support ? value / support : 0;
                    const strength = diagonal ? 0.14 + share * 0.5 : value === 0 ? 0 : 0.08 + (value / offPeak) * 0.55;
                    const wash = diagonal ? "var(--primary)" : "var(--destructive)";
                    return (
                      <td
                        key={`${label}-${metrics.labels[columnIndex]}`}
                        className={`px-3 py-3 tabular-nums ${diagonal ? "font-semibold" : value > 0 ? "text-destructive" : "text-muted-foreground"}`}
                        style={strength ? { backgroundColor: `color-mix(in oklch, ${wash} ${Math.round(strength * 100)}%, transparent)` } : undefined}
                      >
                        <span className="block">{value.toLocaleString("en")}</span>
                        <span className="block text-xs font-normal text-muted-foreground">{percent.format(share)}</span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
