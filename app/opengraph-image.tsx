import { ImageResponse } from "next/og";

export const alt = "Gray Matter, a browser-based brain MRI tumor classifier";
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
          background: "#f4f7fb",
          color: "#243044",
          padding: "72px",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 4, color: "#2f5678" }}>GRAY MATTER</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 68, lineHeight: 1.05, maxWidth: 900 }}>Brain tumor MRI classifier</div>
          <div style={{ fontSize: 28, color: "#4d6074" }}>Glioma · Meningioma · Pituitary · No tumor</div>
        </div>
        <div style={{ fontSize: 22, color: "#4d6074" }}>Research demo. Runs in the browser. Not a diagnosis.</div>
      </div>
    ),
    size,
  );
}
