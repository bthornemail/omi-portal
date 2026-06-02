const HEX6_RE = /^#[0-9A-Fa-f]{6}$/;
const PRESET_RE = /^[1-6]$/;

const PRESET_NAMES = Object.freeze({
  "1": "red",
  "2": "orange",
  "3": "yellow",
  "4": "green",
  "5": "cyan",
  "6": "purple",
});

const PRESET_HEX = Object.freeze({
  "1": "#FF0000",
  "2": "#FFA500",
  "3": "#FFFF00",
  "4": "#00FF00",
  "5": "#00FFFF",
  "6": "#800080",
});

export function classifyCanvasColor(color) {
  if (typeof color !== "string") {
    return { classification: "INVALID", layer: null, color };
  }
  if (HEX6_RE.test(color)) {
    return {
      classification: "LOWER_HEX_STRUCTURAL_COLOR",
      layer: "lower",
      stack: "≤8!",
      color,
      hex: color,
      preset: null,
    };
  }
  if (PRESET_RE.test(color)) {
    return {
      classification: "UPPER_PRESET_READER_COLOR",
      layer: "upper",
      stack: "9!–12!",
      color,
      hex: PRESET_HEX[color],
      preset: { key: color, name: PRESET_NAMES[color] },
    };
  }
  return { classification: "INVALID", layer: null, color };
}

export function routeCanvasColor(color) {
  const classified = classifyCanvasColor(color);
  if (classified.layer === "lower") {
    return {
      ...classified,
      route: "structural-canvas-body",
      authority: "lower-omicron-exact",
    };
  }
  if (classified.layer === "upper") {
    return {
      ...classified,
      route: "reader-cosmetic-shell",
      authority: "upper-bidi-preset",
    };
  }
  return { ...classified, route: "rejected", authority: null };
}

export function isLowerHexColor(color) {
  return classifyCanvasColor(color).layer === "lower";
}

export function isUpperPresetColor(color) {
  return classifyCanvasColor(color).layer === "upper";
}

export function hexToPreset(hexColor) {
  const c = classifyCanvasColor(hexColor);
  if (c.layer !== "lower") return null;
  const hex = c.hex.toLowerCase();
  for (const [key, presetHex] of Object.entries(PRESET_HEX)) {
    if (presetHex.toLowerCase() === hex) return { key, name: PRESET_NAMES[key] };
  }
  return null;
}

export function presetToHex(presetKey) {
  const c = classifyCanvasColor(presetKey);
  return c.layer === "upper" ? c.hex : null;
}
