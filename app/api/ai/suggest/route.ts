import { CACHE, json, parseBody } from "@/lib/server/http";
import { limitRequest } from "@/lib/server/rate-limit";
import { aiSuggestSchema } from "@/lib/server/schemas";
import { heuristicPlan, openAIPlan, resolvePlan } from "@/lib/server/ai-suggest";

export const maxDuration = 30;

export async function POST(req: Request) {
  const limited = limitRequest(req, "ai-suggest", { limit: 20, windowMs: 60_000 });
  if (limited) return limited;

  const body = await parseBody(req, aiSuggestSchema);
  if (!body.ok) return body.response;
  const { prompt } = body.data;

  const aiPlan = await openAIPlan(prompt);
  const plan = aiPlan ?? heuristicPlan(prompt);
  let movies = await resolvePlan(plan).catch(() => []);
  let reason: string | undefined = aiPlan
    ? undefined
    : "Matched on keywords from your description.";

  // The model's titles found nothing on YTS — give the heuristic a turn.
  if (aiPlan && movies.length === 0) {
    movies = await resolvePlan(heuristicPlan(prompt)).catch(() => []);
    reason = "Matched on keywords from your description.";
  }
  if (movies.length === 0) reason = "Nothing in the catalog matched. Try naming a genre, decade or actor.";

  return json({ movies, reason, usedAI: Boolean(aiPlan) }, { cache: CACHE.private });
}
