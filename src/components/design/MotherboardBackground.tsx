"use client";

import { useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// The living board behind every page.
//
// A POPULATED motherboard, not a wireframe: dense fine traces, IC packages
// with pin rows, SMD parts, electrolytic caps, a hero processor, and bokeh
// for the parts drifting past the near plane. Everything lives in world space
// on the y=0 plane and runs through a perspective camera each frame, so depth,
// convergence and parallax are genuine.
//
// Canvas 2D rather than WebGL: this sits behind EVERY page, and
// three + fiber + postprocessing is ~700KB of JS to ship on every route
// for a backdrop.
//
// Rules it must obey:
//   - never compete with foreground text (low alpha, vignette, no hard edges)
//   - respect prefers-reduced-motion (renders one static frame)
//   - stop entirely when the tab is hidden (no background battery burn)
// ---------------------------------------------------------------------------

type Vec3 = { x: number; y: number; z: number };
type Trace = { pts: Vec3[]; seg: number[]; len: number; w: number };
type Pulse = { t: number; d: number; speed: number; hue: number; size: number };
type Pad = { x: number; z: number; r: number };
type Part =
  | { kind: "ic"; x: number; z: number; w: number; d: number; h: number; rot: boolean; pins: number }
  | { kind: "smd"; x: number; z: number; w: number; d: number; h: number; lit: number }
  | { kind: "cap"; x: number; z: number; r: number; h: number }
  | { kind: "hero"; x: number; z: number; w: number; h: number };
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
    let raf = 0;
    let running = true;
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);

    // --- world ------------------------------------------------------------
    const EXTENT = 155; // board half-size in world units
    const GRID = 7; // routing pitch — fine, so the board reads as dense
    let traces: Trace[] = [];
    let pulses: Pulse[] = [];
    let pads: Pad[] = [];
    let parts: Part[] = [];
    let leds: Led[] = [];

    const camera = { x: 0, y: 52, z: 112, yaw: 0, pitch: 0.52, focal: 0 };

    function project(p: Vec3) {
      const dx = p.x - camera.x;
      const dy = p.y - camera.y;
      // Forward is -Z: the camera sits at +z looking back toward the board, so
      // a point in front must yield a POSITIVE depth or it gets culled.
      const dz = camera.z - p.z;

      const cy = Math.cos(camera.yaw);
      const sy = Math.sin(camera.yaw);
      const rx = dx * cy - dz * sy;
      const rz = dx * sy + dz * cy;

      // Pitch tilts the camera DOWN toward the board. These signs the other way
      // round throw the whole plane below the viewport — it still renders, just
      // nowhere you can see it.
      const cp = Math.cos(camera.pitch);
      const sp = Math.sin(camera.pitch);
      const ry = dy * cp + rz * sp;
      const rd = -dy * sp + rz * cp;

      if (rd < 10) return null;
      const s = camera.focal / rd;
      return { x: W / 2 + rx * s, y: H / 2 - ry * s, depth: rd, scale: s };
    }

    /** Does a footprint overlap something already placed? Keeps parts apart. */
    function free(taken: { x: number; z: number; r: number }[], x: number, z: number, r: number) {
      for (const t of taken) {
        if (Math.hypot(t.x - x, t.z - z) < t.r + r) return false;
      }
      return true;
    }

    function build() {
      traces = [];
      pulses = [];
      pads = [];
      parts = [];
      leds = [];

      const area = W * H;
      const taken: { x: number; z: number; r: number }[] = [];

      // --- hero processor, dead centre -----------------------------------
      parts.push({ kind: "hero", x: -74, z: -34, w: 34, h: 7 });
      taken.push({ x: -74, z: -34, r: 30 });

      // --- IC packages ----------------------------------------------------
      const icCount = Math.round(Math.max(9, Math.min(22, area / 90000)));
      for (let i = 0; i < icCount; i++) {
        for (let tries = 0; tries < 14; tries++) {
          const w = rnd(16, 34);
          const d = w * rnd(0.55, 1.05);
          const x = rnd(-EXTENT * 0.92, EXTENT * 0.92);
          const z = rnd(-EXTENT * 0.95, EXTENT * 0.45);
          const r = Math.max(w, d) * 0.75;
          if (!free(taken, x, z, r)) continue;
          taken.push({ x, z, r });
          parts.push({
            kind: "ic",
            x,
            z,
            w,
            d,
            h: rnd(4, 9),
            rot: Math.random() < 0.5,
            pins: Math.round(rnd(5, 11)),
          });
          break;
        }
      }

      // --- electrolytic capacitors ---------------------------------------
      const capCount = Math.round(Math.max(8, Math.min(24, area / 78000)));
      for (let i = 0; i < capCount; i++) {
        for (let tries = 0; tries < 12; tries++) {
          const r = rnd(3, 5.5);
          const x = rnd(-EXTENT * 0.95, EXTENT * 0.95);
          const z = rnd(-EXTENT, EXTENT * 0.5);
          if (!free(taken, x, z, r * 1.6)) continue;
          taken.push({ x, z, r: r * 1.6 });
          parts.push({ kind: "cap", x, z, r, h: rnd(6, 13) });
          break;
        }
      }

      // --- small SMD parts, the scatter that sells the density -------------
      const smdCount = Math.round(Math.max(50, Math.min(190, area / 11000)));
      for (let i = 0; i < smdCount; i++) {
        const x = rnd(-EXTENT, EXTENT);
        const z = rnd(-EXTENT, EXTENT * 0.55);
        if (!free(taken, x, z, 3)) continue;
        const long = rnd(2.4, 5.5);
        const horiz = Math.random() < 0.5;
        parts.push({
          kind: "smd",
          x,
          z,
          w: horiz ? long : long * 0.42,
          d: horiz ? long * 0.42 : long,
          h: rnd(1.2, 2.6),
          lit: Math.random() < 0.22 ? rnd(0.4, 1) : 0,
        });
      }

      // --- routing --------------------------------------------------------
      // Many short traces on a fine pitch reads as a real board; a few long
      // ones read as a wireframe grid, which is what this used to look like.
      const traceCount = Math.round(Math.max(150, Math.min(460, area / 3400)));
      for (let i = 0; i < traceCount; i++) {
        const pts: Vec3[] = [];
        let cx = Math.round(rnd(-EXTENT, EXTENT) / GRID) * GRID;
        let cz = Math.round(rnd(-EXTENT, EXTENT * 0.5) / GRID) * GRID;
        pts.push({ x: cx, y: 0, z: cz });

        const steps = Math.floor(rnd(2, 6));
        let horiz = Math.random() < 0.5;
        for (let s = 0; s < steps; s++) {
          const dist = Math.round(rnd(1, 7)) * GRID * (Math.random() < 0.5 ? 1 : -1);
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
        if (len < GRID) continue;
        traces.push({ pts, seg, len, w: rnd(0.5, 1.5) });
        pads.push({ x: pts[0].x, z: pts[0].z, r: rnd(1.1, 2.2) });
        pads.push({ x: pts[pts.length - 1].x, z: pts[pts.length - 1].z, r: rnd(1.1, 2.2) });
      }

      const pc = Math.round(Math.max(14, Math.min(46, traces.length * 0.12)));
      for (let i = 0; i < pc; i++) {
        pulses.push({
          t: Math.floor(rnd(0, traces.length)),
          d: rnd(0, 400),
          speed: rnd(26, 72),
          hue: rnd(0, 1),
          size: rnd(0.9, 2.2),
        });
      }

      const ledCount = Math.round(Math.max(22, Math.min(70, area / 34000)));
      for (let i = 0; i < ledCount; i++) {
        leds.push({
          x: rnd(-EXTENT, EXTENT),
          z: rnd(-EXTENT, EXTENT * 0.5),
          phase: rnd(0, Math.PI * 2),
          rate: rnd(0.5, 3.2),
          hue: rnd(0, 1),
        });
      }
    }

    function resize() {
      const dpr = Math.min(1.75, window.devicePixelRatio || 1);
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

    /** Fill the projected quad of a box's top face. */
    function topFace(x: number, z: number, w: number, d: number, h: number) {
      const c = [
        project({ x: x - w / 2, y: h, z: z - d / 2 }),
        project({ x: x + w / 2, y: h, z: z - d / 2 }),
        project({ x: x + w / 2, y: h, z: z + d / 2 }),
        project({ x: x - w / 2, y: h, z: z + d / 2 }),
      ];
      if (c.some((p) => !p)) return null;
      return c as NonNullable<(typeof c)[0]>[];
    }

    function drawBox(
      x: number,
      z: number,
      w: number,
      d: number,
      h: number,
      fade: number,
      topFill: string,
      sideFill: string,
      edge: string | null,
    ) {
      const top = topFace(x, z, w, d, h);
      if (!top) return null;

      // Front wall gives the extrusion its solidity.
      const fl = project({ x: x - w / 2, y: 0, z: z + d / 2 });
      const fr = project({ x: x + w / 2, y: 0, z: z + d / 2 });
      if (fl && fr) {
        ctx!.beginPath();
        ctx!.moveTo(top[3].x, top[3].y);
        ctx!.lineTo(top[2].x, top[2].y);
        ctx!.lineTo(fr.x, fr.y);
        ctx!.lineTo(fl.x, fl.y);
        ctx!.closePath();
        ctx!.fillStyle = sideFill;
        ctx!.fill();
      }

      ctx!.beginPath();
      ctx!.moveTo(top[0].x, top[0].y);
      for (let i = 1; i < 4; i++) ctx!.lineTo(top[i].x, top[i].y);
      ctx!.closePath();
      ctx!.fillStyle = topFill;
      ctx!.fill();
      if (edge) {
        ctx!.strokeStyle = edge;
        ctx!.lineWidth = 0.7;
        ctx!.stroke();
      }
      return top;
    }

    function draw(time: number) {
      const t = time / 1000;
      const hb = heartbeat(t);

      // Slow camera drift. Parallax falls out of the projection for free:
      // near geometry sweeps further across the screen than far geometry.
      if (!reduce) {
        camera.x = Math.sin(t * 0.045) * 22;
        camera.z = 112 + Math.cos(t * 0.033) * 14;
        camera.yaw = Math.sin(t * 0.021) * 0.09;
        camera.pitch = 0.52 + Math.sin(t * 0.027) * 0.02;
      }

      ctx!.clearRect(0, 0, W, H);

      // --- substrate ------------------------------------------------------
      // A dark board surface so parts sit ON something rather than floating in
      // the void. Drawn as one big quad in world space.
      const board = [
        project({ x: -EXTENT, y: -0.5, z: -EXTENT }),
        project({ x: EXTENT, y: -0.5, z: -EXTENT }),
        project({ x: EXTENT, y: -0.5, z: EXTENT }),
        project({ x: -EXTENT, y: -0.5, z: EXTENT }),
      ];
      if (board.every(Boolean)) {
        ctx!.beginPath();
        ctx!.moveTo(board[0]!.x, board[0]!.y);
        for (let i = 1; i < 4; i++) ctx!.lineTo(board[i]!.x, board[i]!.y);
        ctx!.closePath();
        const g = ctx!.createLinearGradient(0, H * 0.15, 0, H);
        g.addColorStop(0, "rgba(24,8,11,0.55)");
        g.addColorStop(1, "rgba(11,5,7,0.85)");
        ctx!.fillStyle = g;
        ctx!.fill();
      }

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
        const head = project(tr.pts[0]);
        const fade = head ? Math.max(0, Math.min(1, 1 - head.depth / 400)) : 0;
        if (fade <= 0.01) continue;
        ctx!.strokeStyle = `rgba(168,32,40,${0.07 + fade * 0.20})`;
        ctx!.lineWidth = (0.9 + fade * 2.1) * tr.w;
        ctx!.stroke();
        ctx!.strokeStyle = `rgba(255,104,88,${0.06 + fade * 0.22 * (0.7 + hb * 0.5)})`;
        ctx!.lineWidth = (0.35 + fade * 0.85) * tr.w;
        ctx!.stroke();
      }

      // --- solder pads / vias ---------------------------------------------
      for (const p of pads) {
        const q = project({ x: p.x, y: 0.2, z: p.z });
        if (!q) continue;
        const fade = Math.max(0, Math.min(1, 1 - q.depth / 360));
        if (fade <= 0.03) continue;
        const r = Math.min(4, Math.max(0.4, q.scale * p.r));
        ctx!.beginPath();
        ctx!.arc(q.x, q.y, r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(214,80,64,${0.22 * fade})`;
        ctx!.fill();
      }

      // --- parts, far to near so near ones overlap correctly ---------------
      const ordered = [...parts].sort((a, b) => a.z - b.z);
      for (const part of ordered) {
        const probe = project({ x: part.x, y: 0, z: part.z });
        if (!probe) continue;
        const fade = Math.max(0, Math.min(1, 1 - probe.depth / 420));
        if (fade <= 0.02) continue;

        // Anything this close to the lens is out of focus — draw it as bokeh
        // instead of geometry. This is what gives the board its photographic
        // depth rather than a flat CAD look.
        if (probe.depth < 58) {
          const blurR = Math.min(130, (58 - probe.depth) * 2.2 + 16);
          const [r, g, b] = ramp(0.15);
          const bk = ctx!.createRadialGradient(probe.x, probe.y, 0, probe.x, probe.y, blurR);
          bk.addColorStop(0, `rgba(${r},${g},${b},0.055)`);
          bk.addColorStop(1, "rgba(0,0,0,0)");
          ctx!.fillStyle = bk;
          ctx!.beginPath();
          ctx!.arc(probe.x, probe.y, blurR, 0, Math.PI * 2);
          ctx!.fill();
          continue;
        }

        if (part.kind === "smd") {
          const top = drawBox(
            part.x,
            part.z,
            part.w,
            part.d,
            part.h,
            fade,
            `rgba(34,26,27,${0.9 * fade})`,
            `rgba(15,10,11,${0.88 * fade})`,
            `rgba(236,104,84,${0.42 * fade})`,
          );
          if (top && part.lit > 0) {
            const cx = (top[0].x + top[2].x) / 2;
            const cy = (top[0].y + top[2].y) / 2;
            const [r, g, b] = ramp(0.25 + part.lit * 0.5);
            const rad = Math.min(11, Math.max(1, probe.scale * 2.4));
            const gl = ctx!.createRadialGradient(cx, cy, 0, cx, cy, rad);
            gl.addColorStop(0, `rgba(${r},${g},${b},${0.5 * part.lit * fade * (0.5 + hb * 0.6)})`);
            gl.addColorStop(1, "rgba(0,0,0,0)");
            ctx!.fillStyle = gl;
            ctx!.beginPath();
            ctx!.arc(cx, cy, rad, 0, Math.PI * 2);
            ctx!.fill();
          }
          continue;
        }

        if (part.kind === "cap") {
          // Electrolytic: a squat cylinder. Top ellipse plus a body quad.
          const base = project({ x: part.x, y: 0, z: part.z });
          const cap = project({ x: part.x, y: part.h, z: part.z });
          if (!base || !cap) continue;
          const rx = Math.min(26, Math.max(1.2, cap.scale * part.r));
          const ry = rx * 0.42;

          ctx!.beginPath();
          ctx!.moveTo(base.x - rx, base.y);
          ctx!.lineTo(base.x + rx, base.y);
          ctx!.lineTo(cap.x + rx, cap.y);
          ctx!.lineTo(cap.x - rx, cap.y);
          ctx!.closePath();
          const body = ctx!.createLinearGradient(cap.x - rx, 0, cap.x + rx, 0);
          body.addColorStop(0, `rgba(18,11,13,${0.92 * fade})`);
          body.addColorStop(0.45, `rgba(44,30,29,${0.94 * fade})`);
          body.addColorStop(1, `rgba(14,9,10,${0.92 * fade})`);
          ctx!.fillStyle = body;
          ctx!.fill();

          ctx!.beginPath();
          ctx!.ellipse(cap.x, cap.y, rx, ry, 0, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(52,36,34,${0.95 * fade})`;
          ctx!.fill();
          ctx!.strokeStyle = `rgba(255,120,96,${0.4 * fade})`;
          ctx!.lineWidth = 0.8;
          ctx!.stroke();
          continue;
        }

        if (part.kind === "ic") {
          // Pin rows first, so the package body sits on top of them.
          const half = part.rot ? part.d / 2 : part.w / 2;
          const span = part.rot ? part.w : part.d;
          for (let side = -1; side <= 1; side += 2) {
            for (let i = 0; i < part.pins; i++) {
              const f = (i + 0.5) / part.pins - 0.5;
              const px = part.rot ? part.x + f * span : part.x + side * (half + 2.4);
              const pz = part.rot ? part.z + side * (half + 2.4) : part.z + f * span;
              const a = project({ x: px, y: 0.4, z: pz });
              if (!a) continue;
              const r = Math.min(3, Math.max(0.35, a.scale * 0.9));
              ctx!.beginPath();
              ctx!.arc(a.x, a.y, r, 0, Math.PI * 2);
              ctx!.fillStyle = `rgba(232,150,104,${0.5 * fade})`;
              ctx!.fill();
            }
          }

          const top = drawBox(
            part.x,
            part.z,
            part.w,
            part.d,
            part.h,
            fade,
            `rgba(27,21,23,${0.96 * fade})`,
            `rgba(13,9,10,${0.94 * fade})`,
            `rgba(255,116,96,${0.55 * fade})`,
          );
          // A soft specular streak keeps the package from reading as flat.
          if (top) {
            const cx = (top[0].x + top[2].x) / 2;
            const cy = (top[0].y + top[2].y) / 2;
            const rad = Math.max(4, Math.hypot(top[0].x - top[2].x, top[0].y - top[2].y) * 0.4);
            const sh = ctx!.createRadialGradient(cx - rad * 0.3, cy - rad * 0.3, 0, cx, cy, rad);
            sh.addColorStop(0, `rgba(255,158,136,${0.10 * fade})`);
            sh.addColorStop(1, "rgba(0,0,0,0)");
            ctx!.fillStyle = sh;
            ctx!.beginPath();
            ctx!.arc(cx, cy, rad, 0, Math.PI * 2);
            ctx!.fill();
          }
          continue;
        }

        // --- hero processor -------------------------------------------------
        const w = part.w;
        // Pin fields on all four edges.
        for (let side = -1; side <= 1; side += 2) {
          for (let i = 0; i < 16; i++) {
            const f = (i + 0.5) / 16 - 0.5;
            for (const [px, pz] of [
              [part.x + f * w, part.z + side * (w / 2 + 4)],
              [part.x + side * (w / 2 + 4), part.z + f * w],
            ]) {
              const a = project({ x: px, y: 0.4, z: pz });
              if (!a) continue;
              const r = Math.min(3.2, Math.max(0.4, a.scale * 1));
              ctx!.beginPath();
              ctx!.arc(a.x, a.y, r, 0, Math.PI * 2);
              ctx!.fillStyle = `rgba(226,146,104,${0.34 * fade})`;
              ctx!.fill();
            }
          }
        }

        const top = drawBox(
          part.x,
          part.z,
          w,
          w,
          part.h,
          fade,
          `rgba(26,20,22,${0.96 * fade})`,
          `rgba(12,8,9,${0.95 * fade})`,
          `rgba(255,72,72,${(0.3 + hb * 0.4) * fade})`,
        );

        if (top) {
          const cx = (top[0].x + top[2].x) / 2;
          const cy = (top[0].y + top[2].y) / 2;
          const size = Math.hypot(top[0].x - top[2].x, top[0].y - top[2].y);

          // Heartbeat halo under the die.
          const halo = ctx!.createRadialGradient(cx, cy, 0, cx, cy, size * 0.9);
          halo.addColorStop(0, `rgba(255,58,60,${(0.06 + hb * 0.14) * fade})`);
          halo.addColorStop(1, "rgba(0,0,0,0)");
          ctx!.fillStyle = halo;
          ctx!.beginPath();
          ctx!.arc(cx, cy, size * 0.9, 0, Math.PI * 2);
          ctx!.fill();

          // The R, breathing with the beat.
          const fs = Math.max(6, size * 0.42);
          ctx!.save();
          ctx!.font = `800 ${fs}px "Space Grotesk", ui-sans-serif, system-ui, sans-serif`;
          ctx!.textAlign = "center";
          ctx!.textBaseline = "middle";
          ctx!.shadowColor = `rgba(255,60,64,${0.75 * fade})`;
          ctx!.shadowBlur = fs * (0.3 + hb * 0.45);
          ctx!.fillStyle = `rgba(255,${Math.round(96 + hb * 90)},${Math.round(96 + hb * 80)},${(0.26 + hb * 0.2) * fade})`;
          ctx!.fillText("R", cx, cy + fs * 0.04);
          ctx!.restore();
        }
      }

      // --- LEDs -------------------------------------------------------------
      for (const l of leds) {
        const q = project({ x: l.x, y: 1.5, z: l.z });
        if (!q || q.depth < 38) continue;
        const fade = Math.max(0, Math.min(1, 1 - q.depth / 380));
        if (fade <= 0.02) continue;
        const flick = reduce ? 0.6 : 0.35 + 0.65 * Math.abs(Math.sin(t * l.rate + l.phase));
        const [r, g, b] = ramp(l.hue * 0.6 + hb * 0.3);
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

      // --- travelling pulses -------------------------------------------------
      for (const p of pulses) {
        const tr = traces[p.t];
        if (!tr) continue;
        if (!reduce) p.d += (p.speed * (0.55 + hb * 0.9)) / 60;

        const TAIL = 7;
        for (let i = 0; i < TAIL; i++) {
          const q = project(pointAt(tr, p.d - i * 4));
          if (!q || q.depth < 36) continue;
          const fade = Math.max(0, Math.min(1, 1 - q.depth / 400));
          if (fade <= 0.02) continue;
          const k = 1 - i / TAIL;
          const [r, g, b] = ramp(p.hue * 0.4 + k * 0.6);
          const a = 0.5 * k * k * fade * (0.45 + hb * 0.75);
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
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full opacity-[0.62]"
    />
  );
}
