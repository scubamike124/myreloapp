"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Tool, Field } from "@/lib/tools";
import { TOOLS, IMAGE_TOOLS, LIVE_TOOLS, VIDEO_TOOLS } from "@/lib/tools";
import { recordCreation } from "@/lib/workspace";
import { downloadMedia } from "@/lib/download-media";
import { materializeVideoUrl } from "@/lib/materialize-video";
import { playSyncedWithSound } from "@/lib/play-synced";
import SmoothVideo from "./SmoothVideo";
import { useTokens, TokenMeter, NotEnoughTokens, shortfallFrom, type Shortfall } from "./TokenMeter";
import DurationPicker from "./DurationPicker";
import { compressImageForUpload } from "@/lib/compress-image";
import { PHOTO_SIZE_HINT, VEO_MAX_SECONDS } from "@/lib/upload-limits";
import { defaultDurationSeconds } from "@/lib/token-costs";

type Status = "idle" | "generating" | "done";

function stagesFor(slug: string): string[] {
  if (slug === "website-commercial" || slug === "shorts-20")
    return ["Scanning your website…", "Extracting brand colors & copy…", "Writing the script…", "Rendering cinematic scenes…", "Adding voiceover & music…", "Finalizing your video…"];
  if (slug.includes("avatar"))
    return ["Analyzing your photo…", "Building the avatar…", "Generating lip-sync…", "Rendering frames…", "Finalizing your video…"];
  return ["Preparing your assets…", "Generating motion…", "Syncing audio…", "Rendering frames…", "Finalizing your video…"];
}

// Tool availability lives in lib/tools.ts so this page and Amber can never
// disagree about which tools actually work.

function avatarPrompt(slug: string, values: Record<string, string>): string {
  const lang = (values.language || "English").trim();
  if (slug === "dancing-photo") {
    const move = values.move ? `${values.move} ` : "";
    const music = values.music ? ` Soundtrack style: ${values.music}.` : "";
    return `The person in the photo performs an energetic, joyful ${move}dance — dynamic full-body motion, rhythmic and lively, dancing to clear upbeat music with an audible soundtrack, big smile. Include synchronized music and ambient sound.${music}`;
  }
  // talking-photo — language must be spoken, not English by default when another is chosen
  const script = (values.script || "").trim();
  const langLine =
    lang && !/^english$/i.test(lang)
      ? ` Speak the entire dialogue clearly in ${lang} (not English). Pronunciation and wording must be natural ${lang}.`
      : ` Speak clearly in English.`;
  return script
    ? `A close-up of the person in the photo looking at the camera and speaking naturally with clear audible speech, lip-syncing exactly: "${script}".${langLine} Subtle natural head movement, engaging eye contact. The spoken words must be clearly audible throughout.`
    : `A close-up of the person in the photo looking at the camera and speaking naturally with clear audible speech and lip-sync.${langLine} Subtle natural head movement. Spoken audio must be clearly present.`;
}

function avatarImagePrompt(values: Record<string, string>): string {
  const style = values.style || "3D Character";
  const looks: Record<string, string> = {
    "3D Character": "a polished 3D animated character avatar in the style of a modern Pixar / DreamWorks movie — smooth stylized 3D render, slightly exaggerated friendly features, big expressive eyes, soft studio lighting",
    Cartoon: "a clean 2D cartoon character avatar — bold outlines, vibrant flat colors, friendly modern illustration",
    Anime: "a high-quality anime character avatar — expressive anime eyes, cel-shaded illustration, detailed hair",
    "Realistic Studio": "a hyper-polished professional studio-headshot avatar — crisp, magazine-quality, clean neutral background",
    Cinematic: "a dramatic cinematic portrait avatar — moody film lighting, shallow depth of field, premium look",
  };
  const look = looks[style] || "a polished stylized character avatar";
  const name = values.name ? ` Avatar name: "${values.name}".` : "";
  return `Transform the person in this photo into ${look}. Keep their recognizable features (face shape, hairstyle, skin tone, glasses/beard if present) but render them clearly as a STYLIZED AVATAR — do NOT return a copy of the original photograph. Head-and-shoulders, centered, profile-picture framing, clean background, high quality.${name}`;
}

