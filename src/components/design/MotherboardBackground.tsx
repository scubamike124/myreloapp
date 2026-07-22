"use client";

import { useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// The living board behind every page.
//
// Real 3D: traces, pads and chips are defined in world space on the y=0 plane
// and run through a perspective camera each frame, so depth, convergence and
// parallax are genuine rather than faked with stacked divs. Canvas 2D rather
// than WebGL — this sits behind EVERY page, and three + fiber + postprocessing
// is ~700KB of JS to ship on every route for a backdrop.
//
// Rules it must obey:
//   - never compete with foreground text (low alpha, vignette, no hard edges)
//   - respect prefers-reduced-motion (renders one static frame)
//   - stop entirely when the tab is hidden (no background battery burn)
// ---------------------------------------------------------------------------

type Vec3 = { x: number; y: number; z: number };
type Trace = { pts: Vec3[]; seg: number[]; len: number; depth: number };
type Pulse = { t: number; d: number; speed: number; hue: number; size: number };
type Chip = { x: number; z: number; w: number; d: number; h: number; leds: number };
type Led = { x: number; z: number; phase: number; rate: number; hue: number };

/** Reelo red, through orange, to a hot white core — the pulse travels this. */
const HOT = [
  { at: 0.0, c: [255, 54, 69] }, // #ff3645 site red
  { at: 0.55, c: [255, 106, 0] }, // #ff6a00 orange
  { at: 1.0, c: [255, 236, 226] }, // near-white core
];

function ramp(t: number): [number, number, number] {
  const x = Math.max(0, Math.min(1, t));
  for (let i = 1; i < HOT.length; i++) {
    if (x <= HOT[i].at) {
      const a = HOT[i - 1];
      const b = HOT[i];
      const k = (x - a.at) / (b.at - a.at || 1);
      return [
        Math.round(a.c[0] + (b.c[0] - a.c[0]) * k),
        Math.round(a.c[1] + (b.c[1] - a.c[1]) * k),
        Math.round(a.c[2] + (b.c[2] - a.c[2]) * k),
      ];
    }
  }
  return [255, 236, 226];
}

/** Double-thump "lub-dub", 0..1 — the board's heartbeat. */
function heartbeat(t: number): number {
  const x = t % 2.4;
  const a = Math.exp(-Math.pow((x - 0.1) / 0.13, 2));
  const b = Math.exp(-Math.pow((x - 0.46) / 0.17, 2)) * 0.7;
  return Math.min(1, a + b);
}

export default function MotherboardBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0;
    let H = 0;
    let dpr = 1;
    let raf = 0;
    let running = true;
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);

    // --- world ------------------------------------------------------------
    const EXTENT = 300; // board half-size in world units
    let traces: Trace[] = [];
    let pulses: Pulse[] = [];
    let chips: Chip[] = [];
    let leds: Led[] = [];

    const camera = { x: 0, y: 62, z: 150, yaw: 0, pitch: 0.42, focal: 0 };

    function project(p: Vec3) {
      const dx = p.x - camera.x;
      const dy = p.y - camera.y;
      // Forward is -Z: the camera sits at +z and looks back toward the board,
      // so a point in front must yield a POSITIVE depth or it gets culled.
      const dz = camera.z - p.z;

      const cy = Math.cos(camera.yaw);
      const sy = Math.sin(camera.yaw);
      const rx = dx * cy - dz * sy;
      const rz = dx * sy + dz * cy;

      // Pitch tilts the camera DOWN toward the board. Getting these signs the
      // other way round throws the whole plane below the viewport — it still
      // renders, just nowhere you can see it.
      const cp = Math.cos(camera.pitch);
      const sp = Math.sin(camera.pitch);
      const ry = dy * cp + rz * sp;
      const rd = -dy * sp + rz * cp;

      if (rd < 6) return null; // behind or too close to the lens
      const s = camera.focal / rd;
      return { x: W / 2 + rx * s, y: H / 2 - ry * s, depth: rd, scale: s };
    }

    function build() {
      traces = [];
      pulses = [];
      chips = [];
      leds = [];

      const GRID = 22;
      // Scale density to the viewport so a phone does not draw a desktop's worth.
      const count = Math.round(Math.max(26, Math.min(80, (W * H) / 26000)));

      for (let i = 0; i < count; i++) {
        const pts: Vec3[] = [];
        let cx = Math.round(rnd(-EXTENT, EXTENT) / GRID) * GRID;
        let cz = Math.round(rnd(-EXTENT, EXTENT * 0.6) / GRID) * GRID;
        pts.push({ x: cx, y: 0, z: cz });

        // Manhattan routing with 45° jogs — reads as PCB, not as random lines.
        const steps = Math.floor(rnd(3, 8));
        let horiz = Math.random() < 0.5;
        for (let s = 0; s < steps; s++) {
          const dist = Math.round(rnd(1, 6)) * GRID * (Math.random() < 0.5 ? 1 : -1);
          if (horiz) cx += dist;
          else cz += dist;
          cx = Math.max(-EXTENT, Math.min(EXTENT, cx));
          cz = Math.max(-EXTENT, Math.min(EXTENT, cz));
          pts.push({ x: cx, y: 0, z: cz });
          horiz = !horiz;
        }

        const seg: number[] = [];
        let len = 0;
        for (let k = 1; k < pts.length; k++) {
          const l = Math.hypot(pts[k].x - pts[k - 1].x, pts[k].z - pts[k - 1].z);
          seg.push(l);
          len += l;
        }
        if (len < GRID * 2) continue;
        traces.push({ pts, seg, len, depth: pts[0].z });
      }

      // Roughly one travelling pulse per two traces.
      const pc = Math.max(10, Math.round(traces.length * 0.5));
      for (let i = 0; i < pc; i++) {
        pulses.push({
          t: Math.floor(rnd(0, traces.length)),
          d: rnd(0, 400),
          speed: rnd(28, 78),
          hue: rnd(0, 1),
          size: rnd(0.8, 2.1),
        });
      }

      const chipCount = Math.round(Math.max(5, Math.min(14, (W * H) / 150000)));
      for (let i = 0; i < chipCount; i++) {
        const w = rnd(26, 62);
        chips.push({
          x: rnd(-EXTENT * 0.85, EXTENT * 0.85),
          z: rnd(-EXTENT * 0.9, EXTENT * 0.5),
          w,
          d: w * rnd(0.6, 1.15),
          h: rnd(5, 13),
          leds: Math.floor(rnd(2, 6)),
        });
      }

      const ledCount = Math.round(Math.max(18, Math.min(60, (W * H) / 42000)));
      for (let i = 0; i < ledCount; i++) {
        leds.push({
          x: rnd(-EXTENT, EXTENT),
          z: rnd(-EXTENT, EXTENT * 0.6),
          phase: rnd(0, Math.PI * 2),
          rate: rnd(0.6, 3.4),
          hue: rnd(0, 1),
        });
      }
    }

    function resize() {
      dpr = Math.min(1.75, window.devicePixelRatio || 1);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas!.width = Math.floor(W * dpr);
      canvas!.height = Math.floor(H * dpr);
      canvas!.style.width = W + "px";
      canvas!.style.height = H + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      camera.focal = Math.max(W, H) * 0.9;
      build();
    }

    function pointAt(tr: Trace, d: number): Vec3 {
      let rem = ((d % tr.len) + tr.len) % tr.len;
      for (let k = 0; k < tr.seg.length; k++) {
        if (rem <= tr.seg[k]) {
          const f = tr.seg[k] === 0 ? 0 : rem / tr.seg[k];
          const a = tr.pts[k];
          const b = tr.pts[k + 1];
          return { x: a.x + (b.x - a.x) * f, y: 0, z: a.z + (b.z - a.z) * f };
        }
        rem -= tr.seg[k];
      }
      return tr.pts[tr.pts.length - 1];
    }

    function draw(time: number) {
      const t = time / 1000;
      const hb = heartbeat(t);

      // Slow camera drift. Parallax falls out of the projection for free:
      // near geometry sweeps further across the screen than far geometry.
      if (!reduce) {
        camera.x = Math.sin(t * 0.045) * 46;
        camera.z = 150 + Math.cos(t * 0.033) * 26;
        camera.yaw = Math.sin(t * 0.021) * 0.10;
        camera.pitch = 0.42 + Math.sin(t * 0.027) * 0.03;
      }

      ctx!.clearRect(0, 0, W, H);

      // No full-screen wash here — an opaque haze over the whole viewport turns
      // the board to brown fog. Depth comes from per-element distance fade
      // instead, which keeps the blacks black.

      // --- traces ---------------------------------------------------------
      ctx!.lineCap = "round";
      ctx!.lineJoin = "round";
      for (const tr of traces) {
        let started = false;
        ctx!.beginPath();
        for (const p of tr.pts) {
          const q = project(p);
          if (!q) {
            started = false;
            continue;
          }
          if (!started) {
            ctx!.moveTo(q.x, q.y);
            started = true;
          } else {
            ctx!.lineTo(q.x, q.y);
          }
        }
        const mid = project(tr.pts[0]);
        // Fade with distance so the board recedes convincingly.
        const fade = mid ? Math.max(0, Math.min(1, 1 - mid.depth / 620)) : 0;
        // Etched copper: a wide dim body with a brighter core, which reads as a
        // real trace rather than a hairline.
        ctx!.strokeStyle = `rgba(196,32,45,${0.04 + fade * 0.11})`;
        ctx!.lineWidth = 1.6 + fade * 3.2;
        ctx!.stroke();
        ctx!.strokeStyle = `rgba(255,86,99,${0.05 + fade * 0.17 * (0.7 + hb * 0.5)})`;
        ctx!.lineWidth = 0.5 + fade * 1.2;
        ctx!.stroke();
      }

      // --- chips ----------------------------------------------------------
      // Painter's algorithm: far chips first so near ones overlap correctly.
      const ordered = [...chips].sort((a, b) => b.z - a.z);
      for (const c of ordered) {
        const corners: Vec3[] = [
          { x: c.x - c.w / 2, y: c.h, z: c.z - c.d / 2 },
          { x: c.x + c.w / 2, y: c.h, z: c.z - c.d / 2 },
          { x: c.x + c.w / 2, y: c.h, z: c.z + c.d / 2 },
          { x: c.x - c.w / 2, y: c.h, z: c.z + c.d / 2 },
        ];
        const top = corners.map(project);
        if (top.some((p) => !p)) continue;

        const front = [
          { x: c.x - c.w / 2, y: 0, z: c.z + c.d / 2 },
          { x: c.x + c.w / 2, y: 0, z: c.z + c.d / 2 },
        ].map(project);

        const depth = top[0]!.depth;
        const fade = Math.max(0, Math.min(1, 1 - depth / 700));
        if (fade <= 0.01) continue;

        // Extruded side wall, darker than the top face.
        if (front[0] && front[1]) {
          ctx!.beginPath();
          ctx!.moveTo(top[3]!.x, top[3]!.y);
          ctx!.lineTo(top[2]!.x, top[2]!.y);
          ctx!.lineTo(front[1].x, front[1].y);
          ctx!.lineTo(front[0].x, front[0].y);
          ctx!.closePath();
          ctx!.fillStyle = `rgba(10,5,7,${0.5 * fade})`;
          ctx!.fill();
        }

        ctx!.beginPath();
        ctx!.moveTo(top[0]!.x, top[0]!.y);
        for (let i = 1; i < 4; i++) ctx!.lineTo(top[i]!.x, top[i]!.y);
        ctx!.closePath();
        ctx!.fillStyle = `rgba(17,9,12,${0.66 * fade})`;
        ctx!.fill();
        ctx!.strokeStyle = `rgba(255,70,85,${0.1 + 0.2 * fade * (0.5 + hb * 0.5)})`;
        ctx!.lineWidth = 0.8;
        ctx!.stroke();
      }

      // --- LEDs -----------------------------------------------------------
      for (const l of leds) {
        const q = project({ x: l.x, y: 1.5, z: l.z });
        if (!q) continue;
        const fade = Math.max(0, Math.min(1, 1 - q.depth / 640));
        if (fade <= 0.02) continue;
        const flick = reduce ? 0.6 : 0.35 + 0.65 * Math.abs(Math.sin(t * l.rate + l.phase));
        const [r, g, b] = ramp(l.hue * 0.6 + hb * 0.3);
        // q.scale is pixels-per-world-unit, so the LED is sized in world units
        // (~1.6) and clamped — otherwise a near LED becomes a screen-wide wash.
        const rad = Math.min(5.5, Math.max(0.6, q.scale * 1.1)) * (0.6 + flick * 0.4);
        const halo = Math.min(26, rad * 4);
        const glow = ctx!.createRadialGradient(q.x, q.y, 0, q.x, q.y, halo);
        glow.addColorStop(0, `rgba(${r},${g},${b},${0.42 * flick * fade})`);
        glow.addColorStop(0.35, `rgba(${r},${g},${b},${0.12 * flick * fade})`);
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx!.fillStyle = glow;
        ctx!.beginPath();
        ctx!.arc(q.x, q.y, halo, 0, Math.PI * 2);
        ctx!.fill();
      }

      // --- travelling pulses ----------------------------------------------
      for (const p of pulses) {
        const tr = traces[p.t];
        if (!tr) continue;
        if (!reduce) p.d += (p.speed * (0.55 + hb * 0.9)) / 60;

        // A short comet tail, brightest at the head.
        const TAIL = 7;
        for (let i = 0; i < TAIL; i++) {
          const q = project(pointAt(tr, p.d - i * 5));
          if (!q) continue;
          const fade = Math.max(0, Math.min(1, 1 - q.depth / 660));
          if (fade <= 0.02) continue;
          const k = 1 - i / TAIL;
          const [r, g, b] = ramp(p.hue * 0.4 + k * 0.6);
          const a = 0.5 * k * k * fade * (0.45 + hb * 0.75);
          // Sized in world units like the LEDs, and clamped for the same reason.
          const rad = Math.min(6.5, Math.max(0.5, q.scale * p.size * 0.6)) * (0.45 + k * 0.75);
          const halo = Math.min(30, rad * 4);
          const glow = ctx!.createRadialGradient(q.x, q.y, 0, q.x, q.y, halo);
          glow.addColorStop(0, `rgba(${r},${g},${b},${a})`);
          glow.addColorStop(0.4, `rgba(${r},${g},${b},${a * 0.3})`);
          glow.addColorStop(1, "rgba(0,0,0,0)");
          ctx!.fillStyle = glow;
          ctx!.beginPath();
          ctx!.arc(q.x, q.y, halo, 0, Math.PI * 2);
          ctx!.fill();
        }
      }

      // Vignette — pulls the eye to the centre and guarantees the corners never
      // fight with foreground copy.
      const vig = ctx!.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.5, W / 2, H / 2, Math.max(W, H) * 0.85);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(6,3,4,0.5)");
      ctx!.fillStyle = vig;
      ctx!.fillRect(0, 0, W, H);
    }

    function loop(time: number) {
      if (!running) return;
      draw(time);
      raf = requestAnimationFrame(loop);
    }

    function onVisibility() {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduce) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    }

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    if (reduce) {
      draw(0); // one static frame, no animation
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full opacity-70"
    />
  );
}
