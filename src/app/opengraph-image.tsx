import { ImageResponse } from "next/og";

export const alt = "VECTRA — Know Your Direction";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#0B1020",
        color: "white",
        padding: "72px 84px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          opacity: 0.18,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.10) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.10) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div style={{ display: "flex", width: 92, height: 92, borderRadius: 24, background: "#111A31", alignItems: "center", justifyContent: "center", fontSize: 54, fontWeight: 900, color: "#B7FF3C" }}>V↗</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 54, fontWeight: 800, letterSpacing: 6 }}>VECTRA<span style={{ color: "#B7FF3C" }}>.</span></div>
            <div style={{ display: "flex", marginTop: 4, fontSize: 14, letterSpacing: 9, color: "#A8B2C6" }}>KNOW YOUR DIRECTION.</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 720 }}>
            <div style={{ display: "flex", fontSize: 22, color: "#00D1B2", letterSpacing: 3, fontWeight: 700 }}>LEARNING & ASSESSMENT PLATFORM</div>
            <div style={{ display: "flex", marginTop: 18, fontSize: 54, lineHeight: 1.05, fontWeight: 800 }}>Know where you are.<br />Know where to go next.</div>
          </div>
          <div style={{ display: "flex", fontSize: 90, fontWeight: 900, color: "#B7FF3C" }}>↗</div>
        </div>
      </div>
    </div>,
    size,
  );
}
