#!/usr/bin/env python3
"""Train a MobileNetV3-Small classifier on the Nickparvar brain-tumor MRI set.

The dataset is the public Kaggle collection by Masoud Nickparvar
(CC BY 4.0): glioma, meningioma, pituitary, and no tumor.

Preprocessing matches the browser: crop near-black margins, stretch to
160x160, then ImageNet normalization. The held-out Testing split is
touched only after training, for the published metrics.
"""

from __future__ import annotations

import json
import random
import time
from collections import defaultdict
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from PIL import Image, ImageEnhance
from torch.utils.data import DataLoader, Dataset
from torchvision import models

ROOT = Path(__file__).resolve().parents[1]
DATA_ROOT = ROOT / "data"
ARTIFACTS = ROOT / "ml" / "artifacts"
PUBLIC_MODEL = ROOT / "public" / "model"

LABELS = ["glioma", "meningioma", "notumor", "pituitary"]
LABEL_TO_INDEX = {name: i for i, name in enumerate(LABELS)}
IMG_SIZE = 160
MEAN = (0.485, 0.456, 0.406)
STD = (0.229, 0.224, 0.225)
SEED = 7
LUM_THRESHOLD = 15


def find_split(root: Path, split: str) -> Path:
    candidates = [path for path in root.rglob(split) if path.is_dir()]
    for path in candidates:
        children = {child.name.lower() for child in path.iterdir() if child.is_dir()}
        if "glioma" in children and ("notumor" in children or "no_tumor" in children):
            return path
    raise SystemExit(f"Could not find a {split} directory with class folders under {root}")


def class_dir_name(folder: Path) -> str | None:
    name = folder.name.lower().replace(" ", "").replace("_", "")
    aliases = {
        "glioma": "glioma",
        "meningioma": "meningioma",
        "pituitary": "pituitary",
        "pituitarytumor": "pituitary",
        "notumor": "notumor",
        "notumour": "notumor",
        "healthy": "notumor",
    }
    return aliases.get(name)


