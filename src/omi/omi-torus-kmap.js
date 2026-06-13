const TORUS_SIZE = 4;

const GRAY2 = Object.freeze([0b00, 0b01, 0b11, 0b10]);
const GRAY2_INV = Object.freeze({ 0: 0, 1: 1, 3: 2, 2: 3 });

export function toGray2(n) {
  return GRAY2[n & 3] ?? 0;
}

export function fromGray2(g) {
  return GRAY2_INV[g & 3] ?? 0;
}

export function torusIndex(x, y) {
  const gx = toGray2(x);
  const gy = toGray2(y);
  return (gy << 2) | gx;
}

export function torusCoord(index) {
  const gx = index & 3;
  const gy = (index >> 2) & 3;
  return { x: fromGray2(gx), y: fromGray2(gy) };
}

function wrap(n) {
  return ((n % TORUS_SIZE) + TORUS_SIZE) % TORUS_SIZE;
}

export function neighbors(x, y) {
  const result = [];
  const deltas = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  for (const [dx, dy] of deltas) {
    const nx = wrap(x + dx);
    const ny = wrap(y + dy);
    const idx = torusIndex(nx, ny);
    result.push({ x: nx, y: ny, index: idx, gray: toGray2(nx) | (toGray2(ny) << 2) });
  }
  return result;
}

export function wrapX(x) {
  return wrap(x);
}

export function wrapY(y) {
  return wrap(y);
}

export function detectHazard(route) {
  if (!route || route.length < 2) return { hazard: false };
  for (let i = 1; i < route.length; i++) {
    const prev = route[i - 1];
    const curr = route[i];
    const ns = neighbors(prev.x, prev.y);
    const isNeighbor = ns.some(n => n.x === curr.x && n.y === curr.y);
    if (!isNeighbor) {
      return { hazard: true, index: i, prev, curr };
    }
  }
  return { hazard: false };
}

export function groupCells(cells) {
  const visited = new Set();
  const groups = [];
  for (const cell of cells) {
    const key = `${cell.x},${cell.y}`;
    if (visited.has(key)) continue;
    const group = [cell];
    visited.add(key);
    const stack = [cell];
    while (stack.length > 0) {
      const current = stack.pop();
      for (const n of neighbors(current.x, current.y)) {
        const nk = `${n.x},${n.y}`;
        if (visited.has(nk)) continue;
        const match = cells.some(c => c.x === n.x && c.y === n.y);
        if (match) {
          visited.add(nk);
          group.push(n);
          stack.push(n);
        }
      }
    }
    groups.push(group);
  }
  return groups;
}

export const OMI_TORUS_SIZE = TORUS_SIZE;
