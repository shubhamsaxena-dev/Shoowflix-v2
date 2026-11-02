/** 75 → "1:15", 3725 → "1:02:05". */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = (s % 60).toString().padStart(2, "0");
  return h ? `${h}:${m.toString().padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

export function sourceLabel(source: { quality: string; type: string; codec?: string }) {
  const kind = source.type ? source.type.replace(/^web$/i, "WEB").replace(/^bluray$/i, "Blu-ray") : "";
  return [source.quality, kind, source.codec && source.codec !== "x264" ? source.codec : ""].filter(Boolean).join(" ");
}
