export type Hex = `0x${string}`;

export type OmiAddress = {
  frame: number;
  control: number;
  scale: number;
  relation: number;
  unit: number;
};

export type OmiCell = {
  page: number;
  row: number;
  x: number;
  y: number;
  cell: number;
  scalar: number;
};

export type OmiCons = {
  car: number;
  cdr: number;
  cid: number;
};

export type OmiSnapshot = {
  version: 1;
  rootAddress: string;
  createdAt: string;
  bitboardBase64: string;
  rewritesBase64: string;
  receipt: string;
  cells: number;
};

export type RewriteEntry = {
  cell: number;
  value: number;
  label?: string;
};
