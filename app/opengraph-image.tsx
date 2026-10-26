import { ImageResponse } from "next/og";

export const alt = "Nidus, a browser-based brain MRI tumor classifier";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#14130f",
          color: "#f4efe6",
          padding: "72px",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 6, color: "#e7f56a" }}>NIDUS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 68, lineHeight: 1.05, maxWidth: 900 }}>Brain tumor MRI classifier</div>
          <div style={{ fontSize: 28, color: "#b7b0a2" }}>Glioma · Meningioma · Pituitary · No tumor</div>
        </div>
        <div style={{ fontSize: 22, color: "#b7b0a2" }}>Research demo. Runs in the browser. Not a diagnosis.</div>
      </div>
    ),
    size,
  );
}
