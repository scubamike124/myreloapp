const html = await (await fetch("https://www.myreelo.com/create/ai-avatar-studio")).text();
const scripts = [...html.matchAll(/\/_next\/static\/[^"']+\.js/g)].map((m) => m[0]);
for (const s of scripts) {
  const t = await (await fetch("https://www.myreelo.com" + s)).text();
  if (
    t.includes("materializeVideoUrl") ||
    t.includes("Preparing smooth") ||
    t.includes("durableUrl") ||
    t.includes("chunked Worker")
  ) {
    console.log("---", s, "len", t.length);
    console.log("Preparing", t.includes("Preparing smooth playback"));
    console.log("chunked Worker", t.includes("chunked Worker"));
    console.log("durableUrl", t.includes("durableUrl"));
    console.log("Never use this URL", t.includes("Never use this URL for the player"));
    console.log("Prefer same-origin ingest", t.includes("Prefer same-origin ingest"));
  }
}