function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] || "");
    r.onerror = () => reject(new Error("Could not read the photo."));
    r.readAsDataURL(file);
  });
}

/**
 * Poll a Veo render started by /api/generate-avatar until the clip is ready.
 * The render is asynchronous now, so the browser checks its status every few
 * seconds rather than the server holding one request open for minutes.
 */
async function pollVeo(pollUrl: string, maxTries = 90): Promise<string> {
  for (let i = 0; i < maxTries; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const res = await fetch(pollUrl);
    const d = await res.json();
    if (d.status === "completed" && d.videoUrl) return d.videoUrl as string;
    if (d.status === "failed") throw new Error(d.error || "Generation failed.");
    // "processing" — keep polling.
  }
  throw new Error("Video is taking too long — please try again.");
}

export default function ToolStudio({ tool }: { tool: Tool }) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    for (const f of tool.fields) {
      if (f.kind === "select" || f.kind === "segment") v[f.name] = f.options[0];
      if (f.kind === "slider") v[f.name] = String(f.default);
      if (f.kind === "choices" && f.options[0]) v[f.name] = f.options[0].value;
    }
    return v;
  });
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [multi, setMulti] = useState<Record<string, string[]>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(true);
  const [needsGesture, setNeedsGesture] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [short, setShort] = useState<Shortfall | null>(null);
  const [seconds, setSeconds] = useState(() => defaultDurationSeconds(tool.slug) || 6);
  const tokens = useTokens();
  const revokeRef = useRef<(() => void) | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const filesRef = useRef<Record<string, File>>({});
  const isVideoTool = VIDEO_TOOLS.has(tool.slug);
  const isImageTool = IMAGE_TOOLS.has(tool.slug);
  const isLive = LIVE_TOOLS.has(tool.slug);

  /** Short label for the workspace entry — the script's opening, or the input. */
  const creationTitle = (): string => {
    const script = (values.script || values.prompt || values.topic || "").trim();
    if (script) return script.length > 60 ? `${script.slice(0, 57)}…` : script;
    if (values.name) return values.name;
    if (values.url) return values.url;
    return tool.title;
  };

  const stages = stagesFor(tool.slug);
  const stageText = stages[Math.min(stages.length - 1, Math.floor((progress / 100) * stages.length))];

  const set = (name: string, value: string) => setValues((v) => ({ ...v, [name]: value }));
  const toggleMulti = (name: string, opt: string) =>
    setMulti((m) => {
      const cur = m[name] ?? [];
      return { ...m, [name]: cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt] };
    });
  const onFile = (name: string, file?: File) => {
    if (!file) return;
    filesRef.current[name] = file;
    setPreviews((p) => ({ ...p, [name]: URL.createObjectURL(file) }));
    set(name, file.name);
    setErr(null);
  };

  // Arriving from the Avatar Library with ?avatar=<id>, or Shorts with ?script=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const wantedScript = params.get("script");
    if (wantedScript) set("script", wantedScript.slice(0, 2000));

    const wanted = params.get("avatar");
    if (!wanted) return;
    const field = tool.fields.find((f) => f.kind === "upload");
    if (!field) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/avatars?id=${encodeURIComponent(wanted)}`);
        const data = await res.json();
        if (!res.ok || !data.avatar?.image || cancelled) return;
        const img = await fetch(data.avatar.image);
        const blob = await img.blob();
        if (cancelled) return;
        const ext = blob.type.includes("webp") ? "webp" : "png";
        onFile(field.name, new File([blob], `${data.avatar.name}.${ext}`, { type: blob.type || "image/png" }));
      } catch {
        /* the normal upload control still works */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generate = async () => {
    setErr(null);
    setShort(null);

    // Real image-to-video path (Dancing / Talking Photo).
    if (isVideoTool) {
      const uploadField = tool.fields.find((f) => f.kind === "upload");
      // Avatar-style choices have img previews; dance "move" choices do not —
      // never treat move options as a substitute for the uploaded photo.
      const avatarChoiceField = tool.fields.find(
        (f) => f.kind === "choices" && f.options.some((o) => Boolean(o.img)),
      );
      if (uploadField && !filesRef.current[uploadField.name] && !avatarChoiceField) {
        setErr("Please upload a photo first.");
        return;
      }
      if (uploadField && !filesRef.current[uploadField.name] && avatarChoiceField && !values[avatarChoiceField.name]) {
        setErr("Please upload a photo or choose an avatar.");
        return;
      }
      // Dancing / talking always need the photo when an upload field exists.
      if (uploadField && !filesRef.current[uploadField.name] && tool.slug === "dancing-photo") {
        setErr("Please upload a photo first.");
        return;
      }
      if (uploadField && !filesRef.current[uploadField.name] && tool.slug === "talking-photo") {
        setErr("Please upload a photo first.");
        return;
      }
      setStatus("generating");
      setProgress(0);
      if (timer.current) clearInterval(timer.current);
      timer.current = setInterval(() => setProgress((p) => Math.min(95, p + 1)), 2200);
      try {
        // Resolve the source image: uploaded file, or the selected preset avatar.
        let base64 = "";
        let mime = "image/jpeg";
        const file = uploadField ? filesRef.current[uploadField.name] : undefined;
        if (file) {
          const compressed = await compressImageForUpload(file, {
            maxEdge: tool.slug === "dancing-photo" ? 1024 : 1280,
            quality: 0.8,
            maxBytes: 3 * 1024 * 1024,
          });
          base64 = compressed.base64;
          mime = compressed.mimeType;
        } else if (avatarChoiceField && avatarChoiceField.kind === "choices") {
          const sel = values[avatarChoiceField.name] || avatarChoiceField.options[0]?.value;
          const opt = avatarChoiceField.options.find((o) => o.value === sel) || avatarChoiceField.options[0];
          if (!opt?.img) throw new Error("Please choose an avatar.");
          const blob = await (await fetch(opt.img)).blob();
          const compressed = await compressImageForUpload(blob, {
            maxEdge: 1024,
            quality: 0.8,
            maxBytes: 3 * 1024 * 1024,
          });
          base64 = compressed.base64;
          mime = compressed.mimeType;
        } else {
          throw new Error("Please upload a photo first.");
        }
        const res = await fetch("/api/generate-avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType: mime,
            prompt: avatarPrompt(tool.slug, values),
            action: tool.slug,
            seconds,
          }),
        });
        const data = await res.json();

        // Out of tokens: nothing generated, nothing charged, no failed
        // creation to record — just the purchase panel.
        const gap = await shortfallFrom(res, data);
        if (gap) { if (timer.current) clearInterval(timer.current); setShort(gap); setProgress(0); setStatus("idle"); return; }

        if (!res.ok || !data.ok) {
          throw new Error(
            data.error ||
              (tool.slug === "dancing-photo"
                ? "Dancing video failed to start. Try a clearer JPG/PNG photo (not HEIC) under ~8MB."
                : "Generation failed."),
          );
        }
        tokens.setBalance(data.balance);

        // The render now runs asynchronously — the POST returns a handle and we
        // poll until the clip is ready, instead of the server holding the whole
        // request open for minutes.
        let remoteUrl: string;
        try {
          remoteUrl = await pollVeo(data.poll as string);
        } catch (pollErr) {
          throw new Error(
            pollErr instanceof Error
              ? pollErr.message
              : "Video render failed. Try again with a different photo.",
          );
        }
        if (timer.current) clearInterval(timer.current);
        revokeRef.current?.();
        let local: { url: string; revoke?: (() => void) | null };
        try {
          local = await materializeVideoUrl(remoteUrl);
        } catch {
          throw new Error("Video was created but could not be loaded for playback. Try Download again in a moment.");
        }
        revokeRef.current = local.revoke ?? null;
        setVideoUrl(local.url);
        setMuted(true);
        setNeedsGesture(true);
        setProgress(100);
        setStatus("done");
        recordCreation({
          toolSlug: tool.slug,
          toolTitle: tool.title,
          title: creationTitle(),
          status: "completed",
          kind: "video",
          mediaUrl: local.url,
        });
      } catch (e) {
        if (timer.current) clearInterval(timer.current);
        const message = e instanceof Error ? e.message : "Generation failed.";
        setErr(message);
        setStatus("idle");
        recordCreation({
          toolSlug: tool.slug,
          toolTitle: tool.title,
          title: creationTitle(),
          status: "failed",
          kind: "video",
          error: message,
        });
      }
      return;
    }

    // Real avatar IMAGE path (Custom Avatar Creator).
    if (isImageTool) {
      const uploadField = tool.fields.find((f) => f.kind === "upload");
      const file = uploadField ? filesRef.current[uploadField.name] : undefined;
      if (!file) {
        setErr("Please upload a photo first.");
        return;
      }
      setStatus("generating");
      setProgress(0);
      if (timer.current) clearInterval(timer.current);
      timer.current = setInterval(() => setProgress((p) => Math.min(95, p + 3)), 400);
      try {
        const { base64: imageBase64, mimeType } = await compressImageForUpload(file);
        const res = await fetch("/api/generate-avatar-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64, mimeType, prompt: avatarImagePrompt(values) }),
        });
        const data = await res.json();
        if (timer.current) clearInterval(timer.current);

        const gap = await shortfallFrom(res, data);
        if (gap) { setShort(gap); setProgress(0); setStatus("idle"); return; }

        if (!res.ok || !data.ok) throw new Error(data.error || "Generation failed.");
        tokens.setBalance(data.balance);
        setImageUrl(data.imageUrl);
        setProgress(100);
        setStatus("done");
        recordCreation({
          toolSlug: tool.slug,
          toolTitle: tool.title,
          title: creationTitle(),
          status: "completed",
          kind: "image",
          mediaUrl: data.imageUrl,
        });
      } catch (e) {
        if (timer.current) clearInterval(timer.current);
        const message = e instanceof Error ? e.message : "Generation failed.";
        setErr(message);
        setStatus("idle");
        recordCreation({
          toolSlug: tool.slug,
          toolTitle: tool.title,
          title: creationTitle(),
          status: "failed",
          kind: "image",
          error: message,
        });
      }
      return;
    }

    // No other tool has a generation backend yet. Previously this ran a fake
    // progress bar and presented a stock demo clip as the user's result.
    setErr("This tool isn't available yet — nothing was generated.");
  };

  const reset = () => {
    if (timer.current) clearInterval(timer.current);
    setStatus("idle");
    setProgress(0);
    setVideoUrl("");
    setImageUrl("");
    setErr(null);
    setShort(null);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  return (
    <div className="relative min-h-screen text-white" style={{ background: "#0a0607" }}>
      <div aria-hidden className="pointer-events-none fixed inset-0" style={{ backgroundImage: "radial-gradient(900px 500px at 70% -5%,rgba(225,29,42,.16),transparent 60%)" }} />
      <div aria-hidden className="pointer-events-none fixed inset-0" style={{ backgroundImage: "radial-gradient(rgba(255,70,85,.05) 1px,transparent 1px)", backgroundSize: "26px 26px" }} />

      {/* top bar */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/create" className="flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span className="font-display grid h-7 w-7 place-items-center rounded-lg text-xs font-bold" style={{ background: "linear-gradient(135deg,#ff3645,#b3121d)" }}>R</span>
            Create
          </Link>
          <TokenMeter slug={tool.slug} tokens={tokens} variant="chip" seconds={isVideoTool ? seconds : undefined} />
        </div>
      </header>

      <div className="relative z-[1] mx-auto max-w-6xl px-4 py-9 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#ff5663" }}>Studio</p>
        <h1 className="font-display mt-1 text-3xl font-bold tracking-[-0.02em] sm:text-4xl">{tool.title}</h1>
        <p className="mt-2" style={{ color: "#a99a9c" }}>{tool.tagline}</p>

        <div className="mt-7 grid gap-6 lg:grid-cols-5">
          {/* form */}
          <div className="lg:col-span-3">
            <div className="space-y-6 rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-md sm:p-7">
              {!isLive && <ComingSoon tool={tool} />}
              {/* A disabled fieldset natively disables every control inside, so
                  an unavailable tool cannot collect input it will never use. */}
              <fieldset disabled={!isLive} className="space-y-6 border-0 p-0 disabled:opacity-55">
                {tool.fields.map((f) => (
                  <FieldView key={f.name} field={f} value={values[f.name] ?? ""} preview={previews[f.name]} selected={multi[f.name] ?? []} onChange={(v) => set(f.name, v)} onFile={(file) => onFile(f.name, file)} onToggle={(opt) => toggleMulti(f.name, opt)} />
                ))}
              </fieldset>
              {isVideoTool && (
                <DurationPicker action={tool.slug} value={seconds} onChange={setSeconds} />
              )}
              {isVideoTool && (
                <p
                  className="rounded-xl px-3.5 py-2.5 text-[12.5px] leading-relaxed"
                  style={{ border: "1px solid rgba(255,70,85,.25)", background: "rgba(255,60,75,.06)", color: "#ffb3b9" }}
                >
                  Photo videos max out at {VEO_MAX_SECONDS} seconds. For a longer talking video (up to ~30s),{" "}
                  <Link href="/create/ai-avatar-studio" className="font-semibold underline underline-offset-2">
                    open AI Avatar Studio and pick an avatar
                  </Link>
                  .
                </p>
              )}
              <button onClick={generate} disabled={status === "generating" || !isLive} className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-bold text-white transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)", boxShadow: "0 10px 28px -8px rgba(225,29,42,.6)" }}>
                {status === "generating" ? <><Spinner /> Generating…</> : <><svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>{!isLive ? "Not available yet" : status === "done" ? "Regenerate" : tool.cta}</>}
              </button>
              {short && <NotEnoughTokens {...short} />}
              {err && <p role="alert" className="text-sm font-medium text-[#ff8a92]">{err}</p>}
              {isVideoTool && status !== "generating" && !err && !short && (
                <p className="text-center text-xs text-white/40">
                  {tool.slug === "dancing-photo"
                    ? `Upload a JPG/PNG under ~8MB, pick a move, then generate (~${seconds}s AI video, ~1–3 min).`
                    : `Generates a real ~${seconds}s AI video from your photo (~1–3 min).`}
                </p>
              )}
              {(isVideoTool || isImageTool) && (
                <p className="text-center text-[11px] leading-relaxed text-white/35">{PHOTO_SIZE_HINT}</p>
              )}
            </div>
          </div>

          {/* preview / result */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 rounded-3xl border border-white/10 bg-black/40 p-4 backdrop-blur-md">
              <p className="mb-3 px-2 text-sm font-semibold text-white/70">{status === "done" ? "Your video" : "Preview"}</p>
              <div className="relative aspect-[9/16] overflow-hidden rounded-2xl border border-white/10 bg-black">
                {status === "done" && isImageTool ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt="Generated avatar" className="absolute inset-0 h-full w-full object-cover" />
                ) : status === "done" ? (
                  <>
                    <SmoothVideo
                      ref={videoRef}
                      key={videoUrl}
                      src={videoUrl}
                      className="absolute inset-0 h-full w-full object-cover"
                      muted={muted}
                      controls
                    />
                    {needsGesture && (
                      <button
                        type="button"
                        onClick={() => {
                          const v = videoRef.current;
                          if (!v) return;
                          setMuted(false);
                          void playSyncedWithSound(v)
                            .then(() => setNeedsGesture(false))
                            .catch(() => {});
                        }}
                        className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/70 px-4 text-center"
                      >
                        <span className="grid h-14 w-14 place-items-center rounded-full text-white" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><polygon points="8 5 20 12 8 19" /></svg>
                        </span>
                        <span className="text-base font-bold text-white">Tap to play with sound</span>
                      </button>
                    )}
                  </>
                ) : (
                  <Image src={tool.poster} alt="" fill className={`object-cover transition ${status === "generating" ? "opacity-25" : "opacity-100"}`} />
                )}

                {/* generating overlay with staged status */}
                {status === "generating" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/55">
                    <Spinner large />
                    <div className="w-3/4">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: "linear-gradient(90deg,#ff3645,#c4101c)" }} /></div>
                      <p className="mt-2.5 text-center text-[13px] font-medium text-white/85">{stageText}</p>
                      <p className="mt-0.5 text-center text-xs text-white/45">{progress}%</p>
                    </div>
                  </div>
                )}

                {/* done: unmute chip only if overlay dismissed but still muted */}
                {status === "done" && !isImageTool && muted && !needsGesture && (
                  <div className="absolute inset-x-0 top-0 flex items-center justify-end p-3">
                    <button onClick={toggleMute} aria-label="Unmute" className="grid h-9 w-9 place-items-center rounded-full text-white" style={{ background: "rgba(10,6,8,.6)", backdropFilter: "blur(4px)" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5z" /><path d="M22 9l-6 6M16 9l6 6" /></svg>
                    </button>
                  </div>
                )}

              </div>

              {status === "done" && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid rgba(255,70,85,.3)", background: "rgba(255,70,85,.1)", color: "#ffb3b9" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Your {tool.title.toLowerCase()} is ready!
                  </div>

                  {/* Download it and post it yourself — Reelo has no social
                      publishing integration, so we do not pretend to have one. */}
                  <p className="text-xs leading-relaxed text-white/45">
                    Download your {isImageTool ? "image" : "video"} to post it. Direct publishing to TikTok, Instagram
                    and YouTube isn&apos;t connected yet.
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        void downloadMedia(
                          isImageTool ? imageUrl : videoUrl,
                          `reelo-${tool.slug}.${isImageTool ? "png" : "mp4"}`,
                        )
                      }
                      className="flex items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
                      style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
                      Download
                    </button>
                    <button onClick={reset} className="flex items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-2.5 text-sm font-semibold hover:bg-white/10">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 4v4h-4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      New
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Shown for tools that have no generation backend yet. Says so directly and
 * points at the tools that do work, instead of leaving a dead-end page.
 */
function ComingSoon({ tool }: { tool: Tool }) {
  const live = TOOLS.filter((t) => LIVE_TOOLS.has(t.slug) && t.slug !== tool.slug).slice(0, 3);
  return (
    <div
      className="rounded-2xl px-4 py-3.5"
      style={{ border: "1px solid rgba(255,159,67,.3)", background: "rgba(255,159,67,.07)" }}
    >
      <p className="text-sm font-bold" style={{ color: "#ffcf9a" }}>
        {tool.title} isn&apos;t available yet
      </p>
      <p className="mt-1 text-xs leading-relaxed text-white/55">
        You can see the inputs it will take, but generation isn&apos;t connected — so nothing here will produce a video
        yet. These tools work right now:
      </p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {live.map((t) => (
          <Link
            key={t.slug}
            href={`/create/${t.slug}`}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 transition-colors hover:border-[rgba(255,70,85,.45)] hover:text-white"
          >
            {t.title}
          </Link>
        ))}
      </div>
    </div>
  );
}

function FieldView({ field, value, preview, selected, onChange, onFile, onToggle }: {
  field: Field; value: string; preview?: string; selected: string[];
  onChange: (v: string) => void; onFile: (f?: File) => void; onToggle: (opt: string) => void;
}) {
  const label = <label className="mb-2 block text-sm font-semibold text-white/85">{"label" in field ? field.label : ""}</label>;
  const inputCls = "w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/35 outline-none transition focus:border-[rgba(255,70,85,.6)]";
  const inputStyle = { border: "1px solid rgba(255,70,85,.22)", background: "rgba(255,60,75,.04)" } as const;

  switch (field.kind) {
    case "url":
    case "text":
      return <div>{label}<input type={field.kind === "url" ? "url" : "text"} value={value} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} className={inputCls} style={inputStyle} />{field.hint && <p className="mt-1.5 text-xs text-white/40">{field.hint}</p>}</div>;
    case "textarea":
      return <div>{label}<textarea rows={4} value={value} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} className={`${inputCls} resize-none`} style={inputStyle} />{field.hint && <p className="mt-1.5 text-xs text-white/40">{field.hint}</p>}</div>;
    case "select":
      return <div>{label}<select value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} appearance-none`} style={inputStyle}>{field.options.map((o) => <option key={o} value={o} className="bg-[#140a0c]">{o}</option>)}</select></div>;
    case "segment":
      return (
        <div>{label}
          <div className="inline-flex w-full gap-1 rounded-xl p-1" style={inputStyle}>
            {field.options.map((o) => <button key={o} onClick={() => onChange(o)} className="flex-1 rounded-lg py-2 text-sm font-semibold transition-colors" style={value === o ? { background: "linear-gradient(135deg,#ff3645,#c4101c)", color: "#fff" } : { color: "#b9a9ab" }}>{o}</button>)}
          </div>
        </div>
      );
    case "slider":
      return (
        <div>
          <div className="mb-2 flex items-center justify-between"><label className="text-sm font-semibold text-white/85">{field.label}</label><span className="rounded-md px-2 py-0.5 text-sm font-medium" style={{ background: "rgba(255,70,85,.12)", color: "#ff8a92" }}>{value || field.default}{field.unit ?? ""}</span></div>
          <input type="range" min={field.min} max={field.max} step={field.step} value={value || field.default} onChange={(e) => onChange(e.target.value)} className="w-full accent-[#ff3645]" />
        </div>
      );
    case "multi":
      return (
        <div>{label}
          <div className="flex flex-wrap gap-2">
            {field.options.map((o) => { const on = selected.includes(o); return <button key={o} onClick={() => onToggle(o)} className="rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors" style={on ? { background: "linear-gradient(135deg,#ff3645,#c4101c)", color: "#fff" } : { border: "1px solid rgba(255,70,85,.2)", color: "#b9a9ab" }}>{o}</button>; })}
          </div>
        </div>
      );
    case "upload":
      return (
        <div>{label}
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl px-4 py-8 text-center transition hover:border-[rgba(255,70,85,.5)]" style={{ border: "2px dashed rgba(255,70,85,.3)", background: "rgba(255,60,75,.02)" }}>
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="preview" className="h-28 w-28 rounded-xl object-cover" />
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff5663" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4m0 0L8 8m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
            )}
            <span className="text-sm font-medium text-white/70">{preview ? value : "Click to upload"}</span>
            <span className="text-xs text-white/40">{preview ? "Change file" : field.hint ?? PHOTO_SIZE_HINT}</span>
            {!preview && field.hint && (
              <span className="max-w-xs text-[11px] leading-relaxed text-white/30">{PHOTO_SIZE_HINT}</span>
            )}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
        </div>
      );
    case "choices":
      return (
        <div>{label}
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {field.options.map((o) => { const on = value === o.value; return (
              <button key={o.value} onClick={() => onChange(o.value)} className="flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center transition" style={on ? { border: "1px solid #ff3645", background: "rgba(255,70,85,.1)" } : { border: "1px solid rgba(255,70,85,.15)", background: "rgba(255,60,75,.03)" }}>
                {o.img ? (
                  <span className="relative h-14 w-14 overflow-hidden rounded-xl">
                    <Image src={o.img} alt={o.label} fill sizes="56px" className="object-cover" />
                  </span>
                ) : (
                  <span className="text-2xl">{o.icon}</span>
                )}
                <span className="text-xs font-medium" style={{ color: on ? "#ffb3b9" : "#b9a9ab" }}>{o.label}</span>
              </button>
            ); })}
          </div>
        </div>
      );
  }
}

function Spinner({ large }: { large?: boolean }) {
  const s = large ? 46 : 18;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className="animate-spin">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
