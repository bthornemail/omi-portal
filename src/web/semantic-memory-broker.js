import { HNSWIndex, cosineDistance } from "../distributed/hnsw-index.js";
import { makeWordNetCentroid, relationSetFromLookup } from "../wordnet/relation-space.js";
import { storeTickValue, readTickValue, createPolytopeBuffer } from "../runtime/polytope-sab.js";

export class OmiSemanticMemoryBroker {
  constructor({ prologBroker, hnswIndex, polytopeClock } = {}) {
    if (!prologBroker || typeof prologBroker.lookup !== "function") {
      throw new TypeError("OmiSemanticMemoryBroker requires a PrologWordNetBroker with .lookup()");
    }
    this.prolog = prologBroker;
    this.hnsw = hnswIndex || new HNSWIndex({ distance: cosineDistance, M: 16, efConstruction: 200 });
    this.polytopeClock = polytopeClock || createPolytopeBuffer({ shared: true });
  }

  cons(car, cdr) {
    return Object.freeze({ car, cdr });
  }

  car(cell) {
    return cell.car;
  }

  cdr(cell) {
    return cell.cdr;
  }

  get size() {
    return this.hnsw.size;
  }

  async ingestLemma(lemma, { tick = 0, pos } = {}) {
    const records = await this.prolog.lookup(lemma);
    if (!records || records.length === 0) return null;

    const centroid = makeWordNetCentroid({ lemma, pos: pos || records[0]?.pos || "X", lookupRecords: records });
    const id = `${centroid.lemma}:${centroid.pos}`;
    const vector = new Float32Array(centroid.relationVector);

    try {
      this.hnsw.insert(vector, id);
    } catch {
      return { id, centroid, inserted: false, error: "duplicate" };
    }

    const slot = storeTickValue(this.polytopeClock, tick, this.hnsw.size);

    return { id, centroid, inserted: true, temporalSlot: slot, indexSize: this.hnsw.size };
  }

  async searchByLemma(lemma, k = 10, { pos } = {}) {
    const records = await this.prolog.lookup(lemma);
    if (!records || records.length === 0) return [];

    const centroid = makeWordNetCentroid({ lemma, pos: pos || records[0]?.pos || "X", lookupRecords: records });
    return this.searchByVector(new Float32Array(centroid.relationVector), k);
  }

  searchByVector(vector, k = 10) {
    return this.hnsw.search(vector, k);
  }

  getTemporalSlot(tick) {
    return readTickValue(this.polytopeClock, tick);
  }

  getIndexNode(id) {
    return this.hnsw._nodes.get(id) || null;
  }
}
