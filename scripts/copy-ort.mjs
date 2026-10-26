import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const dist = dirname(require.resolve("onnxruntime-web/ort-wasm-simd-threaded.wasm"));
const dest = join(process.cwd(), "public", "ort");
mkdirSync(dest, { recursive: true });

const files = ["ort-wasm-simd-threaded.wasm", "ort-wasm-simd-threaded.mjs", "ort-wasm-simd-threaded.jspi.wasm", "ort-wasm-simd-threaded.jspi.mjs"];

for (const name of files) {
  copyFileSync(join(dist, name), join(dest, name));
}

console.log(`copied ONNX Runtime Web assets to ${dest}`);
