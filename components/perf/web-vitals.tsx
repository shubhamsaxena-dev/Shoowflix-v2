"use client";

import { useReportWebVitals } from "next/web-vitals";

type Metric = Parameters<Parameters<typeof useReportWebVitals>[0]>[0];

const ENDPOINT = "/api/vitals";

function send(metric: Metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value) / (metric.name === "CLS" ? 1000 : 1),
    rating: metric.rating,
    id: metric.id,
    navigationType: metric.navigationType,
    path: window.location.pathname,
  });
  try {
    if (navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: "application/json" }))) return;
  } catch {
    /* fall through */
  }
  void fetch(ENDPOINT, { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(
    () => undefined,
  );
}

const report = (metric: Metric) => {
  if (process.env.NODE_ENV !== "production") return;
  send(metric);
};

/** Core Web Vitals → /api/vitals (production only). Renders nothing. */
export function WebVitals() {
  useReportWebVitals(report);
  return null;
}
