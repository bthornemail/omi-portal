import { packMultiplexAddress } from "./multiplex.js";
import { omiLocal240 } from "../canvas/omicron-canvas.js";

const ORBITAL_WIDTH_W = 36;
const TRANSYLVANIA_CEILING = 14;

const MIQUEL_CONFIGURATIONS = Object.freeze({
  "8_3_6_4": Object.freeze({
    points: 8,
    circles: 6,
    automorphisms: 48,
    symmetry: "OCTAHEDRAL",
    leviGraph: "rhombic-dodecahedral",
  }),
  "6_4_8_3": Object.freeze({
    points: 6,
    circles: 8,
    automorphisms: 128,
    symmetry: "TETRAHEDRAL",
    leviGraph: "cuboctahedral",
  }),
});

const PRIME_SWITCH_EVEN = 73;
const PRIME_SWITCH_ODD = 37;

export function recoverColorOrbit(hexColorStr) {
  if (!hexColorStr || hexColorStr.length !== 8) {
    throw new Error("Color carrier payload must be an exact 8-character hex string.");
  }
  const intVal = parseInt(hexColorStr, 16);
  if (isNaN(intVal)) {
    throw new Error("Color carrier payload must be a valid hex string.");
  }
  const orbit = Math.floor(intVal / ORBITAL_WIDTH_W);
  const offset = intVal % ORBITAL_WIDTH_W;
  const activePrimeMode = offset % 2 === 0 ? PRIME_SWITCH_EVEN : PRIME_SWITCH_ODD;
  return {
    integerPayload: intVal,
    orbitQuotient: orbit,
    offsetRemainder: offset,
    activePrimeMode,
    isValidOmiMiquelCarrier: true,
  };
}

export function getMiquelConfiguration(configType) {
  return MIQUEL_CONFIGURATIONS[configType] || MIQUEL_CONFIGURATIONS["8_3_6_4"];
}

export function miquelDivmod36(value) {
  const intVal = typeof value === "string" ? parseInt(value, 16) : value;
  const orbit = Math.floor(intVal / ORBITAL_WIDTH_W);
  const offset = intVal % ORBITAL_WIDTH_W;
  const activePrimeMode = offset % 2 === 0 ? PRIME_SWITCH_EVEN : PRIME_SWITCH_ODD;
  return { integerPayload: intVal, orbitQuotient: orbit, offsetRemainder: offset, activePrimeMode };
}

export function compileMiquelVoxel(schemaInstance) {
  const hexCarrier = schemaInstance.color_carrier_payload.hex_string_32bit;
  const { orbitQuotient, offsetRemainder, activePrimeMode } = recoverColorOrbit(hexCarrier);
  const torusX = offsetRemainder % 4;
  const torusY = Math.floor(offsetRemainder / 4) % 4;
  const local240 = omiLocal240(torusX, torusY);
  const laneLL = (orbitQuotient % 256);
  const bodyNN = activePrimeMode;
  const carrierMM = local240;
  const canonicalAddress = packMultiplexAddress(laneLL, bodyNN, carrierMM);
  const geom = schemaInstance.miquel_geometry_profile;
  const elementColor = `#${hexCarrier.substring(0, 6)}`;
  const config = getMiquelConfiguration(geom.configuration_type);
  const spatialMultiplier = geom.configuration_type === "8_3_6_4" ? 5 : 3;
  const zExtrusion = (local240 / 6) + (offsetRemainder * spatialMultiplier);
  return {
    elementColor,
    canonicalAddress,
    activePrimeMode,
    torusX,
    torusY,
    local240,
    zExtrusion,
    points: config.points,
    circles: config.circles,
    automorphisms: config.automorphisms,
    symmetry: config.symmetry,
    transylvaniaStepCode: offsetRemainder % TRANSYLVANIA_CEILING,
  };
}

export class OmiMiquelRouter {
  constructor() {
    this.orbitalWidth = ORBITAL_WIDTH_W;
  }

  recoverColorOrbit(hexColorStr) {
    return recoverColorOrbit(hexColorStr);
  }

  compileMiquelVoxel(schemaInstance) {
    return compileMiquelVoxel(schemaInstance);
  }

  getConfiguration(configType) {
    return getMiquelConfiguration(configType);
  }
}
