/**
 * Conversation vs execution — inferred from the utterance and recent thread.
 * No manual mode switch. Used by Amber Fixes and /api/amber.
 */

export type AmberMode = "conversation" | "execution";

export type ThreadTurn = { role: "user" | "assistant" | "activity"; content: string };

export type ClassifyOpts = {
  /** Amber Fixes (/amber-builder): prefer execution for clear product objectives. */
  surface?: "amber-fix" | "general";
};

const EXEC_VERBS =
  /\b(scan|fix|repair|patch|build|deploy|publish|test|retest|ship|rollback|hot.?fix|debug|implement|refactor|migrate|audit code|update|change|improve|rewrite|replace|remove|add|make|wire|restore|enable|disable)\b/i;

const EXEC_NOW =
  /\b(do it|go ahead|go for it|start (it|now|the (build|scan|fix|repair))|run (it|that|the (scan|tests?|build))|execute|get (it|that) done|make (the )?(change|fix) now|create it|generate it|build it|fix it now)\b/i;

const CREATIVE_ASK =
  /^(amber[,:]?\s*)?(can|could|would|will) you (make|create|produce|film|shoot)\b/i;

const CREATIVE_TOPIC =
  /\b(video|ad|commercial|tiktok|reel|short|hook|script|caption|actor|avatar|voiceover)\b/i;

const FOLLOW_UP_REFINEMENT =
  /^(make it|use a|use an|change (it|the)|instead|shorter|longer|30 seconds|15 seconds|60 seconds|a woman|a man|add |drop |remove |keep the)\b/i;

const QUESTION =
  /^(what|why|how|who|when|where|which|should|is|are|do you|can we|could we)\b/i;

