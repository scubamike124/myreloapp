import { asRecord, errorMessage, geminiText } from "@/lib/json";
import { readJsonLimited } from "@/lib/api-guard";
import { currentUser } from "@/lib/accounts";
import { getLanguage } from "@/lib/languages";
import { appearancePrompt } from "@/lib/storybook/character-bible";
import {
  CRITERIA,
  CRITERION_BRIEF,
  CRITERION_LABEL,
  MAX_ATTEMPTS,
  judge,
  readScores,
  rewriteBrief,
  verdictSummary,
  type Verdict,
} from "@/lib/storybook/director";
import {
  buildMoviePrompt,
  buildReviewPrompt,
  buildScenePrompt,
  isRenderable,
  readPlan,
  SCENE_SECONDS,
  type MoviePlan,
} from "@/lib/storybook/movie-plan";
import { getCharacter, getStory, listArtifacts, setArtifact } from "@/lib/storybook/store";
import { getStoryProduct } from "@/lib/storybook/products";
import { FLAT_TOKEN_COST } from "@/lib/token-pricing";
import { refundLater } from "@/lib/charge";
import { checkVeo, isVeoOperation, startVeo, VEO_FAST_720 } from "@/lib/veo";

/**
 * What to give back when the film cannot be made.
 *
 * The charge is taken in another request — the storybook route bills the whole
 * product when the delivery is chosen — so by the time a film fails, the tokens
 * are already gone and the original Charge object with them. `refundLater`
 * exists for exactly this, and the story id is a stable reference so a repeated
 * failure cannot refund twice.
 *
 * A bundle keeps the price of the book, because the parent has the book. A
 * movie order delivers nothing without its film, so all of it goes back.
 */
function filmRefund(productId: string): { action: string; amount: number } | null {
  const product = getStoryProduct(productId);
  if (!product) return null;
  const bookKept = productId === "bundle" ? FLAT_TOKEN_COST["storybook-ebook"] : 0;
  const amount = product.tokens - bookKept;
  return amount > 0 ? { action: product.chargeAction, amount } : null;
}

async function refundFilm(storyId: string, productId: string): Promise<number> {
  const refundable = filmRefund(productId);
  if (!refundable) return 0;
  try {
    // Referenced by story id so the ledger de-duplicates: a parent who reloads
    // a failed film must not be refunded a second time.
    await refundLater(refundable.action, `film:${storyId}`, refundable.amount);
    return refundable.amount;
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// The cinematic movie.
//
// POST plans the film and puts it in front of the Director before anything is
// rendered; GET reports on the renders that resulted.
//
// The order matters more than it looks. Rendering twelve scenes is about $7.20
// of provider spend, so a gate that judged the finished film would cost that
// again on every rejection — and a check that expensive gets turned down until
// it stops rejecting anything. Judging the screenplay costs a fraction of a
// cent, which is what lets the threshold sit where the directive wants it:
// "do not deliver low-quality productions."
//
// The plan is stored as the `screenplay` artifact whether or not it was
// approved, with its scores. When a parent asks why their film is late, the
// answer is a document.
// ---------------------------------------------------------------------------

export const runtime = "nodejs";
export const maxDuration = 300;

const BASE = "https://generativelanguage.googleapis.com/v1beta";
const TEXT_MODEL = "gemini-2.5-flash";
const MAX_BODY = 8 * 1024;

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max).trim() : "";
}

/**
 * A stored illustration, as the bytes Veo needs.
 *
 * `startVeo` puts its third argument straight into `bytesBase64Encoded`, so it
 * has to be base64 — but a saved page does not hold base64. `storeIllustrations`
 * deliberately replaces each `data:` URL with a stored URL before the story is
 * written, because ten inline images would make the row eight megabytes. So by
 * the time a film is ordered, `page.image` is `/api/media/abc.png` or a blob
 * address, and handing that to Veo would fail every scene of a film the parent
 * had already paid for.
 *
 * Same-origin paths are resolved against the incoming request rather than an
 * assumed host: this app runs on Workers, on Node and on localhost, and the
 * only address guaranteed to be right is the one the request arrived on.
 */
async function illustrationBase64(image: string, req: Request): Promise<string> {
  if (!image) return "";
  const inline = /^data:[^;]+;base64,([\s\S]+)$/.exec(image);
  if (inline) return inline[1];
  try {
    const url = image.startsWith("http") ? image : new URL(image, req.url).toString();
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) return "";
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.byteLength === 0) return "";
    return Buffer.from(bytes).toString("base64");
  } catch {
    return "";
  }
}

