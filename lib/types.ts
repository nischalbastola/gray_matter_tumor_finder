export const LABELS = ["glioma", "meningioma", "notumor", "pituitary"] as const;

export type LabelId = (typeof LABELS)[number];

export type ClassMetrics = {
  id: LabelId;
  precision: number;
  recall: number;
  f1: number;
  support: number;
};

export type Metrics = {
  placeholder?: boolean;
  accuracy: number;
  macroF1: number;
  testImages: number;
  trainImages?: number;
  valImages?: number;
  valAccuracy: number;
  perClass: ClassMetrics[];
  confusionMatrix: number[][];
  labels: LabelId[];
  inputSize: number;
  mean: number[];
  std: number[];
  architecture: string;
  dataset: string;
  license: string;
};

export type SampleImage = {
  src: string;
  label: LabelId;
  file: string;
};
