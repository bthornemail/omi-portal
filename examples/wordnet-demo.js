import { compileTextToWordNetTetraSCGNN } from "../src/index.js";

// This demo uses a mock WordPOS-compatible object so it runs without fetching the WordNet DB.
// In the browser, pass a real `new WordPOS({ dictPath: "/wordpos/dict" })` instance instead.
const wordpos = {
  async lookup(lemma) {
    return [{
      lemma,
      synonyms: [lemma, `${lemma}_sense`],
      hypernyms: ["object"],
      hyponyms: [`${lemma}_node`],
      meronyms: ["edge"],
      holonyms: ["graph"],
      antonyms: ["void"]
    }];
  }
};

const text = process.argv.slice(2).join(" ") || "DOM nodes route CSSOM style rules into canvas groups.";
const compiled = await compileTextToWordNetTetraSCGNN(text, { wordpos });
console.log(JSON.stringify({
  centroids: compiled.nodes.map((n) => ({
    token: n.label,
    address: n.address,
    centroid: n.centroid,
    stable: n.wordnet.metric.stable,
    canonical: n.wordnet.cells.canonical,
    fiveCell: n.wordnet.cells.fiveCell.active,
    twentyFourCell: n.wordnet.cells.twentyFourCell.active
  })),
  tetrahedron: compiled.tetrahedron
}, null, 2));
