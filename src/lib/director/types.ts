// ---------------------------------------------------------------------------
// The shapes the Commercial Director works in.
//
// Kept in their own module with no imports, so both the server pipeline and the
// browser review screen can hold the same storyboard without the client pulling
// in Gemini, the database driver or the scraper.
//
// The vocabulary here is deliberately a film crew's rather than a prompt
// writer's. A scene is not "a clip we generated"; it is a shot size, a camera
// move, a subject, an action and a reason for existing. That distinction is the
// whole point of this module — see dna.ts.
// ---------------------------------------------------------------------------

/** The five beats every business commercial must contain, in this order. */
export type BeatId = "hook" | "problem" | "solution" | "result" | "cta";

export type ShotSize =
  | "extreme wide"
  | "wide"
  | "medium wide"
  | "medium"
  | "medium close-up"
  | "close-up"
  | "extreme close-up"
  | "insert"
  | "overhead"
  | "over-the-shoulder";

export type CameraMove =
  | "locked off"
  | "slow push in"
  | "pull back reveal"
  | "tracking follow"
  | "handheld drift"
  | "slow pan"
  | "whip pan"
  | "crane down"
  | "rack focus"
  | "orbit"
  | "tilt up";

export type Transition = "hard cut" | "cut on action" | "match cut" | "dissolve" | "whip transition" | "speed ramp";

/**
 * What we could actually establish about the business. Split into what the
 * source *stated* and what we inferred, because a commercial that invents a
 * credential is worse than no commercial — it is a liability for the customer
 * whose name is on it. Only `provenClaims` may be spoken as fact.
 */
export type BusinessIntel = {
  name: string;
  category: string;
  whatTheySell: string;
  customer: string;
  problem: string;
  transformation: string;
  differentiators: string[];
  /** Verbatim-grounded claims. Anything not here may not be asserted on screen. */
  provenClaims: string[];
  /** Real, filmable places this business physically exists in. */
  environments: string[];
  /** The reason a ready customer still hesitates. The commercial must answer it. */
  objection: string;
  tone: string;
  palette: string[];
  /** False when the page could not be read and this is inferred from a name alone. */
  sourced: boolean;
};

/**
 * The strategy, decided before a single shot is described. A brief that could
 * belong to any business in the category is a failed brief.
 */
export type CreativeBrief = {
  angle: string;
  angleRationale: string;
  audience: string;
  promise: string;
  objectionToKill: string;
  emotionalArc: string;
  /** The line the viewer should be able to repeat afterwards. */
  takeaway: string;
  visualSystem: string;
  musicDirection: string;
  /** Why a customer trusts this business more after watching. */
  trustMechanism: string;
};

export type Scene = {
  beat: BeatId;
  seconds: number;
  shotSize: ShotSize;
  cameraMove: CameraMove;
  /** What is physically in frame. A person, an object, a place — never a mood. */
  subject: string;
  /** What changes during the shot. A shot with no change is a photograph. */
  action: string;
  location: string;
  /** What this shot proves with the sound off. The muted test lives here. */
  visualStory: string;
  onScreenText: string;
  voiceover: string;
  transitionOut: Transition;
  /** True only where a presenter is on camera. The DNA caps how many may be. */
  presenter: boolean;
};

export type Storyboard = {
  title: string;
  logline: string;
  angle: string;
  visualSystem: string;
  music: string;
  totalSeconds: number;
  scenes: Scene[];
  endCard: { line: string; cta: string };
};

/**
 * The creative review. Deliberately not a checklist of whether the pipeline
 * completed — the two booleans are the gate, and no combination of good scores
 * can pass a storyboard a customer would not watch or would not trust.
 */
export type Review = {
  wouldWatch: boolean;
  wouldTrust: boolean;
  scores: {
    trust: number;
    professionalism: number;
    storyClarity: number;
    visualStorytelling: number;
    persuasion: number;
  };
  overall: number;
  verdict: "pass" | "redirect";
  strengths: string[];
  failures: string[];
  /** On a redirect: what a genuinely different attempt must do differently. */
  directive: string;
};

/**
 * The identity of a creative direction. Two attempts sharing a fingerprint are
 * the same commercial with different words, which is the failure this whole
 * module exists to prevent.
 */
export type Direction = {
  angle: string;
  visualSystem: string;
  /** The shot grammar of the first frame: size and camera move. */
  openingShot: string;
  /**
   * What is physically in the first frame.
   *
   * Kept apart from openingShot because the grammar alone cannot tell two
   * commercials apart — "medium wide / pull back reveal" is true of a face, a
   * van and a child's hand alike. Without the subject, the retry briefing could
   * not name the image it was asking for something different from, and three
   * "different" concepts happily opened on the same picture.
   */
  openingSubject: string;
  structure: string;
};

/** One full pass of the director: strategy, board, and the verdict on it. */
export type Attempt = {
  brief: CreativeBrief;
  storyboard: Storyboard;
  review: Review;
  direction: Direction;
  /** Structural rule violations found in code, not by the model. */
  violations: string[];
};