async function gemini(key: string, prompt: string, maxOutputTokens: number): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${BASE}/models/${TEXT_MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.6, thinkingConfig: { thinkingBudget: 0 }, maxOutputTokens },
    }),
    signal: AbortSignal.timeout(90_000),
  });
  const data = asRecord(await res.json());
  if (!res.ok) throw new Error(errorMessage(data, `HTTP ${res.status}`));
  const match = (geminiText(data) ?? "").match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return asRecord(JSON.parse(match[0]));
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json({ error: "Films are unavailable — GEMINI_API_KEY is not set on the server." }, { status: 503 });
  }

  const user = await currentUser().catch(() => null);
  if (!user) return Response.json({ error: "Sign in to order a film." }, { status: 401 });

  const body = ((await readJsonLimited(req, MAX_BODY).catch(() => null)) ?? {}) as Record<string, unknown>;
  const storyId = str(body.storyId, 60);
  const story = storyId ? await getStory(user.id, storyId) : null;
  if (!story) return Response.json({ error: "That story is not in your library." }, { status: 404 });

  /*
   * The film has to have been paid for.
   *
   * This endpoint spends real money — twelve Veo renders, about $7.20 — and the
   * charge happens somewhere else: the storybook route bills storybook-movie or
   * storybook-bundle when the delivery is chosen, and records what was bought
   * on the story. Owning the story is not the same as having bought the film,
   * so without this check anyone signed in could order a film against a story
   * they bought as a £10 e-book and get the renders for nothing, as often as
   * they liked.
   *
   * The stored product is the receipt. It is written by the same request that
   * took the payment, so the two cannot disagree.
   */
  if (story.product !== "movie" && story.product !== "bundle") {
    return Response.json(
      {
        error:
          "That story was not ordered with a film. Make a new story and choose the movie or the bundle to have one made.",
      },
      { status: 402 },
    );
  }

  /*
   * The film is only ordered once.
   *
   * Without this, a double-tap on the order button starts a second set of
   * renders against the same story — two lots of provider spend for one
   * delivery, and two answers to "is the film ready?".
   */
  const existing = await listArtifacts(story.id);
  const cut = existing.find((a) => a.kind === "final_cut");
  if (cut && cut.status !== "failed") {
    return Response.json(
      { ok: true, alreadyOrdered: true, status: cut.status, message: "That film is already being made." },
      { status: 200 },
    );
  }

  const bible = story.characterId ? await getCharacter(user.id, story.characterId) : null;
  const appearance = bible ? appearancePrompt(bible) : "";
  const language = getLanguage(story.languageCode);

  /*
   * Write, review, rewrite — up to MAX_ATTEMPTS.
   *
   * Each attempt is two cheap text calls. The loop is finite because
   * "automatically improve and regenerate" without a limit is a loop that bills
   * a parent for a film that never arrives, and a plan still failing on the
   * fourth attempt is not going to be fixed by a fifth.
   */
  let plan: MoviePlan | null = null;
  let verdict: Verdict | null = null;
  let attempt = 0;
  const history: { attempt: number; average: number; failed: string[] }[] = [];

  try {
    for (attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const written = await gemini(
        key,
        buildMoviePrompt({
          title: story.title,
          dedication: story.dedication,
          pages: story.pages,
          characterName: bible?.name ?? "",
          bible,
          appearance,
          languageName: language.name,
          revision: verdict ? rewriteBrief(verdict) : undefined,
        }),
        8192,
      );
      if (!written) continue;

      const candidate = readPlan(written, story.title);
      if (!isRenderable(candidate)) continue;

      const reviewed = await gemini(
        key,
        buildReviewPrompt(
          candidate,
          CRITERIA.map((c) => ({ key: c, label: CRITERION_LABEL[c], brief: CRITERION_BRIEF[c] })),
        ),
        1024,
      );
      // A review that could not be read is a review that did not happen, and an
      // unreviewed film must not be rendered — readScores turns the absence
      // into zeros, which fails the gate rather than passing it by default.
      const scored = judge(readScores(reviewed ?? {}), str(reviewed?.notes, 1000));

      plan = candidate;
      verdict = scored;
      history.push({ attempt, average: scored.average, failed: scored.failed.map((c) => CRITERION_LABEL[c]) });
      if (scored.approved) break;
    }
  } catch (e) {
    const refunded = await refundFilm(story.id, story.product);
    await setArtifact(story.id, "final_cut", "failed", null, { reason: "planning failed", refunded });
    return Response.json(
      {
        error: e instanceof Error ? `Could not plan the film: ${e.message}`.slice(0, 200) : "Could not plan the film.",
        refunded,
      },
      { status: 502 },
    );
  }

  if (!plan || !verdict) {
    const refunded = await refundFilm(story.id, story.product);
    await setArtifact(story.id, "final_cut", "failed", null, { reason: "no screenplay", refunded });
    return Response.json({ error: "Could not write a screenplay for that story.", refunded }, { status: 502 });
  }

  // Stored either way: a rejected plan with its scores is the record of why the
  // film was not made, which is the question a parent will ask.
  await setArtifact(story.id, "screenplay", verdict.approved ? "ready" : "failed", null, {
    plan,
    scores: verdict.scores,
    average: verdict.average,
    attempts: history,
  });

  if (!verdict.approved) {
    /*
     * Refusing to render is the feature — and the money goes back.
     *
     * Nothing was rendered, so nothing was spent beyond a few text calls. But
     * the film was paid for in the request that ordered it, so declining to
     * make it while keeping the tokens would be the worst version of a quality
     * gate: the parent pays for Amber's high standards. The refund is what
     * makes "do not deliver low-quality productions" a promise rather than a
     * charge.
     */
    const refunded = await refundFilm(story.id, story.product);
    await setArtifact(story.id, "final_cut", "failed", null, {
      reason: "not approved",
      average: verdict.average,
      failed: verdict.failed,
      refunded,
    });
    return Response.json(
      {
        ok: false,
        approved: false,
        refunded,
        error:
          refunded > 0
            ? `Amber reviewed the film and would not approve it, so nothing was rendered and ${refunded} ${refunded === 1 ? "token has" : "tokens have"} been refunded.`
            : "Amber reviewed the film and would not approve it, so nothing was rendered.",
        summary: verdictSummary(verdict, attempt - 1),
        scores: verdict.scores,
        average: verdict.average,
        failed: verdict.failed.map((c) => CRITERION_LABEL[c]),
        attempts: history,
      },
      { status: 422 },
    );
  }

  /*
   * Approved — start the renders.
   *
   * Fast 720p, pinned per call. The film supplies its own narration and score,
   * so it is buying pictures rather than Veo's audio, which is the reason the
   * app default is the fuller model. Across twelve scenes the tier is the
   * difference between $7.20 and $28.80.
   *
   * Started rather than awaited: twelve renders take far longer than any
   * request may run, so the operation handles are stored and GET polls them.
   */
  /*
   * Claim the film before spending anything on it.
   *
   * The already-ordered guard at the top reads `final_cut`, and until this line
   * that row was only written *after* twelve renders had been started — which
   * on a slow plan is minutes later. Two taps on the order button inside that
   * window both passed the guard and both rendered, at about $7.20 each. The
   * claim goes in first so the second request sees it.
   */
  await setArtifact(story.id, "final_cut", "producing", null, {
    sceneCount: plan.scenes.length,
    approvedOnAttempt: attempt,
    average: verdict.average,
  });

  const started: { scene: number; operation: string | null; error?: string }[] = [];
  for (const scene of plan.scenes) {
    try {
      // Veo's image-to-video path wants a still to animate; the page's own
      // illustration is the right one, so the film looks like the book.
      const still = await illustrationBase64(story.pages[scene.number - 1]?.image ?? "", req);
      if (!still) {
        started.push({ scene: scene.number, operation: null, error: "that page has no illustration to animate" });
        continue;
      }
      const operation = await startVeo(
        key,
        buildScenePrompt(plan, scene, appearance),
        still,
        "image/png",
        2,
        SCENE_SECONDS,
        VEO_FAST_720,
      );
      started.push({ scene: scene.number, operation });
    } catch (e) {
      started.push({ scene: scene.number, operation: null, error: e instanceof Error ? e.message : "failed" });
    }
  }

  /*
   * Every scene has to start, not just one.
   *
   * A film missing three of its twelve scenes is not a film, and leaving it
   * "producing" would strand it there forever — the poller only ever completes
   * when every scene arrives, and the order guard then refuses to let the
   * parent try again. So a partial start is a failure, and it refunds.
   */
  const startedCount = started.filter((s) => s.operation).length;
  const complete = startedCount === plan.scenes.length;
  const refunded = complete ? 0 : await refundFilm(story.id, story.product);

  await setArtifact(story.id, "scene_video", complete ? "producing" : "failed", null, {
    scenes: started,
    seconds: SCENE_SECONDS,
  });
  await setArtifact(story.id, "final_cut", complete ? "producing" : "failed", null, {
    sceneCount: plan.scenes.length,
    approvedOnAttempt: attempt,
    average: verdict.average,
    ...(complete ? {} : { reason: "not every scene could be started", started: startedCount, refunded }),
  });

  return Response.json({
    ok: complete,
    approved: true,
    refunded,
    ...(complete
      ? {}
      : {
          error: `Only ${startedCount} of ${plan.scenes.length} scenes could be started, so the film was cancelled${refunded > 0 ? ` and ${refunded} ${refunded === 1 ? "token was" : "tokens were"} refunded` : ""}.`,
        }),
    summary: verdictSummary(verdict, attempt),
    scores: verdict.scores,
    average: verdict.average,
    attempts: history,
    scenes: started.length,
    started: startedCount,
    plan: { title: plan.title, logline: plan.logline, visualStyle: plan.visualStyle, scenes: plan.scenes.length },
  });
}

