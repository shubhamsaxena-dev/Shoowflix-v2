/**
 * Web-vitals beacon sink. Receives `navigator.sendBeacon` payloads from
 * components/perf/web-vitals.tsx and logs them (structured, one line each)
 * so they show up in the platform's log drain. Always 204.
 */
const MAX_BYTES = 4096;

export async function POST(req: Request) {
  try {
    const text = await req.text();
    if (text && text.length <= MAX_BYTES) {
      const metric = JSON.parse(text) as Record<string, unknown>;
      console.info(
        "[web-vitals]",
        JSON.stringify({
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          id: metric.id,
          path: metric.path,
          nav: metric.navigationType,
        }),
      );
    }
  } catch {
    /* malformed beacon — ignore */
  }
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
