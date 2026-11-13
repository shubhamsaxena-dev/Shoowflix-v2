import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CACHE, json, jsonError, parseBody, serverError } from "@/lib/server/http";
import { limitRequest } from "@/lib/server/rate-limit";
import { aiSuggestSchema } from "@/lib/server/schemas";
import { currentUserId } from "@/lib/server/session";
import { heuristicPlan, openAIPlan, resolvePlan } from "@/lib/server/ai-suggest";

export const maxDuration = 30;

/** Signed-in users get one question per UTC day. */
function today() {
  return new Date().toISOString().slice(0, 10);
}

function nextUtcMidnight() {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d;
}

export async function POST(req: Request) {
  const limited = limitRequest(req, "ai-suggest", { limit: 20, windowMs: 60_000 });
  if (limited) return limited;

  const userId = await currentUserId();
  if (!userId) return jsonError(401, "Sign in to ask the projectionist.");

  const body = await parseBody(req, aiSuggestSchema);
  if (!body.ok) return body.response;
  const { prompt } = body.data;

  // Spend today's question first; the unique (userId, day) index makes this atomic.
  let usageId: string;
  try {
    usageId = (await prisma.aiSuggestUsage.create({ data: { userId, day: today() } })).id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const resetAt = nextUtcMidnight();
      const retryAfter = Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000));
      return json(
        { message: "You've had today's question. The projectionist is back tomorrow.", resetAt: resetAt.toISOString() },
        { status: 429, cache: CACHE.private, headers: { "Retry-After": String(retryAfter) } },
      );
    }
    console.error("[api/ai/suggest] usage", error);
    return serverError();
  }

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
  if (movies.length === 0) {
    // Don't spend the day's question on an empty answer (no match or the catalog was down).
    await prisma.aiSuggestUsage.delete({ where: { id: usageId } }).catch(() => undefined);
    reason = "Nothing in the catalog matched. Try naming a genre, decade or actor. This one didn't count.";
  }

  return json({ movies, reason, usedAI: Boolean(aiPlan) }, { cache: CACHE.private });
}
