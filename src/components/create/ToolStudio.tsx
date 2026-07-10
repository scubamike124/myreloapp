"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Tool, Field } from "@/lib/tools";

type Status = "idle" | "generating" | "done";
type UploadStage = "connecting" | "uploading" | "posted";

const RESULT_VIDEO = "/assets/hero-video.mp4";

const PLATFORMS: { name: string; bg: string; icon: string }[] = [
  { name: "TikTok", bg: "#000000", icon: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" },
  { name: "Instagram", bg: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)", icon: "M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077" },
  { name: "YouTube", bg: "#FF0000", icon: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" },
  { name: "Facebook", bg: "#1877F2", icon: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
];

function stagesFor(slug: string): string[] {
  if (slug === "website-commercial" || slug === "shorts-20")
    return ["Scanning your website…", "Extracting brand colors & copy…", "Writing the script…", "Rendering cinematic scenes…", "Adding voiceover & music…", "Finalizing your video…"];
  if (slug.includes("avatar"))
    return ["Analyzing your photo…", "Building the avatar…", "Generating lip-sync…", "Rendering frames…", "Finalizing your video…"];
  return ["Preparing your assets…", "Generating motion…", "Syncing audio…", "Rendering frames…", "Finalizing your video…"];
}

// Tools that generate a REAL video (Veo image-to-video) from a photo or preset avatar.
const VIDEO_TOOLS = new Set(["talking-photo", "dancing-photo", "ai-avatar-studio"]);
// Tools that generate a REAL avatar IMAGE from the uploaded photo.
const IMAGE_TOOLS = new Set(["custom-avatar-creator"]);

function avatarPrompt(slug: string, values: Record<string, string>): string {
  if (slug === "dancing-photo") {
    const move = values.move ? `${values.move} ` : "";
    return `The person in the photo performs an energetic, joyful ${move}dance — dynamic full-body motion, rhythmic and lively, as if singing and dancing to upbeat music, big smile.`;
  }
  if (slug === "ai-avatar-studio") {
    const script = (values.script || "").trim();
    return script
      ? `The avatar looks into the camera and speaks naturally and professionally, lip-syncing the words: "${script}". Confident, engaging on-camera presenter, subtle natural head movement.`
      : `The avatar looks into the camera and speaks naturally as a confident, engaging on-camera presenter with natural lip movement.`;
  }
  // talking-photo
  const script = (values.script || "").trim();
  return script
    ? `The person in the photo sings and speaks expressively, lip-syncing the words: "${script}". Natural head movement, engaging eye contact, lively facial expression.`
    : `The person in the photo talks and sings expressively with natural lip movement and lively facial expression.`;
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

export default function ToolStudio({ tool }: { tool: Tool }) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    for (const f of tool.fields) {
      if (f.kind === "select" || f.kind === "segment") v[f.name] = f.options[0];
      if (f.kind === "slider") v[f.name] = String(f.default);
    }
    return v;
  });
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [multi, setMulti] = useState<Record<string, string[]>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [muted, setMuted] = useState(true);
  const [upload, setUpload] = useState<{ platform: string; bg: string; stage: UploadStage; pct: number } | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const upTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const filesRef = useRef<Record<string, File>>({});
  const isVideoTool = VIDEO_TOOLS.has(tool.slug);
  const isImageTool = IMAGE_TOOLS.has(tool.slug);

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

  const generate = async () => {
    setUpload(null);
    setErr(null);

    // Real image-to-video path (Dancing / Talking Photo, AI Avatar Studio).
    if (isVideoTool) {
      const uploadField = tool.fields.find((f) => f.kind === "upload");
      const choiceField = tool.fields.find((f) => f.kind === "choices");
      // Upload-based tools require a photo; preset-avatar tools always have one selected.
      if (uploadField && !choiceField && !filesRef.current[uploadField.name]) {
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
          base64 = await fileToBase64(file);
          mime = file.type || "image/jpeg";
        } else if (choiceField && choiceField.kind === "choices") {
          const sel = values[choiceField.name] || choiceField.options[0]?.value;
          const opt = choiceField.options.find((o) => o.value === sel) || choiceField.options[0];
          if (!opt?.img) throw new Error("Please choose an avatar.");
          const blob = await (await fetch(opt.img)).blob();
          base64 = await fileToBase64(blob);
          mime = blob.type || "image/jpeg";
        } else {
          throw new Error("Please upload a photo first.");
        }
        const res = await fetch("/api/generate-avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mimeType: mime, prompt: avatarPrompt(tool.slug, values) }),
        });
        const data = await res.json();
        if (timer.current) clearInterval(timer.current);
        if (!res.ok || !data.ok) throw new Error(data.error || "Generation failed.");
        setVideoUrl(data.videoUrl);
        setProgress(100);
        setStatus("done");
      } catch (e) {
        if (timer.current) clearInterval(timer.current);
        setErr(e instanceof Error ? e.message : "Generation failed.");
        setStatus("idle");
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
        const imageBase64 = await fileToBase64(file);
        const res = await fetch("/api/generate-avatar-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64, mimeType: file.type || "image/jpeg", prompt: avatarImagePrompt(values) }),
        });
        const data = await res.json();
        if (timer.current) clearInterval(timer.current);
        if (!res.ok || !data.ok) throw new Error(data.error || "Generation failed.");
        setImageUrl(data.imageUrl);
        setProgress(100);
        setStatus("done");
      } catch (e) {
        if (timer.current) clearInterval(timer.current);
        setErr(e instanceof Error ? e.message : "Generation failed.");
        setStatus("idle");
      }
      return;
    }

    // Simulated path (other tools).
    setStatus("generating");
    setProgress(0);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          if (timer.current) clearInterval(timer.current);
          setStatus("done");
          return 100;
        }
        return p + 2;
      });
    }, 70);
  };
  const reset = () => {
    if (timer.current) clearInterval(timer.current);
    if (upTimer.current) clearInterval(upTimer.current);
    setStatus("idle");
    setProgress(0);
    setUpload(null);
  };
  const copyLink = () => {
    try {
      navigator.clipboard?.writeText(`https://reelo.app/v/${tool.slug}-demo`);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const startUpload = (platform: string, bg: string) => {
    if (upTimer.current) clearInterval(upTimer.current);
    setUpload({ platform, bg, stage: "connecting", pct: 0 });
    let tick = 0;
    upTimer.current = setInterval(() => {
      tick++;
      setUpload((u) => {
        if (!u) return u;
        if (u.stage === "connecting") return tick > 13 ? { ...u, stage: "uploading", pct: 0 } : u;
        if (u.stage === "uploading") {
          const np = u.pct + 4;
          if (np >= 100) {
            if (upTimer.current) clearInterval(upTimer.current);
            return { ...u, stage: "posted", pct: 100 };
          }
          return { ...u, pct: np };
        }
        return u;
      });
    }, 90);
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
          <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ border: "1px solid rgba(255,70,85,.2)", color: "#cabcbe" }}>{tool.credits}</span>
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
              {tool.fields.map((f) => (
                <FieldView key={f.name} field={f} value={values[f.name] ?? ""} preview={previews[f.name]} selected={multi[f.name] ?? []} onChange={(v) => set(f.name, v)} onFile={(file) => onFile(f.name, file)} onToggle={(opt) => toggleMulti(f.name, opt)} />
              ))}
              <button onClick={generate} disabled={status === "generating"} className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-bold text-white transition-transform hover:scale-[1.01] disabled:opacity-60" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)", boxShadow: "0 10px 28px -8px rgba(225,29,42,.6)" }}>
                {status === "generating" ? <><Spinner /> Generating…</> : <><svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>{status === "done" ? "Regenerate" : tool.cta}</>}
              </button>
              {err && <p className="text-sm font-medium text-[#ff8a92]">{err}</p>}
              {isVideoTool && status !== "generating" && !err && (
                <p className="text-center text-xs text-white/40">Generates a real AI video from your photo (~1–2 min).</p>
              )}
              {isImageTool && status !== "generating" && !err && (
                <p className="text-center text-xs text-white/40">Generates a real AI avatar image from your photo (~15–30s).</p>
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
                  <video ref={videoRef} src={videoUrl || RESULT_VIDEO} className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline />
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

                {/* done: minimal player controls (video only) */}
                {status === "done" && !upload && !isImageTool && (
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-3">
                    <span className="rounded-md px-2 py-1 text-[11px] font-semibold text-white" style={{ background: "rgba(10,6,8,.6)", backdropFilter: "blur(4px)" }}>Preview</span>
                    <button onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} className="grid h-9 w-9 place-items-center rounded-full text-white" style={{ background: "rgba(10,6,8,.6)", backdropFilter: "blur(4px)" }}>
                      {muted ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5z" /><path d="M22 9l-6 6M16 9l6 6" /></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></svg>
                      )}
                    </button>
                  </div>
                )}

                {/* upload flow overlay */}
                {upload && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 p-6 text-center" style={{ background: "rgba(6,3,4,.86)", backdropFilter: "blur(6px)" }}>
                    {upload.stage === "connecting" && (
                      <>
                        <PlatBadge bg={upload.bg} />
                        <Spinner large />
                        <p className="text-sm font-semibold">Connecting to {upload.platform}…</p>
                      </>
                    )}
                    {upload.stage === "uploading" && (
                      <>
                        <PlatBadge bg={upload.bg} />
                        <p className="text-sm font-semibold">Uploading to {upload.platform}…</p>
                        <div className="w-3/4">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full" style={{ width: `${upload.pct}%`, background: "linear-gradient(90deg,#ff3645,#c4101c)" }} /></div>
                          <p className="mt-2 text-xs text-white/55">{upload.pct}%</p>
                        </div>
                      </>
                    )}
                    {upload.stage === "posted" && (
                      <>
                        <span className="grid h-16 w-16 place-items-center rounded-full" style={{ background: "rgba(46,204,113,.15)", border: "2px solid #2ecc71" }}>
                          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                        </span>
                        <div>
                          <p className="text-[15px] font-bold">Published to {upload.platform}!</p>
                          <p className="mt-1 text-xs text-white/55">Your video is now live on your {upload.platform} account.</p>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <a href="#" onClick={(e) => e.preventDefault()} className="inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-bold text-white" style={{ background: upload.bg }}>
                            View post
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M9 7h8v8" /></svg>
                          </a>
                          <button onClick={() => setUpload(null)} className="text-xs font-semibold text-white/55 hover:text-white">Done</button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {status === "done" && !upload && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid rgba(255,70,85,.3)", background: "rgba(255,70,85,.1)", color: "#ffb3b9" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Your {tool.title.toLowerCase()} is ready!
                  </div>

                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-white/55">Upload to your social media — one click</p>
                    <div className="grid grid-cols-2 gap-2">
                      {PLATFORMS.map((p) => (
                        <button key={p.name} onClick={() => startUpload(p.name, p.bg)} className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5" style={{ background: p.bg }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d={p.icon} /></svg>
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <a href={isImageTool ? imageUrl : videoUrl || RESULT_VIDEO} download className="flex items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
                      Download
                    </a>
                    <button onClick={copyLink} className="flex items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-2.5 text-sm font-semibold hover:bg-white/10">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>
                      {copied ? "Copied!" : "Link"}
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

function PlatBadge({ bg }: { bg: string }) {
  return <span className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: bg, boxShadow: "0 8px 24px -6px rgba(0,0,0,.6)" }} />;
}

function Action({ label, icon, primary }: { label: string; icon: React.ReactNode; primary?: boolean }) {
  return (
    <button className="flex items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.02]" style={primary ? { background: "linear-gradient(135deg,#ff3645,#c4101c)", color: "#fff" } : { border: "1px solid rgba(255,255,255,.15)", background: "rgba(255,255,255,.05)" }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
      {label}
    </button>
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
            <span className="text-xs text-white/40">{preview ? "Change file" : field.hint ?? "PNG, JPG or MP4"}</span>
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
        </div>
      );
    case "choices":
      return (
        <div>{label}
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {field.options.map((o) => { const on = value === o.value; return (
              <button key={o.value} onClick={() => onChange(o.value)} className="flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center transition" style={on ? { border: "1px solid #ff3645", background: "rgba(255,70,85,.1)" } : { border: "1px solid rgba(255,70,85,.15)", background: "rgba(255,60,75,.03)" }}>
                {o.img ? <span className="h-14 w-14 overflow-hidden rounded-xl">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={o.img} alt={o.label} className="h-full w-full object-cover" /></span> : <span className="text-2xl">{o.icon}</span>}
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
