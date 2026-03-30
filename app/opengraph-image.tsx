import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Circlepot — Save Together, Grow Together, Anywhere";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a1f14",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background decorative circles */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            left: "-60px",
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            border: "40px solid rgba(92, 111, 43, 0.25)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            right: "-40px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            border: "50px solid rgba(92, 111, 43, 0.2)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "60px",
            right: "120px",
            width: "160px",
            height: "160px",
            borderRadius: "50%",
            border: "24px solid rgba(92, 111, 43, 0.15)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "80px",
            left: "100px",
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            border: "18px solid rgba(92, 111, 43, 0.12)",
            display: "flex",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            zIndex: 10,
          }}
        >
          <h1
            style={{
              fontSize: "72px",
              fontWeight: 800,
              color: "#ffffff",
              margin: 0,
              letterSpacing: "-2px",
              lineHeight: 1,
            }}
          >
            Circlepot
          </h1>
          <p
            style={{
              fontSize: "28px",
              fontWeight: 500,
              color: "#9aab6e",
              margin: 0,
              letterSpacing: "1px",
            }}
          >
            Community Savings, Made Simple
          </p>
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            right: "0",
            height: "4px",
            background: "linear-gradient(90deg, transparent, #5C6F2B, transparent)",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
