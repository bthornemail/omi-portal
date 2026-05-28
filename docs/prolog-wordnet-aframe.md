# Prolog WordNet A-Frame Broker

OMI service bus `::3` is represented in v1 by a deterministic JavaScript fact broker over the local WordNet Prolog database files in `vendor/prolog/`.

The routing model separates three address domains:

- `::1..::8`: semantic content service buses.
- `::ffff:127.0.0.1`: browser-local context addressing, serialized as `omi-ffff-127-0-0-1`.
- `::/128`: remote codepoint hierarchy marker for non-local routing surfaces.

Within that service range, `::3` is the WordNet synset broker and `::4` is the CoTURN/TURN synset routing proxy. V1 records `turn` transport in the OMI token and data attributes, but does not open a WebRTC or CoTURN socket.

The implementation does not embed a Prolog runtime. It parses `wn_s.pl`, `wn_g.pl`, and selected relation files such as `wn_hyp.pl`, `wn_sim.pl`, `wn_ent.pl`, `wn_ant.pl`, and `wn_der.pl`, then exposes a WordPOS-compatible lookup API.

```js
import { createPrologWordNetBroker, compileTextToWordNetTetraSCGNN } from "./src/index.js";

const broker = await createPrologWordNetBroker({
  dictPath: "vendor/prolog",
  operators: ["hyp", "sim", "ent", "ant", "der"]
});

const compiled = await compileTextToWordNetTetraSCGNN("person", {
  wordpos: broker,
  minRelations: 6
});
```

## OMI Fano Token

The Fano/Prolog routing helper uses the docs’ compact service form:

```text
omi-fano-p3-local-hyp-100002684-100001930-Mood_Ind-Tense_Pres-slot720-PAYLOAD
```

The parser validates:

- Fano point `p1..p7`
- transport `local` or `turn`
- WordNet operator from the supported `wn_*.pl` relation set
- 9-byte WordNet synset IDs
- slot `0..5040`
- URL-safe Base64 Float32 payload

`serializePrologWordNetPacket(token)` returns the 16-byte DataView frame described in `dev-docs/Omi Porting.md`.

`makeOmiSynsetRoutingFrame(token, options)` projects the token into DOM/A-Frame attributes for the two-cube Universal POS and Universal Features routing table:

```text
data-omi-service-bus="3"
data-omi-transport-bus="1|4"
data-upos="NOUN"
data-ufeatures="lemma_object rel_hyp"
```

## A-Frame Binding

`aframe.html` is the v1 GUI surface. Its `::3 Prolog WordNet Broker` panel queries the local broker, renders returned synsets as A-Frame entities, and attaches browser-native routing metadata:

```text
data-omi
data-omi-service="prolog-wndb"
data-omi-service-bus="3"
data-omi-transport-bus
data-wn-operator
data-synset-id
data-omi-centroid
data-omi-synset-cells
```

The scene preserves the existing FS/GS/RS/US tetrahedron, Smith texture, projection controls, chirality controls, and multi-view inspector.
