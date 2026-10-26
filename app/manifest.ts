import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nidus brain tumor MRI classifier",
    short_name: "Nidus",
    description:
      "Research classifier for a brain MRI slice: glioma, meningioma, pituitary, or no tumor. Runs in the browser.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f7fb",
    theme_color: "#f4f7fb",
    lang: "en",
  };
}
