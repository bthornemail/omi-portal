import { word16 } from "./polybius-group-frame.js";
import { sealedGauge } from "./sealed-gauge-word.js";
import { projectSocket } from "./base36-socket-projector.js";

export function computeMatrixCycle({ gauge, p, r, car, cdr }) {
  const w16 = word16(p, r);
  const sg = sealedGauge(gauge);
  const socket = projectSocket(car, gauge);
  return {
    gauge,
    p,
    r,
    word16: w16,
    sealedGauge: sg,
    car,
    cdr,
    ...socket,
  };
}
