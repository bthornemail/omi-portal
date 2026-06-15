export const GAUGE = Object.freeze({
  FS: Object.freeze({ mask: 0x0001, token: "o---o", role: "object" }),
  GS: Object.freeze({ mask: 0x0010, token: "/---/", role: "path" }),
  RS: Object.freeze({ mask: 0x0100, token: "?---?", role: "query" }),
  US: Object.freeze({ mask: 0x1000, token: "@---@", role: "socket" }),
});

export const GAUGE_NAMES = Object.freeze(["FS", "GS", "RS", "US"]);

export const ACCEPTANCE_BRIDGE = 0xAA55;

export function sealedGauge(name) {
  const record = GAUGE[name];
  if (!record) {
    throw new RangeError(`unknown gauge: ${name}`);
  }
  return ((record.mask << 16) | ACCEPTANCE_BRIDGE) >>> 0;
}

export function parseSealedGauge(sg) {
  const value = Number(sg) >>> 0;
  const suffix = value & 0xffff;
  if (suffix !== ACCEPTANCE_BRIDGE) {
    return null;
  }
  const mask = (value >>> 16) & 0xffff;
  for (const name of GAUGE_NAMES) {
    if (GAUGE[name].mask === mask) {
      return { name, ...GAUGE[name] };
    }
  }
  return null;
}
