export type NomogramMode = 'forward' | 'inverse' | 'folded' | 'periodic';
export type NomogramResult = { scale: number; label: string; expression: string; value: number | string };

export const SCALE_LABELS: Record<number, string> = {
  0x30: 'identity / unity',
  0x31: 'log multiply-divide',
  0x32: 'square / square-root',
  0x33: 'cube / cube-root',
  0x34: 'folded pi scale',
  0x35: 'reciprocal',
  0x36: 'sine / cosine',
  0x37: 'tangent / cotangent',
  0x38: 'small-angle / degree-radian',
  0x39: 'Pythagorean',
  0x3a: 'log10 / powers of ten',
  0x3b: 'ln / exp',
  0x3c: 'sexagesimal 60 gate',
  0x3d: 'roots and powers',
  0x3e: 'quadratic / gnomon',
  0x3f: 'LFSR / period'
};

export function slide(scale: number, a: number, b = 1, mode: NomogramMode = 'forward'): NomogramResult {
  const label = SCALE_LABELS[scale] ?? 'unknown';
  switch (scale) {
    case 0x30: return out(scale, label, 'a', a);
    case 0x31: return out(scale, label, 'log(a)+log(b)', Math.log(Math.max(a, Number.MIN_VALUE)) + Math.log(Math.max(b, Number.MIN_VALUE)));
    case 0x32: return mode === 'inverse' ? out(scale, label, 'sqrt(a)', Math.sqrt(a)) : out(scale, label, 'a^2', a * a);
    case 0x33: return mode === 'inverse' ? out(scale, label, 'cbrt(a)', Math.cbrt(a)) : out(scale, label, 'a^3', a * a * a);
    case 0x34: return out(scale, label, 'a * π', a * Math.PI);
    case 0x35: return out(scale, label, '1/a', a === 0 ? 'undefined' : 1 / a);
    case 0x36: return out(scale, label, mode === 'inverse' ? 'cos(a)' : 'sin(a)', mode === 'inverse' ? Math.cos(a) : Math.sin(a));
    case 0x37: return out(scale, label, mode === 'inverse' ? '1/tan(a)' : 'tan(a)', mode === 'inverse' ? 1 / Math.tan(a) : Math.tan(a));
    case 0x38: return out(scale, label, mode === 'inverse' ? 'degrees(a)' : 'radians(a)', mode === 'inverse' ? a * 180 / Math.PI : a * Math.PI / 180);
    case 0x39: return out(scale, label, 'sqrt(1-a^2)', Math.sqrt(Math.max(0, 1 - a * a)));
    case 0x3a: return out(scale, label, 'log10(a)', Math.log10(Math.max(a, Number.MIN_VALUE)));
    case 0x3b: return mode === 'inverse' ? out(scale, label, 'exp(a)', Math.exp(a)) : out(scale, label, 'ln(a)', Math.log(Math.max(a, Number.MIN_VALUE)));
    case 0x3c: return out(scale, label, 'a mod 60', ((a % 60) + 60) % 60);
    case 0x3d: return out(scale, label, 'a^b', Math.pow(a, b));
    case 0x3e: return out(scale, label, 'a^2-b^2', a * a - b * b);
    case 0x3f: return out(scale, label, '2^n-1', Math.pow(2, Math.max(0, Math.floor(a))) - 1);
    default: return out(scale, label, 'unknown', 'unknown');
  }
}

function out(scale: number, label: string, expression: string, value: number | string): NomogramResult {
  return { scale, label, expression, value };
}
