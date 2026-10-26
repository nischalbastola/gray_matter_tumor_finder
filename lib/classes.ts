import type { LabelId } from "@/lib/types";

export type ClassProfile = {
  id: LabelId;
  name: string;
  short: string;
  summary: string;
  detail: string;
  tone: string;
};

export const CLASSES: Record<LabelId, ClassProfile> = {
  glioma: {
    id: "glioma",
    name: "Glioma",
    short: "Glial-cell tumor",
    summary:
      "A tumor that starts in glial cells, the support tissue of the brain. Borders on MRI are often irregular.",
    detail:
      "Gliomas arise from astrocytes, oligodendrocytes, or related glial cells. They range from slower-growing tumors to aggressive ones such as glioblastoma. On an axial MRI they often sit inside a cerebral hemisphere and can look infiltrative rather than neatly boxed in by a capsule. Grading, molecular markers, and a full MRI protocol decide treatment. A single slice cannot make those calls.",
    tone: "var(--glioma)",
  },
  meningioma: {
    id: "meningioma",
    name: "Meningioma",
    short: "Meningeal tumor",
    summary:
      "A tumor from the meninges, the membranes around the brain. Many are benign and press inward from the surface.",
    detail:
      "Meningiomas grow from the arachnoid cap cells of the meninges. A large share are benign and slow. On MRI they tend to sit against the dura or the inner table of the skull, sometimes with a broad base along the surface rather than a center deep in the white matter. Location still matters: a small mass near a venous sinus or the optic nerve is a different clinical problem from one over the convexity.",
    tone: "var(--meningioma)",
  },
  pituitary: {
    id: "pituitary",
    name: "Pituitary",
    short: "Sellar-region mass",
    summary:
      "A mass in or beside the pituitary gland, low and midline, where the gland sits in the sella.",
    detail:
      "Pituitary adenomas and related sellar masses sit at the skull base, behind the eyes and under the optic chiasm. They can change hormones or squeeze the chiasm and affect peripheral vision. On an axial slice the clue is a midline mass low in the image, not a lesion high in the hemispheres. Hormone labs and a dedicated pituitary protocol are how clinicians actually characterize these.",
    tone: "var(--pituitary)",
  },
  notumor: {
    id: "notumor",
    name: "No tumor",
    short: "No tumor pattern",
    summary:
      "The slice does not match the glioma, meningioma, or pituitary patterns this model learned.",
    detail:
      "No tumor means the classifier did not see the patterns it was trained to call glioma, meningioma, or pituitary. It is not a clean bill of health. Stroke, multiple sclerosis, metastasis, infection, post-surgical change, and tumors outside these three classes can all be present on a scan this model has no label for. A radiologist reads the whole study, not one JPEG.",
    tone: "var(--notumor)",
  },
};

export const CLASS_LIST = [CLASSES.glioma, CLASSES.meningioma, CLASSES.pituitary, CLASSES.notumor];
