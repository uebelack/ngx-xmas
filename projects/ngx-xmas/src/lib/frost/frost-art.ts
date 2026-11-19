/**
 * Procedurally drawn ice crystals for one frost corner. The corner sits at (0, 0) of a
 * 200×200 box; crystals grow along the edges and inwards. Deterministic per seed so
 * server and browser (and every reload) produce the same artwork.
 */
export interface FrostArt {
  /** Fern-like dendrites, as a single stroke path. */
  dendrites: string;
  /** Small six-armed crystals, as a single stroke path. */
  stars: string;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n: number) => n.toFixed(1);
const SIXTY = Math.PI / 3;

function dendrite(
  rng: () => number,
  x: number,
  y: number,
  angle: number,
  length: number,
  depth: number,
  out: string[],
): void {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  out.push(`M${f(x)} ${f(y)}L${f(x + dx * length)} ${f(y + dy * length)}`);
  if (depth === 0 || length < 6) {
    return;
  }
  const steps = depth === 2 ? 4 + Math.floor(rng() * 3) : 2 + Math.floor(rng() * 2);
  for (let i = 1; i <= steps; i++) {
    const t = i / (steps + 1) + (rng() - 0.5) * 0.08;
    const px = x + dx * length * t;
    const py = y + dy * length * t;
    const side = length * (0.42 - 0.3 * t) * (0.7 + rng() * 0.6);
    dendrite(rng, px, py, angle + SIXTY, side, depth - 1, out);
    dendrite(rng, px, py, angle - SIXTY, side * (0.8 + rng() * 0.4), depth - 1, out);
  }
}

function star(x: number, y: number, size: number, rotation: number, out: string[]): void {
  for (let arm = 0; arm < 3; arm++) {
    const a = rotation + arm * SIXTY;
    const dx = Math.cos(a) * size;
    const dy = Math.sin(a) * size;
    out.push(`M${f(x - dx)} ${f(y - dy)}L${f(x + dx)} ${f(y + dy)}`);
  }
}

export function drawFrostArt(seed: number): FrostArt {
  const rng = mulberry32(seed);
  const dendrites: string[] = [];
  const stars: string[] = [];

  // Long fronds from the corner itself, fanning across the quarter.
  for (let i = 0; i < 4; i++) {
    const angle = (0.12 + (i / 3) * 0.76 + (rng() - 0.5) * 0.1) * (Math.PI / 2);
    dendrite(rng, 0, 0, angle, 120 + rng() * 50, 2, dendrites);
  }
  // Shorter fronds rooted along both edges, getting shorter away from the corner.
  for (let i = 0; i < 10; i++) {
    const along = 12 + rng() * 120;
    const reach = (175 - along) * (0.45 + rng() * 0.4);
    const tilt = (rng() - 0.5) * 0.9;
    if (i % 2 === 0) {
      dendrite(rng, along, 0, Math.PI / 2 + tilt, reach, 2, dendrites);
    } else {
      dendrite(rng, 0, along, tilt, reach, 2, dendrites);
    }
  }
  // Loose crystals scattered around the frost line.
  for (let i = 0; i < 14; i++) {
    const r = 70 + rng() * 95;
    const a = rng() * (Math.PI / 2);
    star(Math.cos(a) * r, Math.sin(a) * r, 2.5 + rng() * 5, rng() * SIXTY, stars);
  }

  return { dendrites: dendrites.join(''), stars: stars.join('') };
}
