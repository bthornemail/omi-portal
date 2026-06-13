const SIZE = 5;
const ORIGIN_CELL = Symbol("o---o");

const CELL_INDEX = new Array(SIZE * SIZE);
for (let r = 0; r < SIZE; r++) {
  for (let c = 0; c < SIZE; c++) {
    CELL_INDEX[r * SIZE + c] = { row: r + 1, col: c + 1 };
  }
}

export function getCell(row, col) {
  if (row < 1 || row > SIZE || col < 1 || col > SIZE) {
    return null;
  }
  return { row, col };
}

export function getOrigin() {
  return { row: 1, col: 1, cell: ORIGIN_CELL };
}

export function isOrigin(row, col) {
  return row === 1 && col === 1;
}

export function getLowQuquart(index) {
  if (index < 0 || index > 3) return null;
  return { row: 1, col: index + 2 };
}

export function getHighQuquart(index) {
  if (index < 0 || index > 3) return null;
  return { row: index + 2, col: 1 };
}

export function getInteriorCell(x, y) {
  if (x < 0 || x > 3 || y < 0 || y > 3) return null;
  return { row: y + 2, col: x + 2 };
}

export function isRail(row, col) {
  if (row < 1 || row > SIZE || col < 1 || col > SIZE) return false;
  if (isOrigin(row, col)) return false;
  return row === 1 || col === 1;
}

export function isInterior(row, col) {
  if (row < 1 || row > SIZE || col < 1 || col > SIZE) return false;
  if (isOrigin(row, col)) return false;
  return row > 1 && col > 1;
}

export function forEachCell(fn) {
  const results = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const row = r + 1, col = c + 1;
      results.push(fn({ row, col, origin: isOrigin(row, col), rail: isRail(row, col), interior: isInterior(row, col) }));
    }
  }
  return results;
}

export const POLYBIUS_FRAME_SIZE = SIZE;