/**
 * How the film is getting on.
 *
 * Each scene is polled once per request rather than waited on, the same pattern
 * the other Veo tools use — a request that blocked until twelve renders finished
 * would outlive any platform's limit.
 */
export async function GET(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  const user = await currentUser().catch(() => null);
  if (!user) return Response.json({ error: "Sign in to check on a film." }, { status: 401 });

  const storyId = str(new URL(req.url).searchParams.get("storyId"), 60);
  const story = storyId ? await getStory(user.id, storyId) : null;
  if (!story) return Response.json({ error: "That story is not in your library." }, { status: 404 });

  const artifacts = await listArtifacts(story.id);
  const sceneArtifact = artifacts.find((a) => a.kind === "scene_video");
  const scenes = Array.isArray(sceneArtifact?.detail?.scenes)
    ? (sceneArtifact.detail.scenes as { scene: number; operation: string | null; url?: string }[])
    : [];

  if (!key || scenes.length === 0) {
    return Response.json({ ok: true, artifacts, scenes: [] }, { headers: { "Cache-Control": "no-store" } });
  }

  const polled = await Promise.all(
    scenes.map(async (s) => {
      if (s.url) return { ...s, status: "ready" as const };
      if (!s.operation || !isVeoOperation(s.operation)) return { ...s, status: "failed" as const };
      try {
        const status = await checkVeo(key, s.operation);
        if (status.status === "completed") return { ...s, url: status.videoUrl, status: "ready" as const };
        // A Veo failure is terminal — the operation will not start succeeding.
        // Recorded as failed so the film can settle instead of polling forever.
        if (status.status === "failed") return { ...s, status: "failed" as const, error: status.error };
        return { ...s, status: "processing" as const };
      } catch {
        // A network blip is not a verdict; keep polling this one.
        return { ...s, status: "processing" as const };
      }
    }),
  );

  const ready = polled.filter((s) => s.url).length;
  const failed = polled.filter((s) => s.status === "failed").length;
  /*
   * A film settles when nothing is still moving — not only when everything
   * worked.
   *
   * The previous version only ever completed on a full house, so a single scene
   * Veo refused left the film "producing" for good: the parent watched a
   * progress message that would never finish, and the order guard refused to
   * let them try again because a non-failed final_cut already existed.
   */
  const settled = polled.every((s) => s.status === "ready" || s.status === "failed");
  const done = settled && failed === 0;

  // Written back so a finished scene is not re-fetched on the next poll — the
  // clips are multi-megabyte, and Veo's URLs expire.
  await setArtifact(story.id, "scene_video", settled ? (done ? "ready" : "failed") : "producing", null, {
    scenes: polled,
    seconds: SCENE_SECONDS,
  });

  let refunded = 0;
  if (settled) {
    if (done) {
      /*
       * `url` is deliberately null.
       *
       * The scenes are rendered and stored, but nothing here stitches them into
       * a single file — and putting the first scene's URL on `final_cut` made
       * "Watch the film" play six seconds of scene one and stop. The player
       * reads `scenes` and plays them in order, which is honest about what
       * exists; a single URL would be a claim about a file nobody made.
       */
      await setArtifact(story.id, "final_cut", "ready", null, {
        sceneCount: polled.length,
        assembled: false,
        scenes: polled.map((s) => ({ scene: s.scene, url: s.url })),
      });
    } else {
      const cut = artifacts.find((a) => a.kind === "final_cut");
      // Refund once: only on the transition into failure, not on every poll of
      // an already-failed film.
      refunded = cut?.status === "failed" ? 0 : await refundFilm(story.id, story.product);
      await setArtifact(story.id, "final_cut", "failed", null, {
        sceneCount: polled.length,
        reason: `${failed} of ${polled.length} scenes could not be rendered`,
        refunded,
      });
    }
  }

  return Response.json(
    { ok: true, ready, failed, total: polled.length, done, settled, refunded, scenes: polled },
    { headers: { "Cache-Control": "no-store" } },
  );
}
