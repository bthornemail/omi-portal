import { cla4, bitsToNibble } from "./cla4.js";

const NID_MAP = Object.freeze(["omi", "uuid", "ietf", "cid", "sha256", "jsoncanvas", "pos", "scgnn"]);

function b64url(input) {
  const bytes = new TextEncoder().encode(String(input));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export function resolveChiralURN({ stateA, stateB, portId, namespace = "pos" }) {
  const cla = cla4(stateA, stateB, portId & 1);
  const nibble = bitsToNibble(cla.S);
  const nid = NID_MAP[(nibble + (portId & 7)) % NID_MAP.length];
  const nss = b64url(`${namespace}:a${stateA & 15}:b${stateB & 15}:p${portId & 31}:s${cla.S.join("")}`);
  const query = cla.Cout ? `?cout=1&sum=${cla.S.join("")}` : "";
  return {
    urn: `urn:${nid}:${nss}${query}`,
    nid,
    nss,
    cla,
    executable: cla.Cout === 1
  };
}
