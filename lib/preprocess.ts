import type { Metrics } from "@/lib/types";

const LUM_THRESHOLD = 15;

export type PreparedScan = {
  tensor: Float32Array;
  preview: ImageData;
  grayscaleRatio: number;
  width: number;
  height: number;
};

function luminance(data: Uint8ClampedArray, index: number): number {
  return 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];
}

export function cropMargins(source: ImageData): ImageData {
  const { data, width, height } = source;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let count = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      if (luminance(data, index) > LUM_THRESHOLD) {
        count += 1;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (count < 50 || maxX - minX < 8 || maxY - minY < 8) return source;

  const cropWidth = maxX - minX + 1;
  const cropHeight = maxY - minY + 1;
  const canvas = document.createElement("canvas");
  canvas.width = cropWidth;
  canvas.height = cropHeight;
  const context = canvas.getContext("2d");
  if (!context) return source;
  const cropped = context.createImageData(cropWidth, cropHeight);
  for (let y = 0; y < cropHeight; y += 1) {
    const sourceStart = ((y + minY) * width + minX) * 4;
    cropped.data.set(data.subarray(sourceStart, sourceStart + cropWidth * 4), y * cropWidth * 4);
  }
  return cropped;
}

function grayscaleRatio(image: ImageData): number {
  const { data } = image;
  let gray = 0;
  const pixels = image.width * image.height;
  const step = pixels > 250_000 ? 4 : 1;
  let seen = 0;
  for (let index = 0; index < data.length; index += 4 * step) {
    const spread =
      Math.max(data[index], data[index + 1], data[index + 2]) -
      Math.min(data[index], data[index + 1], data[index + 2]);
    if (spread < 18) gray += 1;
    seen += 1;
  }
  return seen === 0 ? 0 : gray / seen;
}

export function prepareScan(image: ImageData, metrics: Pick<Metrics, "inputSize" | "mean" | "std">): PreparedScan {
  const cropped = cropMargins(image);
  const size = metrics.inputSize;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare the scan.");

  const source = document.createElement("canvas");
  source.width = cropped.width;
  source.height = cropped.height;
  const sourceContext = source.getContext("2d");
  if (!sourceContext) throw new Error("Could not prepare the scan.");
  sourceContext.putImageData(cropped, 0, 0);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, size, size);
  const preview = context.getImageData(0, 0, size, size);
  const tensor = new Float32Array(3 * size * size);
  const plane = size * size;

  for (let pixel = 0; pixel < plane; pixel += 1) {
    const offset = pixel * 4;
    const red = preview.data[offset] / 255;
    const green = preview.data[offset + 1] / 255;
    const blue = preview.data[offset + 2] / 255;
    tensor[pixel] = (red - metrics.mean[0]) / metrics.std[0];
    tensor[plane + pixel] = (green - metrics.mean[1]) / metrics.std[1];
    tensor[plane * 2 + pixel] = (blue - metrics.mean[2]) / metrics.std[2];
  }

  return {
    tensor,
    preview,
    grayscaleRatio: grayscaleRatio(cropped),
    width: cropped.width,
    height: cropped.height,
  };
}

export async function fileToImageData(file: Blob): Promise<ImageData> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not read that image.");
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  return context.getImageData(0, 0, canvas.width, canvas.height);
}
