const PROD = "https://www.myreelo.com";
const deadline = Date.now() + 8 * 60_000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

while (Date.now() < deadline) {
  const html = await (await fetch(`${PROD}/create/ai-avatar-studio`)).text();
  const scripts = [...html.matchAll(/\/_next\/static\/[^"']+\.js/g)].map((m) => m[0]);
  let found = false;
  for (const s of scripts.slice(0, 60)) {
    try {
      const t = await (await fetch(PROD + s)).text();
      if (t.includes("Preparing smooth playback") || t.includes("disableRemotePlayback")) {
        console.log("DEPLOYED", s);
        found = true;
        break;
      }
    } catch {
      /* */
    }
  }
  if (found) process.exit(0);
  console.log("not yet", new Date().toISOString(), "scripts", scripts.length);
  await sleep(20_000);
}
console.log("TIMEOUT");
process.exit(1);
