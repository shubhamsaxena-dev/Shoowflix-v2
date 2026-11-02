# Shoowflix v2 — Architecture & Contracts

Next.js 16 App Router · React 19 · SWR 2.5 · NextAuth 4 (JWT) · Prisma 6 (MongoDB) · CSS Modules + design tokens.
No Tailwind, no Radix, no shadcn. Old Pages Router code is readable via `git show main:<path>`.

## Design system — "Projection"
- Tokens: `styles/tokens.css` (dark default, `[data-theme="light"]` = "Matinee"). **Never hardcode hex** in components; use `var(--color-*)`, `--space-*`, `--radius-*`, `--text-*`, `--duration-*`, `--ease-*`, `--z-*`.
- Fonts (next/font, CSS vars): `--font-display` Instrument Serif (headings, big titles, italics for emphasis), `--font-sans` Geist (UI), `--font-mono` Geist Mono (metadata: year, runtime, quality, peers, ratings — use `.mono`/`.eyebrow`).
- Accent = marquee amber `--color-accent`; signal = teal `--color-signal` (live/player/peers). It must NOT look like Netflix (no red, no N-style rows with big red logos).
- Styling: one `*.module.css` per component, co-located. Global utilities only: `.container .visually-hidden .eyebrow .mono .cv-auto`.
- Icons: `lucide-react` (tree-shaken via optimizePackageImports).
- `cx()` helper in `lib/movie-utils.ts`.

## Ownership (one owner per path — do not edit other owners' files)
| Owner | Paths |
|---|---|
| Foundation (done) | `app/layout.tsx`, `app/providers.tsx`, `styles/*`, `lib/yts.ts`, `lib/auth.ts`, `lib/prisma.ts`, `lib/swr.ts`, `lib/movie-utils.ts`, `types/*`, `prisma/schema.prisma`, `next.config.ts`, `tsconfig.json`, `package.json` |
| **Agent A — Design system, shell, accounts** | `components/ui/**`, `components/shell/**`, `components/account/**`, `app/(auth)/**`, `app/profile/**`, `app/my-list/**`, `app/not-found.tsx`, `app/error.tsx`, `app/global-error.tsx`, `app/loading.tsx`, `proxy.ts`, `hooks/use-watchlist.ts`, `hooks/use-media-query.ts` |
| **Agent B — Discovery & content (SSG/ISR)** | `app/page.tsx`, `app/browse/**`, `app/genre/**`, `app/search/**`, `app/movie/**`, `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx`, `components/movie/**`, `components/discovery/**`, `hooks/use-movies.ts`, `hooks/use-in-view.ts` |
| **Agent C — Player, API, performance** | `app/watch/**`, `app/api/**` (except `auth/[...nextauth]` which exists), `components/player/**`, `components/perf/**`, `hooks/use-continue-watching.ts`, `hooks/use-player*.ts`, `app/manifest.ts`, `public/sw.js`, `lib/server/**` |

If you need something from another owner, use the contract below; if the contract is insufficient, write it in your final report instead of editing their files.

## Cross-agent contracts

### Agent A exports
- `components/ui/button.tsx` (exists): `Button`, `ButtonLink`, `buttonClass({variant,size,icon,block})`. Variants: primary|secondary|ghost|outline|glass|danger. Sizes sm|md|lg.
- `components/ui/badge.tsx` (exists): `Badge tone=default|accent|signal|solid|rating`.
- `components/ui/skeleton.tsx` (exists): `Skeleton className style`.
- `components/ui/toast.tsx`: `ToastProvider` (used in providers), `useToast()` → `{ toast(opts: { title: string; description?: string; tone?: "default"|"success"|"danger"; action?: {label: string; onClick: () => void} }) }`.
- `components/ui/dialog.tsx`: `Dialog({ open, onOpenChange, title, description?, children, size?: "sm"|"md"|"lg"|"full" })` built on native `<dialog>`.
- `components/ui/sheet.tsx`: `Sheet({ open, onOpenChange, side?: "left"|"right"|"bottom", title, children })`.
- `components/ui/tabs.tsx`, `components/ui/input.tsx` (`Input`, `Field`), `components/ui/select.tsx` (native-select styled), `components/ui/chip.tsx` (`Chip` toggle pill, `aria-pressed`), `components/ui/spinner.tsx`, `components/ui/avatar.tsx`, `components/ui/menu.tsx` (popover menu, `popover` API or click-outside).
- `components/shell/site-header.tsx` → `SiteHeader` (server or client), `site-footer.tsx` → `SiteFooter`, `mobile-tab-bar.tsx` → `MobileTabBar`. All three are imported by `app/layout.tsx`. Header has: wordmark, nav (Home, Browse, Genres, My List), ⌘K search trigger (opens `components/shell/command-search.tsx`, which queries `/api/movies?query_term=` via SWR, debounced), theme toggle, user menu / Sign in.
- `components/account/watchlist-button.tsx` → `WatchlistButton({ movieId: number; variant?: "icon"|"full"; size?: ButtonSize })` client component, optimistic, prompts sign-in when signed out.
- `hooks/use-watchlist.ts` → `useWatchlist()` → `{ ids: string[]; has(id:number): boolean; toggle(id:number): Promise<void>; isLoading }` using `useSWR("/api/watchlist")` + `useSWRMutation` optimistic.

