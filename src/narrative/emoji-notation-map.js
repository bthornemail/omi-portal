export const CANONICAL_ACTOR_ORDER = [
  'Solomon', 'Solon', 'Asabiyyah', 'Logos', 'Number',
  'Beast', 'Metatron', 'Gate', 'Ledger', 'City',
  'Tower', 'Flood', 'Spheres', 'Breath'
];

export const ACTOR_KEYWORDS = {
  Solomon: ['solomon', 'wisdom', 'discern', 'judgment', 'judge'],
  Solon: ['solon', 'law', 'measure', 'justice', 'institution'],
  Asabiyyah: ['asabiyyah', 'asabiyah', 'cohesion', 'tribe', 'loyalty', 'belonging'],
  Logos: ['logos', 'word', 'meaning', 'relation'],
  Number: ['number', 'count', 'measure', 'rank', 'compare'],
  Beast: ['beast', 'mark', 'comparison'],
  Metatron: ['metatron', 'watcher', 'scribe', 'witness', 'boundary'],
  Gate: ['gate', 'entrance', 'passage', 'transition'],
  Ledger: ['ledger', 'counting', 'ledger'],
  City: ['city', 'shared', 'container'],
  Tower: ['tower', 'babel', 'coordination'],
  Flood: ['flood', 'reset', 'preservation'],
  Spheres: ['sphere', 'lives', 'perspective'],
  Breath: ['breath', 'yhwh', 'rhythm', 'tick']
};

export const EMOJI_BY_ACTOR = {
  Solomon: '\u{1F451}\u{1F4DC}\u{1F56D}\uFE0F',
  Solon: '\u{2696}\uFE0F\u{1F3DB}\uFE0F\u{1F4CF}',
  Asabiyyah: '\u{1F9EC}\u{1F525}\u{1F91D}',
  Logos: '\u{1F4DD}\u{2728}\u{1F54A}\uFE0F',
  Number: '\u{1F522}\u{1F4CA}\u{1F4CF}',
  Beast: '\u{1F409}',
  Metatron: '\u{1F441}\uFE0F\u{270D}\uFE0F\u{1F6AA}',
  Gate: '\u{1F6AA}',
  Ledger: '\u{1F4D2}',
  City: '\u{1F3D9}\uFE0F',
  Tower: '\u{1F5FC}',
  Flood: '\u{1F30A}',
  Spheres: '\u{1F310}',
  Breath: '\u{1F32C}\uFE0F'
};

export const EMOJI_BY_UPOS = {
  NOUN: '\u{1F4E6}',
  PROPN: '\u{1F464}',
  VERB: '\u{1F3C3}',
  ADJ: '\u{1F3A8}',
  ADV: '\u{1F4CD}',
  INTJ: '\u{1F4AC}',
  PRON: '\u{1F916}',
  ADP: '\u{2194}\uFE0F',
  AUX: '\u{2699}\uFE0F',
  CCONJ: '\u{1F517}',
  DET: '\u{1F3AF}',
  NUM: '\u{0023}\uFE0F\u20E3',
  PART: '\u{2753}',
  SCONJ: '\u{1F504}',
  PUNCT: '\u{2E3B}',
  SYM: '\u{1F4B1}',
  X: '\u{2754}'
};

export function lookupEmojiCarrier(name) {
  const key = Object.keys(EMOJI_BY_ACTOR).find(
    k => k.toLowerCase() === name.toLowerCase()
  );
  return key ? EMOJI_BY_ACTOR[key] : null;
}

export function resolveWorldEmoji(worldObject) {
  if (!worldObject) return null;
  const name = worldObject.actor || worldObject.name || '';
  const carrier = lookupEmojiCarrier(name);
  if (carrier) return carrier;
  if (worldObject.upos) return EMOJI_BY_UPOS[worldObject.upos] || null;
  return null;
}

export function matchActorFromToken(text) {
  const lower = text.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const [actor, keywords] of Object.entries(ACTOR_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return actor;
    }
  }
  return null;
}
