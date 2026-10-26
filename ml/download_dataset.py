#!/usr/bin/env python3
"""Download the Nickparvar brain-tumor MRI dataset.

The canonical release is the Kaggle dataset
masoudnickparvar/brain-tumor-mri-dataset (CC BY 4.0). This script pulls the
public Hugging Face mirror of that release, which does not require a Kaggle
token. Pass --kaggle to use the Kaggle CLI instead when credentials exist.
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "data"
MIRROR = "BJyotibrat/Masoud-Nickparvar-Brain-Tumor-MRI-Dataset"


def from_huggingface(dest: Path) -> None:
    from huggingface_hub import snapshot_download

    snapshot_download(
        repo_id=MIRROR,
        repo_type="dataset",
        local_dir=str(dest),
        allow_patterns=["Training/**", "Testing/**", "README.md"],
    )


def from_kaggle(dest: Path) -> None:
    dest.mkdir(parents=True, exist_ok=True)
    archive = dest / "brain-tumor-mri-dataset.zip"
    subprocess.run(
        [
            "kaggle",
            "datasets",
            "download",
            "-d",
            "masoudnickparvar/brain-tumor-mri-dataset",
            "-p",
            str(dest),
            "--force",
        ],
        check=True,
    )
    shutil.unpack_archive(archive, dest)
    archive.unlink(missing_ok=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--kaggle",
        action="store_true",
        help="Download with the Kaggle CLI (requires ~/.kaggle/kaggle.json).",
    )
    args = parser.parse_args()
    DEST.mkdir(parents=True, exist_ok=True)
    if args.kaggle:
        from_kaggle(DEST)
    else:
        from_huggingface(DEST)
    print(f"dataset ready at {DEST}", file=sys.stderr)


if __name__ == "__main__":
    main()
