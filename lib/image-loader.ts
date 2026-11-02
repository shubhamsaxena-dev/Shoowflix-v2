/**
 * next/image loader that skips Vercel's Image Optimization.
 *
 * Every YTS poster is a different source image, so optimizing them on Vercel burns through
 * the plan's source-image quota quickly; once it is used up, /_next/image answers
 * 402 Payment Required and posters break. YTS already publishes posters in two sizes, so
 * we pick the right one per srcset width and let the browser load it straight from the CDN.
 */
type LoaderArgs = { src: string; width: number; quality?: number };

const YTS_COVER = /\/(?:small|medium|large)-cover\.jpg$/i;

export default function imageLoader({ src, width }: LoaderArgs): string {
  // YTS covers: medium is 230px wide, large is 500px.
  if (YTS_COVER.test(src)) {
    return src.replace(YTS_COVER, width <= 230 ? "/medium-cover.jpg" : "/large-cover.jpg");
  }
  // Everything else (backdrops, avatars, local files) is served as is. The width param keeps
  // each srcset entry distinct and is ignored by these hosts.
  return `${src}${src.includes("?") ? "&" : "?"}w=${width}`;
}
