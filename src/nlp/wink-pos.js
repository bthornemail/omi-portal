import winkNLP from "wink-nlp";
import model from "wink-eng-lite-web-model";
import { normalizePosTag } from "../pos-tags.js";

const nlp = winkNLP(model);
const its = nlp.its;

function tokenOut(token, fallbackIndex) {
  const value = token.out(its.value);
  const normal = token.out(its.normal);
  let pos = "X";
  try {
    pos = token.out(its.pos);
  } catch {
    pos = "X";
  }
  return {
    i: fallbackIndex,
    value,
    normal,
    pos: normalizePosTag(pos)
  };
}

export function readPOSTokens(text) {
  const doc = nlp.readDoc(String(text || ""));
  const out = [];
  let i = 0;
  doc.tokens().each((token) => out.push(tokenOut(token, i++)));
  return out;
}

export function readSentences(text) {
  const doc = nlp.readDoc(String(text || ""));
  const sentences = [];
  doc.sentences().each((sentence) => sentences.push(sentence.out(its.text)));
  return sentences;
}

export { nlp, its };
