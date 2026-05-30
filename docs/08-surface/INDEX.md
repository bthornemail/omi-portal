# OMI Browser Surface Implementations

Index of the 8 canonical browser object surfaces defined in `omi-object-model.md`:

| # | Surface | Role | Status | File(s) |
|---|---------|------|--------|---------|
| 1 | **DOM** | Runtime object tree, ids, events, data attributes | implemented | `src/omi/omicron-kernel.js`, `public/bidi.html` |
| 2 | **CSSOM** | Selector/rule surface for prefix routing and visual state | implemented | `public/bidi.css` |
| 3 | **JSDOM** | Server/test mirror of DOM/CSSOM semantics | documented | `test/` |
| 4 | **SVG** | 2D addressable graph and tile surface | implemented | `public/bidi.html` (inline SVG), `public/aframe.html` |
| 5 | **A-Frame** | 3D WebGL-backed entity surface | implemented | `public/aframe.html` |
| 6 | **JSON Canvas** | Portable graph export surface | implemented | `src/canvas/omicron-canvas.js` |
| 7 | **CodeMirror 6** | Transactional text token and BiDi bridge surface | implemented | `src/bidi/codemirror-bidi.js` |
| 8 | **WordNet/Prolog** | Synset relation and semantic centroid surface | implemented | `src/wordnet/`, `src/prolog/` |

See `docs/07-application/omi-object-model.md` § "Browser Object Surfaces" for the canonical surface definitions.
