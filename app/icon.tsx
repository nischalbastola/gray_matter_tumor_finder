import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "32px",
          height: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#14130f",
          color: "#e7f56a",
          fontSize: 18,
          fontWeight: 700,
        }}
      >
        N
      </div>
    ),
    { ...size },
  );
}
