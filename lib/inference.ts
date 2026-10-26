import type { LabelId, Metrics } from "@/lib/types";

type OrtModule = typeof import("onnxruntime-web/wasm");
type InferenceSession = Awaited<ReturnType<OrtModule["InferenceSession"]["create"]>>;

let loading: Promise<InferenceSession> | null = null;

async function runtime(): Promise<OrtModule> {
  return import("onnxruntime-web/wasm");
}

async function loadSession(): Promise<InferenceSession> {
  if (!loading) {
    loading = (async () => {
      const ort = await runtime();
      ort.env.wasm.wasmPaths = `${window.location.origin}/ort/`;
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.proxy = false;
      return ort.InferenceSession.create("/model/brain-tumor.onnx", {
        executionProviders: ["wasm"],
        graphOptimizationLevel: "all",
      });
    })().catch((error: unknown) => {
      loading = null;
      throw error;
    });
  }
  return loading;
}

export function preloadClassifier(): Promise<unknown> {
  return loadSession();
}

function softmax(logits: Float32Array): number[] {
  let max = Number.NEGATIVE_INFINITY;
  for (const value of logits) max = Math.max(max, value);
  const scores = Array.from(logits, (value) => Math.exp(value - max));
  const sum = scores.reduce((total, value) => total + value, 0);
  return scores.map((value) => value / sum);
}

export async function classifyScan(
  tensor: Float32Array,
  metrics: Pick<Metrics, "inputSize" | "labels">,
): Promise<{ label: LabelId; scores: number[] }> {
  const ort = await runtime();
  const session = await loadSession();
  const input = new ort.Tensor("float32", tensor, [1, 3, metrics.inputSize, metrics.inputSize]);
  const feedName = session.inputNames[0] ?? "input";
  const output = await session.run({ [feedName]: input });
  const outputName = session.outputNames[0] ?? "logits";
  const data = output[outputName]?.data;
  if (!(data instanceof Float32Array)) {
    throw new Error("The classifier returned an unexpected result.");
  }
  const logits = data;
  const scores = softmax(logits);
  if (scores.length !== metrics.labels.length) {
    throw new Error("The classifier scores do not match the four labels.");
  }
  let best = 0;
  for (let index = 1; index < scores.length; index += 1) {
    if (scores[index] > scores[best]) best = index;
  }
  return { label: metrics.labels[best], scores };
}

export function resetClassifier(): void {
  loading = null;
}
