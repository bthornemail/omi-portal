export function doublePlane(leftPlane, rightPlane) {
  if (!Array.isArray(leftPlane) || !Array.isArray(rightPlane)) {
    throw new TypeError('doublePlane: both arguments must be arrays');
  }
  return [...leftPlane, ...rightPlane];
}

export function mirrorOmiToImo(sourceRecord) {
  if (typeof sourceRecord !== 'string') return '';
  return sourceRecord.replace(/[a-zA-Z]/g, ch =>
    ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase()
  );
}

export function conjugateDescriptor(record) {
  if (typeof record !== 'string') return '';
  return [...record].map(ch => {
    const code = ch.charCodeAt(0);
    if (code >= 0x00 && code <= 0x1f) {
      return String.fromCharCode(code + 0x20);
    }
    if (code >= 0x20 && code <= 0x3f) {
      return String.fromCharCode(code - 0x20);
    }
    return ch;
  }).join('');
}

export function splitNativePlane64(value) {
  if (value < 0 || value > 63) return null;
  return {
    half: value < 0x20 ? 'hidden' : 'visible',
    localIndex: value < 0x20 ? value : value - 0x20
  };
}
