# Nidus

Nidus is a research demo that classifies one brain MRI slice as **glioma**, **meningioma**, **pituitary**, or **no tumor**. The network is MobileNetV3-Small, exported to ONNX, and the score is computed in the browser. A slice is not uploaded.

The checkpoint in this repo scores **93.2% accuracy** (macro F1 0.927) on the 1,311-image Testing folder. That folder was not used to train or to pick the checkpoint.

This is not a medical device and not a diagnosis.

## Run it

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123). `npm run dev` copies the ONNX Runtime WebAssembly files into `public/ort` before the server starts.

```bash
npm run build
npm start
```

## Dataset

Training uses the [Brain Tumor MRI Dataset](https://www.kaggle.com/datasets/masoudnickparvar/brain-tumor-mri-dataset) by Masoud Nickparvar (CC BY 4.0). The weights shipped here were fit on the public Zenodo archive of that dataset: [10.5281/zenodo.12735702](https://doi.org/10.5281/zenodo.12735702). Source collections are figshare, SARTAJ, and Br35H.

`ml/download_dataset.py` can refresh a local copy from the Hugging Face mirror, or from Kaggle if you pass `--kaggle` and have a Kaggle API token.

The raw images are not committed. The ONNX file, the held-out metrics, and a handful of test-slice examples are.

## Train again

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r ml/requirements.txt
python ml/download_dataset.py
python ml/train.py
```

`ml/train.py` writes:

- `public/model/brain-tumor.onnx`
- `lib/metrics.json` and `public/model/metrics.json`
- `public/samples/` plus `lib/samples.json`

The official Testing folder is scored only after the checkpoint is chosen. Details are on the [method](/method) page of the app.

## License

Application code is MIT. See [LICENSE](LICENSE).

The dataset, the derived weights, and the sample slices stay under CC BY 4.0. Attribute Masoud Nickparvar and the source collections when you reuse them.