### Agent B exports
- `components/movie/movie-card.tsx` → `MovieCard({ movie: YTSMovie; priority?: boolean; sizes?: string })`.
- `components/movie/movie-rail.tsx` → `MovieRail({ title, href?, movies, eyebrow? })` (server-renderable, horizontal scroll-snap).
- `components/movie/movie-grid.tsx` → `MovieGrid({ movies })`.
- `hooks/use-movies.ts` → `useMoviesInfinite(filters, fallback?)`, `useMovieSearch(query)`.

### Agent C exports
- Route handlers (JSON):
  - `GET /api/movies?…MovieFilters` → `{ movie_count, limit, page_number, movies: YTSMovie[] }` (uses `lib/yts.listMovies`; CDN cache headers).
  - `GET /api/movies/[id]` → `{ movie: YTSMovie }` | 404.
  - `GET /api/movies/[id]/suggestions` → `{ movies: YTSMovie[] }`.
  - `GET /api/watchlist` → `{ ids: string[] }` (401 when signed out). `POST /api/watchlist` body `{ movieId: number; action: "add"|"remove" }` → `{ ids: string[] }`. (Uses `UserFeaturedMovies` model.)
  - `GET /api/progress` → `{ items: WatchProgressDTO[] }`; `PUT /api/progress` body `WatchProgressDTO` (upsert). Signed-out users fall back to localStorage in the hook.
  - `POST /api/register` body `{ name, email, password }` (zod-validated) → 201 `{ ok: true }` | 400/409 `{ message }`.
  - `POST /api/ai/suggest` body `{ prompt }` → `{ movies: YTSMovie[], reason?: string }` (port from `git show main:pages/api/ai/suggest.ts`).
  - `POST /api/vitals` (web-vitals beacon sink; just logs / 204).
- `app/watch/[id]/page.tsx` — player route. Link with `watchHref(id, quality?)` from `lib/movie-utils`.
- `components/player/continue-watching-rail.tsx` → `ContinueWatchingRail()` client component (renders nothing when empty). Agent B places it on the home page.
- `components/perf/web-vitals.tsx` → `WebVitals()` client component (imported in root layout).
- `hooks/use-continue-watching.ts` → `useContinueWatching()` → `{ items, save(dto), remove(movieId) }`.

`WatchProgressDTO = { movieId: number; title: string; poster?: string; backdrop?: string; quality?: string; position: number; duration: number; updatedAt?: string }`.

## Rendering strategy
- Home `/` — static + ISR (`export const revalidate = 1800`), rails fetched in parallel on the server via `lib/yts`.
- `/genre/[genre]` — SSG via `generateStaticParams(GENRES)`, ISR; infinite scroll pages 2+ via SWR with page 1 as `fallbackData`.
- `/movie/[id]/[[...slug]]` — ISR, `generateStaticParams` for top ~40 trending, `dynamicParams = true`, `generateMetadata`, JSON-LD `Movie` schema, canonical slug redirect on the server.
- `/browse`, `/search` — dynamic (searchParams), streamed with `<Suspense>`; SWR on the client for filters.
- `/watch/[id]` — dynamic server shell (metadata + movie fetched with ISR cache) + client player.
- `/profile`, `/my-list` — dynamic, auth-gated server-side with `auth()` from `lib/auth`, redirect to `/signin?callbackUrl=…`. `proxy.ts` also guards them.
- Server data: always `lib/yts.ts` (cached fetch + tags). Client data: always SWR via `/api/*`.

## Performance rules
- `next/image` everywhere with correct `sizes`; only the hero/LCP image gets `priority` (+`fetchPriority="high"`). Posters `quality={70}`.
- Below-the-fold sections: `.cv-auto`, lazy client islands with `next/dynamic` where heavy (player SDK, command search, AI overlay).
- No layout shift: fixed aspect-ratio boxes for posters/backdrops, skeletons sized identically.
- Keep client components leaf-level; pages and layouts are Server Components.
- Webtor SDK loads only on `/watch` (preconnect to `cdn.jsdelivr.net` + `webtor.io` there).