def list_images(split_dir: Path) -> list[tuple[Path, int]]:
    samples: list[tuple[Path, int]] = []
    for folder in sorted(path for path in split_dir.iterdir() if path.is_dir()):
        label_name = class_dir_name(folder)
        if label_name is None:
            continue
        label = LABEL_TO_INDEX[label_name]
        for path in folder.rglob("*"):
            if path.suffix.lower() in {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff"}:
                samples.append((path, label))
    if not samples:
        raise SystemExit(f"No images found in {split_dir}")
    return samples


def crop_margins(image: Image.Image) -> Image.Image:
    """Drop the near-black border. Same luminance rule as the browser."""
    rgb = np.asarray(image)
    if rgb.ndim != 3 or rgb.shape[2] < 3:
        return image
    red = rgb[:, :, 0].astype(np.float32)
    green = rgb[:, :, 1].astype(np.float32)
    blue = rgb[:, :, 2].astype(np.float32)
    luma = 0.299 * red + 0.587 * green + 0.114 * blue
    mask = luma > LUM_THRESHOLD
    if int(mask.sum()) < 50:
        return image
    rows = np.where(mask.any(axis=1))[0]
    cols = np.where(mask.any(axis=0))[0]
    top, bottom = int(rows[0]), int(rows[-1]) + 1
    left, right = int(cols[0]), int(cols[-1]) + 1
    if bottom - top < 8 or right - left < 8:
        return image
    return image.crop((left, top, right, bottom))


def prepare(path: Path) -> Image.Image:
    with Image.open(path) as handle:
        image = handle.convert("RGB")
    image = crop_margins(image)
    return image.resize((IMG_SIZE, IMG_SIZE), Image.Resampling.BILINEAR)


class MemoryMri(Dataset):
    def __init__(self, images: list[Image.Image], labels: list[int], train: bool):
        self.images = images
        self.labels = labels
        self.train = train

    def __len__(self) -> int:
        return len(self.images)

    def __getitem__(self, index: int):
        image = self.images[index]
        if self.train:
            if random.random() < 0.5:
                image = image.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
            angle = random.uniform(-12, 12)
            image = image.rotate(angle, resample=Image.Resampling.BILINEAR, fillcolor=(0, 0, 0))
            image = ImageEnhance.Brightness(image).enhance(random.uniform(0.88, 1.12))
            image = ImageEnhance.Contrast(image).enhance(random.uniform(0.88, 1.12))
        array = np.asarray(image).astype(np.float32) / 255.0
        tensor = torch.from_numpy(array).permute(2, 0, 1).contiguous()
        mean = torch.tensor(MEAN).view(3, 1, 1)
        std = torch.tensor(STD).view(3, 1, 1)
        tensor = (tensor - mean) / std
        return tensor, self.labels[index]


def stratified_split(
    samples: list[tuple[Path, int]], val_ratio: float = 0.1
) -> tuple[list[tuple[Path, int]], list[tuple[Path, int]]]:
    grouped: dict[int, list[tuple[Path, int]]] = defaultdict(list)
    for sample in samples:
        grouped[sample[1]].append(sample)
    train: list[tuple[Path, int]] = []
    val: list[tuple[Path, int]] = []
    rng = random.Random(SEED)
    for label in sorted(grouped):
        items = grouped[label][:]
        rng.shuffle(items)
        cut = max(1, int(round(len(items) * val_ratio)))
        val.extend(items[:cut])
        train.extend(items[cut:])
    rng.shuffle(train)
    rng.shuffle(val)
    return train, val


def load_split(samples: list[tuple[Path, int]]) -> tuple[list[Image.Image], list[int]]:
    images: list[Image.Image] = []
    labels: list[int] = []
    for index, (path, label) in enumerate(samples, start=1):
        images.append(prepare(path))
        labels.append(label)
        if index % 400 == 0 or index == len(samples):
            print(f"  cached {index}/{len(samples)}", flush=True)
    return images, labels


def build_model() -> nn.Module:
    weights = models.MobileNet_V3_Small_Weights.DEFAULT
    model = models.mobilenet_v3_small(weights=weights)
    in_features = model.classifier[-1].in_features
    model.classifier[-1] = nn.Linear(in_features, len(LABELS))
    return model


def run_epoch(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    optimizer: torch.optim.Optimizer | None,
    tag: str,
) -> tuple[float, float]:
    training = optimizer is not None
    model.train(training)
    total_loss = 0.0
    correct = 0
    seen = 0
    total = len(loader)
    for step, (images, labels) in enumerate(loader, start=1):
        images = images.contiguous(memory_format=torch.channels_last)
        if training and optimizer is not None:
            optimizer.zero_grad(set_to_none=True)
        with torch.set_grad_enabled(training):
            logits = model(images)
            loss = criterion(logits, labels)
            if training and optimizer is not None:
                loss.backward()
                optimizer.step()
        batch = labels.size(0)
        total_loss += loss.item() * batch
        correct += (logits.argmax(dim=1) == labels).sum().item()
        seen += batch
        if step == 1 or step % 25 == 0 or step == total:
            print(
                f"  {tag} {step}/{total} acc={correct / max(seen, 1):.3f}",
                flush=True,
            )
    return total_loss / max(seen, 1), correct / max(seen, 1)


@torch.no_grad()
def predict_all(model: nn.Module, loader: DataLoader) -> tuple[np.ndarray, np.ndarray]:
    model.eval()
    truths: list[int] = []
    preds: list[int] = []
    for images, labels in loader:
        logits = model(images)
        truths.extend(labels.tolist())
        preds.extend(logits.argmax(dim=1).tolist())
    return np.asarray(truths), np.asarray(preds)


def classification_stats(truth: np.ndarray, pred: np.ndarray) -> dict:
    matrix = np.zeros((len(LABELS), len(LABELS)), dtype=int)
    for actual, guessed in zip(truth, pred):
        matrix[int(actual), int(guessed)] += 1
    per_class = []
    f1s = []
    for index, name in enumerate(LABELS):
        support = int(matrix[index].sum())
        predicted = int(matrix[:, index].sum())
        hit = int(matrix[index, index])
        precision = hit / predicted if predicted else 0.0
        recall = hit / support if support else 0.0
        f1 = (2 * precision * recall / (precision + recall)) if precision + recall else 0.0
        f1s.append(f1)
        per_class.append(
            {
                "id": name,
                "precision": round(precision, 4),
                "recall": round(recall, 4),
                "f1": round(f1, 4),
                "support": support,
            }
        )
    accuracy = float((truth == pred).mean()) if len(truth) else 0.0
    return {
        "accuracy": round(accuracy, 4),
        "macroF1": round(float(np.mean(f1s)), 4),
        "testImages": int(len(truth)),
        "perClass": per_class,
        "confusionMatrix": matrix.tolist(),
        "labels": LABELS,
        "inputSize": IMG_SIZE,
        "mean": list(MEAN),
        "std": list(STD),
        "architecture": "mobilenet_v3_small",
        "dataset": "masoudnickparvar/brain-tumor-mri-dataset",
        "license": "CC BY 4.0",
    }


def export_onnx(model: nn.Module, path: Path) -> None:
    model.eval()
    dummy = torch.randn(1, 3, IMG_SIZE, IMG_SIZE)
    path.parent.mkdir(parents=True, exist_ok=True)
    try:
        torch.onnx.export(
            model,
            dummy,
            str(path),
            input_names=["input"],
            output_names=["logits"],
            opset_version=17,
            dynamo=False,
        )
    except TypeError:
        torch.onnx.export(
            model,
            dummy,
            str(path),
            input_names=["input"],
            output_names=["logits"],
            opset_version=17,
        )


def verify_onnx(model: nn.Module, path: Path) -> None:
    import onnxruntime as ort

    model.eval()
    dummy = torch.randn(1, 3, IMG_SIZE, IMG_SIZE)
    with torch.no_grad():
        reference = model(dummy).detach().cpu().numpy()
    session = ort.InferenceSession(str(path), providers=["CPUExecutionProvider"])
    exported = session.run(["logits"], {"input": dummy.numpy()})[0]
    delta = float(np.max(np.abs(reference - exported)))
    print(f"onnx max abs delta {delta:.6f}", flush=True)
    if delta > 1e-3:
        raise SystemExit(f"ONNX export drifted from PyTorch by {delta}")


@torch.no_grad()
def export_gallery(model: nn.Module, loader: DataLoader, paths: list[Path]) -> None:
    model.eval()
    probabilities: list[torch.Tensor] = []
    truths: list[int] = []
    for images, labels in loader:
        images = images.contiguous(memory_format=torch.channels_last)
        logits = model(images)
        probabilities.append(torch.softmax(logits, dim=1).cpu())
        truths.extend(int(label) for label in labels.tolist())
    stacked = torch.cat(probabilities)
    if stacked.shape[0] != len(paths):
        raise SystemExit("Gallery export saw a different number of images than the test list")

    samples_dir = ROOT / "public" / "samples"
    samples_dir.mkdir(parents=True, exist_ok=True)
    for stale in samples_dir.iterdir():
        if stale.is_file():
            stale.unlink()

    manifest = []
    for label, name in enumerate(LABELS):
        ranked: list[tuple[float, Path]] = []
        for index, path in enumerate(paths):
            if truths[index] != label:
                continue
            if int(stacked[index].argmax()) != label:
                continue
            ranked.append((float(stacked[index, label]), path))
        ranked.sort(key=lambda item: item[0], reverse=True)
        for rank, (confidence, path) in enumerate(ranked[:2], start=1):
            filename = f"{name}-{rank}.jpg"
            destination = samples_dir / filename
            if path.suffix.lower() in {".jpg", ".jpeg"}:
                destination.write_bytes(path.read_bytes())
            else:
                with Image.open(path) as image:
                    image.convert("RGB").save(destination, format="JPEG", quality=92)
            manifest.append(
                {
                    "src": f"/samples/{filename}",
                    "label": name,
                    "file": path.name,
                }
            )
            print(f"sample {filename} confidence={confidence:.3f}", flush=True)

    text = json.dumps(manifest, indent=2)
    (samples_dir / "manifest.json").write_text(text)
    (ROOT / "lib").mkdir(parents=True, exist_ok=True)
    (ROOT / "lib" / "samples.json").write_text(text)


def main() -> None:
    random.seed(SEED)
    np.random.seed(SEED)
    torch.manual_seed(SEED)
    torch.set_num_threads(4)

    train_dir = find_split(DATA_ROOT, "Training")
    test_dir = find_split(DATA_ROOT, "Testing")
    print(f"training dir: {train_dir}", flush=True)
    print(f"testing dir:  {test_dir}", flush=True)

    train_all = list_images(train_dir)
    test_samples = list_images(test_dir)
    test_paths = [path for path, _label in test_samples]
    train_samples, val_samples = stratified_split(train_all)
    print(
        f"images train={len(train_samples)} val={len(val_samples)} test={len(test_samples)}",
        flush=True,
    )

    print("caching images", flush=True)
    train_images, train_labels = load_split(train_samples)
    val_images, val_labels = load_split(val_samples)
    test_images, test_labels = load_split(test_samples)

    train_loader = DataLoader(
        MemoryMri(train_images, train_labels, train=True),
        batch_size=32,
        shuffle=True,
        num_workers=0,
    )
    val_loader = DataLoader(
        MemoryMri(val_images, val_labels, train=False),
        batch_size=64,
        shuffle=False,
        num_workers=0,
    )
    test_loader = DataLoader(
        MemoryMri(test_images, test_labels, train=False),
        batch_size=64,
        shuffle=False,
        num_workers=0,
    )

    model = build_model().to(memory_format=torch.channels_last)
    criterion = nn.CrossEntropyLoss(label_smoothing=0.05)

    for parameter in model.features.parameters():
        parameter.requires_grad = False
    head = [parameter for parameter in model.parameters() if parameter.requires_grad]
    optimizer = torch.optim.AdamW(head, lr=1e-3, weight_decay=1e-4)

    best_state = None
    best_val = -1.0
    ARTIFACTS.mkdir(parents=True, exist_ok=True)

    print("phase 1: classifier head", flush=True)
    for epoch in range(1, 4):
        started = time.time()
        train_loss, train_acc = run_epoch(model, train_loader, criterion, optimizer, f"head{epoch}")
        val_loss, val_acc = run_epoch(model, val_loader, criterion, None, f"val{epoch}")
        print(
            f"epoch {epoch} train_loss={train_loss:.4f} train_acc={train_acc:.4f} "
            f"val_loss={val_loss:.4f} val_acc={val_acc:.4f} ({time.time() - started:.1f}s)",
            flush=True,
        )
        if val_acc > best_val:
            best_val = val_acc
            best_state = {key: value.detach().cpu().clone() for key, value in model.state_dict().items()}

    for parameter in model.parameters():
        parameter.requires_grad = True
    optimizer = torch.optim.AdamW(
        [
            {"params": model.features.parameters(), "lr": 8e-5},
            {"params": model.classifier.parameters(), "lr": 4e-4},
        ],
        weight_decay=1e-4,
    )

    print("phase 2: fine-tune", flush=True)
    for epoch in range(1, 6):
        started = time.time()
        train_loss, train_acc = run_epoch(model, train_loader, criterion, optimizer, f"ft{epoch}")
        val_loss, val_acc = run_epoch(model, val_loader, criterion, None, f"ftval{epoch}")
        print(
            f"ft {epoch} train_loss={train_loss:.4f} train_acc={train_acc:.4f} "
            f"val_loss={val_loss:.4f} val_acc={val_acc:.4f} ({time.time() - started:.1f}s)",
            flush=True,
        )
        if val_acc > best_val:
            best_val = val_acc
            best_state = {key: value.detach().cpu().clone() for key, value in model.state_dict().items()}
        for group in optimizer.param_groups:
            group["lr"] *= 0.6

    if best_state is None:
        raise SystemExit("Training produced no checkpoint")
    model.load_state_dict(best_state)
    torch.save(best_state, ARTIFACTS / "brain-tumor.pt")

    truth, pred = predict_all(model, test_loader)
    metrics = classification_stats(truth, pred)
    metrics["valAccuracy"] = round(best_val, 4)
    metrics["trainImages"] = len(train_samples)
    metrics["valImages"] = len(val_samples)
    (ARTIFACTS / "metrics.json").write_text(json.dumps(metrics, indent=2))
    print(json.dumps({"accuracy": metrics["accuracy"], "macroF1": metrics["macroF1"]}), flush=True)

    onnx_path = ARTIFACTS / "brain-tumor.onnx"
    export_onnx(model, onnx_path)
    verify_onnx(model, onnx_path)
    payload = json.dumps(metrics, indent=2)
    PUBLIC_MODEL.mkdir(parents=True, exist_ok=True)
    lib_dir = ROOT / "lib"
    lib_dir.mkdir(parents=True, exist_ok=True)
    (PUBLIC_MODEL / "metrics.json").write_text(payload)
    (lib_dir / "metrics.json").write_text(payload)
    (PUBLIC_MODEL / "brain-tumor.onnx").write_bytes(onnx_path.read_bytes())
    export_gallery(model, test_loader, test_paths)
    print(f"wrote {onnx_path} ({onnx_path.stat().st_size} bytes)", flush=True)


if __name__ == "__main__":
    main()
