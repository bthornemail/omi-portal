import { CHANNELS, POS_INDEX, UNIVERSAL_POS_TAGS, posToChannel } from "../pos-tags.js";

export function posFeatureVector(tokens) {
  const posCounts = new Float32Array(UNIVERSAL_POS_TAGS.length);
  const channelCounts = new Float32Array(CHANNELS.length);
  const transitionCounts = new Map();

  for (let i = 0; i < tokens.length; i++) {
    const tag = tokens[i].pos;
    const posIndex = POS_INDEX[tag] ?? POS_INDEX.X;
    posCounts[posIndex] += 1;

    const ch = posToChannel(tag);
    channelCounts[CHANNELS.indexOf(ch)] += 1;

    if (i > 0) {
      const key = `${tokens[i - 1].pos}>${tag}`;
      transitionCounts.set(key, (transitionCounts.get(key) || 0) + 1);
    }
  }

  const denom = Math.max(1, tokens.length);
  const featureVector = [
    ...Array.from(posCounts, (v) => v / denom),
    ...Array.from(channelCounts, (v) => v / denom)
  ];

  return {
    posCounts: Object.fromEntries(UNIVERSAL_POS_TAGS.map((tag, i) => [tag, posCounts[i]])),
    channelCounts: Object.fromEntries(CHANNELS.map((ch, i) => [ch, channelCounts[i]])),
    transitionCounts: Object.fromEntries([...transitionCounts.entries()].sort()),
    featureVector
  };
}

export function featureTokens(tokens) {
  const out = [];
  for (let i = 0; i < tokens.length; i++) {
    const tag = tokens[i].pos;
    const channel = posToChannel(tag);
    out.push({
      id: `tok-${String(i).padStart(4, "0")}`,
      token: tokens[i].normal || tokens[i].value,
      raw: tokens[i].value,
      pos: tag,
      channel,
      feature: `POS:${tag}`,
      transition: i === 0 ? "BOS" : `POS:${tokens[i - 1].pos}>${tag}`
    });
  }
  return out;
}
