import { ImageResponse } from "next/og";

export const alt = "VECTRA — Know Your Direction";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function Mark() {
  return (
    <svg width="98" height="98" viewBox="0 0 72 72" fill="none">
      <defs>
        <linearGradient
          id="left"
          x1="8"
          y1="12"
          x2="34"
          y2="58"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#5C7CFA" />
          <stop offset="0.55" stopColor="#3F8EFA" />
          <stop offset="1" stopColor="#39C6EE" />
        </linearGradient>
        <linearGradient
          id="up"
          x1="30"
          y1="57"
          x2="61"
          y2="9"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#39C6EE" />
          <stop offset="0.48" stopColor="#00D1B2" />
          <stop offset="1" stopColor="#B7FF3C" />
        </linearGradient>
      </defs>
      <path d="M8 14H22.5L36.7 41.6 29.1 56.8 8 14Z" fill="url(#left)" />
      <path
        d="M21.5 31.4 27.2 42.4 36.7 41.6 31.2 30.8 21.5 31.4Z"
        fill="#42B7ED"
      />
      <path
        d="M28.9 56.7 47.8 24.8 42.4 22.6 61.6 9.4 58.3 31.6 53 27.4 37.2 55.3 28.9 56.7Z"
        fill="url(#up)"
      />
    </svg>
  );
}

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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              display: "flex",
              width: 112,
              height: 112,
              borderRadius: 28,
              background: "#111A31",
              border: "1px solid #26324F",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Mark />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 54,
                fontWeight: 800,
                letterSpacing: 6,
              }}
            >
              VECTRA<span style={{ color: "#B7FF3C" }}>.</span>
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 4,
                fontSize: 14,
                letterSpacing: 9,
                color: "#A8B2C6",
              }}
            >
              KNOW YOUR DIRECTION.
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", maxWidth: 720 }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 22,
                color: "#00D1B2",
                letterSpacing: 3,
                fontWeight: 700,
              }}
            >
              LEARNING & ASSESSMENT PLATFORM
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 18,
                fontSize: 54,
                lineHeight: 1.05,
                fontWeight: 800,
              }}
            >
              Know where you are.
              <br />
              Know where to go next.
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 90,
              fontWeight: 900,
              color: "#B7FF3C",
            }}
          >
            ↗
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
