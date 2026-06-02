const ORBITAL_WIDTH_W = 36;
const MODE_SWITCH_SENTINEL = 37;
const BASE36_DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";

export function isAAModeSwitch(aa) {
  const val = typeof aa === "string" ? parseInt(aa, 16) : aa;
  return val === MODE_SWITCH_SENTINEL;
}

export function recoverRRGGBBAAOrbit(seed32) {
  const val = (typeof seed32 === "string" ? parseInt(seed32, 16) : seed32) >>> 0;
  const orbit = Math.floor(val / ORBITAL_WIDTH_W);
  const offset = val % ORBITAL_WIDTH_W;
  const base36 = BASE36_DIGITS[offset] || "?";
  const modeSwitch = isAAModeSwitch(val & 0xFF);
  return {
    seed32: val,
    orbit,
    offset,
    base36,
    modeSwitch,
    isValidOffset: offset >= 0 && offset <= 35,
  };
}

export function composeRRGGBBAAOrbit(rgb, aa) {
  const rgbVal = typeof rgb === "string" ? parseInt(rgb.replace(/^#/, ""), 16) : rgb;
  const aaVal = typeof aa === "string" ? parseInt(aa, 16) : aa;
  const seed32 = (((rgbVal & 0xFFFFFF) << 8) | (aaVal & 0xFF)) >>> 0;
  const orbit = Math.floor(seed32 / ORBITAL_WIDTH_W);
  const offset = seed32 % ORBITAL_WIDTH_W;
  const base36 = BASE36_DIGITS[offset] || "?";
  return {
    seed32,
    orbit,
    offset,
    base36,
    modeSwitch: isAAModeSwitch(aaVal),
    rgb: (seed32 >> 8) & 0xFFFFFF,
    aa: seed32 & 0xFF,
    rgbHex: ((seed32 >> 8) & 0xFFFFFF).toString(16).padStart(6, "0"),
    aaHex: (seed32 & 0xFF).toString(16).padStart(2, "0"),
  };
}

export function recoverRGBFromSeed32(seed32) {
  const rgb = (seed32 >> 8) & 0xFFFFFF;
  const aa = seed32 & 0xFF;
  return {
    rgb,
    aa,
    display: `#${rgb.toString(16).padStart(6, "0")}`,
    aaHex: aa.toString(16).padStart(2, "0"),
    aaDecimal: aa,
    modeSwitch: isAAModeSwitch(aa),
  };
}

export function verifyColorOrbit(colorHex, aaHex) {
  const stripped = colorHex.replace(/^#/, "");
  const rgb = parseInt(stripped, 16);
  const aa = parseInt(aaHex, 16);
  const { seed32, orbit, offset, base36, modeSwitch } = composeRRGGBBAAOrbit(rgb, aa);
  const rederived = recoverRRGGBBAAOrbit(seed32);
  return {
    rgb,
    aa,
    seed32,
    orbit,
    offset,
    base36,
    modeSwitch,
    verify: orbit === rederived.orbit && offset === rederived.offset,
  };
}
