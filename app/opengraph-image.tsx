import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/movie-utils";

export const alt = `${SITE_NAME} — stream films instantly`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ImageResponse can't read CSS variables; these mirror the "Projection" tokens.
const INK = "#0b0c0f";
const PAPER = "#f3efe6";
const MUTED = "#a3a1a8";
const AMBER = "#ffb238";
const TEAL = "#5eead4";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: `radial-gradient(90% 120% at 100% 0%, rgba(255,178,56,0.28) 0%, rgba(255,178,56,0) 55%), ${INK}`,
          color: PAPER,
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 26, color: AMBER }}>
          <div style={{ width: 12, height: 12, borderRadius: 999, background: AMBER }} />
          Now showing
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 148, lineHeight: 0.9, letterSpacing: "-0.04em" }}>{SITE_NAME}</div>
          <div style={{ fontSize: 40, color: MUTED, fontFamily: "sans-serif" }}>
            Stream films instantly. New releases, cult picks and classics.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* A strip of film frames, the last one lit */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                width: 88,
                height: 54,
                borderRadius: 6,
                border: `2px solid ${i === 5 ? AMBER : "rgba(243,239,230,0.18)"}`,
                background: i === 5 ? "rgba(255,178,56,0.18)" : "transparent",
              }}
            />
          ))}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, fontSize: 24, color: TEAL }}>
            <div style={{ width: 10, height: 10, borderRadius: 999, background: TEAL }} />
            HD · 1080p · 4K
          </div>
        </div>
      </div>
    ),
    size,
  );
}
