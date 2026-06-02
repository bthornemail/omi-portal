export function packMultiplexAddress(laneLL, bodyNN, carrierMM) {
  const s0 = ((laneLL & 0xFF) << 8).toString(16).padStart(4, '0');
  const s1 = "03bf";
  const s2 = (bodyNN & 0xFFFF).toString(16).padStart(4, '0');
  const s3 = (0x2B00 | (laneLL & 0xFF)).toString(16).padStart(4, '0');
  const s4 = (0x2F00 | (laneLL & 0xFF)).toString(16).padStart(4, '0');
  const s5 = (carrierMM & 0xFFFF).toString(16).padStart(4, '0');
  const s6 = "039f";
  const s7 = ((laneLL & 0xFF) << 8 | 0xFF).toString(16).padStart(4, '0');
  return `omi-${s0}-${s1}-${s2}-${s3}-${s4}-${s5}-${s6}-${s7}/128`;
}

export function unpackMultiplexAddress(addressString) {
  const parts = addressString.replace("omi-", "").split("/");
  const segments = parts[0].split("-");
  return {
    laneLL: parseInt(segments[0], 16) >> 8,
    bodyNN: parseInt(segments[2], 16),
    carrierMM: parseInt(segments[5], 16)
  };
}
