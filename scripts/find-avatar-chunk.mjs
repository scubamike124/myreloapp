const html = await (await fetch("https://www.myreelo.com/create/ai-avatar-studio")).text();
const scripts = [...new Set([...html.matchAll(/\/_next\/static\/[^"']+\.js/g)].map((m) => m[0]))];
console.log("script count", scripts.length);
for (const s of scripts) {
  const t = await (await fetch("https://www.myreelo.com" + s)).text();
  if (t.includes("Audio is included") || t.includes("Generate Avatar Video")) {
    console.log("HIT", s, "len", t.length);
    const i = t.indexOf("Audio is included");
    if (i >= 0) console.log(t.slice(i - 1400, i + 500));
  }
}
