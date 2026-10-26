#!/usr/bin/env python3
"""Copy the official Testing folder into public/test-set and write index.json."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

LABELS = ["glioma", "meningioma", "notumor", "pituitary"]
ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "data" / "Testing"
DEST = ROOT / "public" / "test-set"


def main() -> None:
    if not SRC.is_dir():
        raise SystemExit(f"Missing dataset testing folder: {SRC}")
    if DEST.exists():
        shutil.rmtree(DEST)
    images: list[dict[str, str]] = []
    counts: dict[str, int] = {}
    for label in LABELS:
        folder = SRC / label
        files = sorted(path for path in folder.iterdir() if path.suffix.lower() in {".jpg", ".jpeg", ".png"})
        counts[label] = len(files)
        out = DEST / label
        out.mkdir(parents=True)
        for src in files:
            shutil.copy2(src, out / src.name)
            images.append(
                {
                    "src": f"/test-set/{label}/{src.name}",
                    "label": label,
                    "file": src.name,
                }
            )
    payload = {"count": len(images), "counts": counts, "images": images}
    (DEST / "index.json").write_text(json.dumps(payload) + "\n")
    print(f"wrote {payload['count']} slices to {DEST}")


if __name__ == "__main__":
    main()
