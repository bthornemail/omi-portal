const BASE = 36;
const ORBIT_PERIOD = 36;
const ORBIT_CYCLE = 5040;

export function digmod36(position) {
  const p = ((position % ORBIT_PERIOD) + ORBIT_PERIOD) % ORBIT_PERIOD;
  const quotient = Math.floor(position / ORBIT_PERIOD);
  return { quotient, remainder: p, position: p };
}

export function recoverCosmicPosition(position) {
  const d = digmod36(position);
  const symbols = "0123456789abcdefghijklmnopqrstuvwxyz";
  return {
    ...d,
    symbol: symbols[d.remainder] || "?",
    angle: (d.remainder * 10) % 360,
  };
}

export function recoverCosmicOrbit(position) {
  const cyclePosition = ((position % ORBIT_CYCLE) + ORBIT_CYCLE) % ORBIT_CYCLE;
  const fullCycles = Math.floor(position / ORBIT_CYCLE);
  const cell = cyclePosition % BASE;
  const row = Math.floor(cyclePosition / BASE) % BASE;
  const layer = Math.floor(cyclePosition / (BASE * BASE));
  return {
    fullCycles,
    cyclePosition,
    cell,
    row,
    layer,
    quadrant: { x: cell % 6, y: row % 6 },
    angle: (cyclePosition * 360) / ORBIT_CYCLE,
  };
}

export function applyCosmeticReaderLens(element, chiralityBit) {
  if (!element || typeof element.setAttribute !== "function") return false;
  const dir = chiralityBit === 0 ? "ltr" : "rtl";
  element.setAttribute("dir", dir);
  element.setAttribute("data-omicron-lens", dir === "ltr" ? "ο" : "Ο");
  return true;
}

export function evaluateOrbitSector(position) {
  const pos = recoverCosmicPosition(position);
  const orbit = recoverCosmicOrbit(position);
  const sectors = Math.floor(orbit.angle / 60);
  return {
    sector: sectors % 6,
    sextant: sectors % 6,
    angle: orbit.angle,
    row: orbit.row,
    cell: orbit.cell,
    symbol: pos.symbol,
  };
}