const EXPLORATORY =
  /^(what should|which (one|product|area|repo)|where should|any ideas|what('s| is) (broken|next)|priorit)/i;

/** Clear product-change objective even without classic "fix/build" verbs. */
const PRODUCT_OBJECTIVE =
  /\b(reelo|forma|amber hq|launch ready|rest ?pilot|dayli|homepage|landing|hero|headline|button|nav|navbar|footer|page|copy|wording|ui|ux|bug|broken|wrong|missing|should (be|say|show)|i want|we need|need(s)? to|please (change|update|fix|make)|don'?t ask me|stop asking)\b/i;

const IMPLEMENTATION_PROBE =
  /\b(which file|what file|exact (sentence|line|string|copy)|where (is|does) (that|it)|point me to|walk me through|go-?ahead before|before (you )?(merge|deploy|ship))\b/i;

/** Owner wants Relo (or a named product) changed — Amber Fix must start work, not interview. */
const WORK_INTENT =
  /\b(change|fix|update|patch|build|implement|rewrite|replace|repair|scan|debug|improve|add|remove|restore|wire|ship|deploy)\b/i;

const WORK_TARGET =
  /\b(reelo|forma|amber hq|launch ready|rest ?pilot|dayli|repo|codebase|site|page|line|copy|ui|ux|bug|broken|homepage|landing|button|nav|headline|card)\b/i;

/**
 * True when Amber Fixes should auto-start engineering work instead of chatting.
 * Includes underspecified asks like "Can you change one line on Reelo for me?"
 */
export function isAmberFixWorkIntent(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (CREATIVE_ASK.test(trimmed) && CREATIVE_TOPIC.test(trimmed) && !WORK_TARGET.test(trimmed)) {
    return false;
  }
  if (EXPLORATORY.test(trimmed) && !EXEC_NOW.test(trimmed)) return false;
  if (WORK_INTENT.test(trimmed) && WORK_TARGET.test(trimmed)) return true;
  if (WORK_INTENT.test(trimmed) && /\b(for me|please|now)\b/i.test(trimmed) && trimmed.length >= 18) {
    return true;
  }
  return classifyAmberMode(trimmed, [], { surface: "amber-fix" }) === "execution";
}

function blob(history: ThreadTurn[]): string {
  return history
    .slice(-12)
    .map((t) => t.content)
    .join("\n")
    .slice(-4000);
}

function discussingCreative(history: ThreadTurn[]): boolean {
  return CREATIVE_TOPIC.test(blob(history));
}

function discussingRepair(history: ThreadTurn[]): boolean {
  return EXEC_VERBS.test(blob(history)) || PRODUCT_OBJECTIVE.test(blob(history));
}

/**
 * Classify the latest owner message. History is used for pronouns / follow-ups.
 */
export function classifyAmberMode(
  text: string,
  history: ThreadTurn[] = [],
  opts: ClassifyOpts = {},
): AmberMode {
  const trimmed = text.trim();
  if (!trimmed) return "conversation";
  const onFix = opts.surface === "amber-fix";

  if (FOLLOW_UP_REFINEMENT.test(trimmed) && discussingCreative(history) && !EXEC_NOW.test(trimmed)) {
    return "conversation";
  }

  if (CREATIVE_ASK.test(trimmed) && CREATIVE_TOPIC.test(trimmed) && !EXEC_NOW.test(trimmed)) {
    return "conversation";
  }

  // Exploratory prioritization stays conversational on Fix.
  if (EXPLORATORY.test(trimmed) && !EXEC_NOW.test(trimmed)) {
    return "conversation";
  }

  // Pure questions stay conversational — unless they're actionable product
  // objectives on Amber Fixes ("how do we fix the Relo homepage …").
  if (QUESTION.test(trimmed) && !EXEC_NOW.test(trimmed)) {
    if (onFix && PRODUCT_OBJECTIVE.test(trimmed) && trimmed.length > 40) {
      return "execution";
    }
    if (!EXEC_VERBS.test(trimmed)) {
      return "conversation";
    }
    // "What should we repair first?" style — no concrete outcome yet.
    if (/^(what|which|where)\b/i.test(trimmed)) {
      return "conversation";
    }
  }

  if (EXEC_NOW.test(trimmed) && (discussingCreative(history) || discussingRepair(history) || EXEC_VERBS.test(trimmed))) {
    return "execution";
  }

  if (
    EXEC_VERBS.test(trimmed) &&
    (/\b(launch ready|reelo|forma|amber hq|rest ?pilot|dayli|repo|code|deploy|broken|bug|page|copy|ui)\b/i.test(
      trimmed,
    ) ||
      EXEC_NOW.test(trimmed))
  ) {
    return "execution";
  }

  if (EXEC_VERBS.test(trimmed) && trimmed.length > 24) {
    return "execution";
  }

  // Amber Fixes: a clear product outcome is work, not a workshop.
  if (onFix && PRODUCT_OBJECTIVE.test(trimmed) && trimmed.length > 20) {
    return "execution";
  }

  if (onFix && IMPLEMENTATION_PROBE.test(trimmed) === false && trimmed.length > 48 && !QUESTION.test(trimmed)) {
    // Long imperative on Fix without a question mark → treat as a job brief.
    if (/[.!]$/.test(trimmed) || EXEC_VERBS.test(trimmed) || /\b(please|need|want|make|change)\b/i.test(trimmed)) {
      return "execution";
    }
  }

  return "conversation";
}

export function shouldSendOnEnter(e: {
  key: string;
  shiftKey: boolean;
  nativeEvent?: { isComposing?: boolean };
  isComposing?: boolean;
}): boolean {
  if (e.key !== "Enter" || e.shiftKey) return false;
  if (e.isComposing || e.nativeEvent?.isComposing) return false;
  return true;
}

export function modeInstruction(mode: AmberMode, opts: ClassifyOpts = {}): string {
  if (mode === "execution") {
    const fixExtra =
      opts.surface === "amber-fix"
        ? [
            "You are on Amber Fixes. Do not interview Michael for file paths, exact copy location, or step-by-step go-aheads.",
            "Call start_dev_task (or rely on the repair job already started from this message) with a complete brief you write yourself.",
            "Only ask if the outcome itself is ambiguous.",
          ].join(" ")
        : "";
    return [
      "# Mode for this turn: EXECUTION",
      "The owner asked you to do the work. Acknowledge briefly, then act via the tools available on this surface.",
      "On Amber Fixes, a coding/repair job may already be starting from their message — narrate real status, do not invent progress.",
      "Do not re-ask what they want unless a required choice is missing (which product, or an owner-gated secret).",
      fixExtra,
    ]
      .filter(Boolean)
      .join("\n");
  }
  return [
    "# Mode for this turn: CONVERSATION",
    "They are talking with you, not issuing a run command.",
    "Be a natural collaborator. Ask what they actually want before naming a product or sending them somewhere.",
    "If they ask whether you can make a video, say yes and ask what kind — length, talent, hook, style, platform — then keep that thread.",
    "Follow-ups like \"make it 30 seconds\" or \"use a woman instead\" refer to the current idea. Do not restart from zero.",
    "Do not open with \"Go to Reelo\" or a tool directory. After you both know the brief, then say which system you will use to execute.",
    "Do not invent that you already generated, deployed, or published anything.",
    opts.surface === "amber-fix"
      ? "If their message is actually a clear Relo fix/build objective, treat the next turn as work: call start_dev_task instead of asking for implementation details."
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}
