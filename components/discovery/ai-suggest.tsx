"use client";

import { useState } from "react";
import useSWRMutation from "swr/mutation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MovieGrid } from "@/components/movie/movie-grid";
import { GridSkeleton } from "@/components/movie/movie-skeleton";
import { sendJSON } from "@/lib/swr";
import type { YTSMovie } from "@/types/movie";
import styles from "./ai-suggest.module.css";

interface SuggestResponse {
  movies: YTSMovie[];
  reason?: string;
}

const EXAMPLES = [
  "A slow-burn thriller set in the 70s",
  "Feel-good films for a rainy Sunday",
  "Mind-bending sci-fi like Arrival",
  "Heist movies with a great ensemble",
];

/** "Ask the projectionist": free-text prompt → POST /api/ai/suggest. */
export function AiSuggest() {
  const [prompt, setPrompt] = useState("");
  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    "/api/ai/suggest",
    sendJSON<{ prompt: string }, SuggestResponse>("POST"),
  );
  const [asked, setAsked] = useState("");

  const ask = async (text: string) => {
    const q = text.trim();
    if (!q || isMutating) return;
    setPrompt(q);
    setAsked(q);
    try {
      await trigger({ prompt: q });
    } catch {
      /* surfaced via `error` */
    }
  };

  const movies = data?.movies ?? [];

  return (
    <section className={styles.section} aria-labelledby="ai-title">
      <div className={styles.intro}>
        <h2 id="ai-title" className={styles.title}>
          Ask the projectionist
        </h2>
        <p className={styles.lede}>
          Describe a mood, a decade, an actor or a film you loved. You&apos;ll get a short programme picked from the
          catalogue.
        </p>
      </div>

      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          void ask(prompt);
        }}
      >
        <label htmlFor="ai-prompt" className="visually-hidden">
          What are you in the mood for?
        </label>
        <input
          id="ai-prompt"
          className={styles.input}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Something tense, under two hours, set at sea…"
          maxLength={280}
          autoComplete="off"
          enterKeyHint="go"
        />
        <Button type="submit" size="lg" loading={isMutating} disabled={!prompt.trim()}>
          <Sparkles aria-hidden />
          Find films
        </Button>
      </form>

      <div className={styles.examples} role="group" aria-label="Example requests">
        {EXAMPLES.map((ex) => (
          <button key={ex} type="button" className={styles.example} onClick={() => void ask(ex)}>
            {ex}
          </button>
        ))}
      </div>

      <div className={styles.results} aria-live="polite" aria-busy={isMutating || undefined}>
        {isMutating ? (
          <GridSkeleton count={6} />
        ) : error ? (
          <p className={styles.message}>
            The projectionist couldn&apos;t answer that one. Try rephrasing, or{" "}
            <button type="button" className={styles.inlineLink} onClick={() => void ask(asked)}>
              ask again
            </button>
            .
          </p>
        ) : data ? (
          movies.length ? (
            <>
              <div className={styles.resultHead}>
                <p className={styles.reason}>{data.reason || `Picked for “${asked}”.`}</p>
                <Button variant="ghost" size="sm" onClick={() => reset()}>
                  Clear
                </Button>
              </div>
              <MovieGrid movies={movies.slice(0, 12)} />
            </>
          ) : (
            <p className={styles.message}>Nothing in the catalogue matched “{asked}”. Try broader words or a genre.</p>
          )
        ) : null}
      </div>
    </section>
  );
}
