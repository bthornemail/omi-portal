const winkNLP = require("wink-nlp");
const model = require("wink-eng-lite-web-model");
const nlp = winkNLP(model);
const its = nlp.its;

window.omiPOSTags = function omiPOSTags(text) {
  const doc = nlp.readDoc(text);
  const rows = [];
  doc.tokens().each((t) => {
    let pos = "X";
    try { pos = t.out(its.pos); } catch (_) {}
    rows.push({ token: t.out(its.value), normal: t.out(its.normal), pos });
  });
  return rows;
};
