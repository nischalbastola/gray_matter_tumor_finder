import { Separator } from "@/components/ui/separator";

export const FAQS = [
  {
    question: "Is a Gray Matter result a diagnosis?",
    answer:
      "No. Gray Matter scores one image against four labels from a public MRI dataset. A diagnosis needs the full study, the clinical history, and a qualified reader. This tool is not cleared as a medical device.",
  },
  {
    question: "Does my scan get uploaded?",
    answer:
      "No. The ONNX model runs in your browser with WebAssembly. The slice you choose is decoded locally, scored locally, and is not sent to a server by this app.",
  },
  {
    question: "What kind of image should I use?",
    answer:
      "A single axial brain MRI slice, exported as JPEG, PNG, or WebP, similar to the Nickparvar training set. CT, photos of people, diagrams, and multi-slice DICOM studies are outside what this model saw.",
  },
  {
    question: "Which diseases can it detect?",
    answer:
      "Only the four labels it was trained on: glioma, meningioma, pituitary tumor, and no tumor. Stroke, metastasis, infection, demyelination, and other tumors are not classes. The model still has to pick one of the four, so an out-of-set image gets a forced call.",
  },
  {
    question: "How was accuracy measured?",
    answer:
      "Training used the dataset Training folder, with a stratified slice held out for validation and model selection. The Testing folder was scored once, after training, and those counts are the numbers on this page. That is not a hospital external validation.",
  },
] as const;

export function FaqList() {
  return (
    <div>
      {FAQS.map((item, index) => (
        <div key={item.question}>
          {index > 0 ? <Separator className="my-4" /> : null}
          <h3 className="text-xl">{item.question}</h3>
          <p className="mt-2 text-base leading-7 text-[var(--muted-foreground)]">{item.answer}</p>
        </div>
      ))}
    </div>
  );
}
