import { CLASSES } from "@/lib/classes";
import type { LabelId } from "@/lib/types";

const percent = new Intl.NumberFormat("en", { style: "percent", maximumFractionDigits: 1 });

export function readingNote(input: {
  fileName: string;
  label: LabelId;
  scores: number[];
  labels: LabelId[];
  datasetLabel: LabelId | null;
}): string {
  const lines = [
    "Gray Matter slice reading",
    `File: ${input.fileName}`,
    `Call: ${CLASSES[input.label].name} (${percent.format(Math.max(...input.scores))})`,
  ];
  input.labels.forEach((label, index) => {
    lines.push(`${CLASSES[label].name}: ${percent.format(input.scores[index] ?? 0)}`);
  });
  if (input.datasetLabel) {
    const match = input.datasetLabel === input.label ? "matches the call" : "does not match the call";
    lines.push(`Dataset label: ${CLASSES[input.datasetLabel].name} (${match}).`);
  } else {
    lines.push("No dataset label. This note is the model, not a chart review.");
  }
  lines.push("Research demo. Not a diagnosis. The slice was scored in the browser and was not uploaded.");
  return lines.join("\n");
}
