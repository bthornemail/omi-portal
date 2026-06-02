const RGB_CUBE_VERTICES = Object.freeze([
  { hex: "000000", name: "black",   r: 0x00, g: 0x00, b: 0x00 },
  { hex: "FF0000", name: "red",     r: 0xFF, g: 0x00, b: 0x00 },
  { hex: "00FF00", name: "green",   r: 0x00, g: 0xFF, b: 0x00 },
  { hex: "0000FF", name: "blue",    r: 0x00, g: 0x00, b: 0xFF },
  { hex: "FFFF00", name: "yellow",  r: 0xFF, g: 0xFF, b: 0x00 },
  { hex: "FF00FF", name: "magenta", r: 0xFF, g: 0x00, b: 0xFF },
  { hex: "00FFFF", name: "cyan",    r: 0x00, g: 0xFF, b: 0xFF },
  { hex: "FFFFFF", name: "white",   r: 0xFF, g: 0xFF, b: 0xFF },
]);

const RGB_CHANNEL_FACES = Object.freeze([
  { name: "R=0",   axis: "R", value: 0x00 },
  { name: "R=255", axis: "R", value: 0xFF },
  { name: "G=0",   axis: "G", value: 0x00 },
  { name: "G=255", axis: "G", value: 0xFF },
  { name: "B=0",   axis: "B", value: 0x00 },
  { name: "B=255", axis: "B", value: 0xFF },
]);

export function getRgbCubeVertices() {
  return [...RGB_CUBE_VERTICES];
}

export function getRgbChannelFaces() {
  return [...RGB_CHANNEL_FACES];
}

export function getVerticesOnFace(face) {
  const { axis, value } = face;
  return RGB_CUBE_VERTICES.filter(v => v[axis.toLowerCase()] === value).map(v => v.hex);
}

export function getFacesForVertex(vertex) {
  const v = RGB_CUBE_VERTICES.find(c => c.hex === vertex);
  if (!v) return [];
  const faces = [];
  for (const face of RGB_CHANNEL_FACES) {
    if (v[face.axis.toLowerCase()] === face.value) {
      faces.push(face.name);
    }
  }
  return faces;
}

export function buildMiquelRgbIncidence() {
  const incidence = [];
  for (const vertex of RGB_CUBE_VERTICES) {
    for (const face of RGB_CHANNEL_FACES) {
      if (vertex[face.axis.toLowerCase()] === face.value) {
        incidence.push({
          vertex: vertex.hex,
          vertexName: vertex.name,
          face: face.name,
          axis: face.axis,
          channelValue: face.value,
        });
      }
    }
  }
  return incidence;
}

export function validateMiquelRgbIncidence() {
  const incidence = buildMiquelRgbIncidence();
  const errors = [];
  if (incidence.length !== 24) {
    errors.push(`expected 24 incidences, got ${incidence.length}`);
  }
  if (RGB_CUBE_VERTICES.length !== 8) {
    errors.push(`expected 8 vertices, got ${RGB_CUBE_VERTICES.length}`);
  }
  if (RGB_CHANNEL_FACES.length !== 6) {
    errors.push(`expected 6 faces, got ${RGB_CHANNEL_FACES.length}`);
  }
  for (const vertex of RGB_CUBE_VERTICES) {
    const vIncidence = incidence.filter(i => i.vertex === vertex.hex);
    if (vIncidence.length !== 3) {
      errors.push(`vertex ${vertex.hex} has ${vIncidence.length} incidences, expected 3`);
    }
  }
  for (const face of RGB_CHANNEL_FACES) {
    const fIncidence = incidence.filter(i => i.face === face.name);
    if (fIncidence.length !== 4) {
      errors.push(`face ${face.name} has ${fIncidence.length} incidences, expected 4`);
    }
  }
  return { valid: errors.length === 0, errors, incidenceCount: incidence.length };
}
