import { compileTextToPOSSCGNN } from "../src/index.js";

const text = process.argv.slice(2).join(" ") || "The chiral clock routes text into file blobs through graph links.";
const out = compileTextToPOSSCGNN(text);
console.log(JSON.stringify({
  tokens: out.tokens,
  features: out.features,
  canvas: out.canvas
}, null, 2));
