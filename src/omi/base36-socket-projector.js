import { omiQuadraticProject } from "../canvas/omicron-canvas.js";
import { GAUGE_NAMES } from "./sealed-gauge-word.js";

export function parseBase36(car) {
  const text = String(car ?? "").trim().toUpperCase();
  if (!/^[0-9A-Z]+$/.test(text)) {
    throw new SyntaxError(`invalid Base36 socket: ${car}`);
  }
  let value = 0;
  for (const ch of text) {
    const digit =
      ch >= "0" && ch <= "9"
        ? ch.charCodeAt(0) - 48
        : ch.charCodeAt(0) - 55;
    value = value * 36 + digit;
  }
  return value;
}

export function projectSocket(car, gaugeName) {
  const value36 = parseBase36(car);
  const region36 = Math.floor(value36 / 16);
  const local16 = value36 % 16;
  const x = local16 % 4;
  const y = Math.floor(local16 / 4);
  const qxy = omiQuadraticProject(x, y);
  const local240 = qxy % 240;
  const fano7 = region36 % 7;
  const role3 = GAUGE_NAMES.indexOf(gaugeName) % 3;
  const slot5040 = (fano7 * 720 + role3 * 240 + local240) % 5040;
  return { value36, region36, local16, x, y, qxy, local240, fano7, role3, slot5040 };
}
