# AGENTS

This repository is the root OMI Portal workspace. Treat it as the canonical implementation branch.

## Ground Rules

- Preserve the existing POS graph channel behavior.
- Preserve WordNet synset cells as semantic centroid identity.
- Add OMI projection and indexing as a bridge layer, not as a replacement for existing graph semantics.
- Keep `dev-docs/` as source/reference material. Do not copy transcript content wholesale into canonical docs.
- Treat `demos/` as reference-only snapshots unless a root artifact is truly missing.
- Do not rewrite `chat.history.html`.

## Current Canonical Roots

- Address root: `omi-8-ffff-127-0-0-1`
- Main framework doc: `docs/omi-object-model.md`
- Manifest: `docs/omi-object-model.manifest.json`
- GUI files: `public/document.html`, `public/aframe.html`, `public/bidi.html`

## Implementation Expectations

- Prefer reusable source modules under `src/` over inline GUI-only logic.
- Keep browser GUIs lightweight and wired to exported helpers.
- Use native DOM `dataset` and CSSOM selectors as the filtering/display source of truth when possible.
- Keep speculative WebRTC, CoTURN, HNSW, CodeMirror, Prolog runtime, and WebGL surfaces clearly labeled unless they are implemented locally.
- Add tests for parser, manifest, and deterministic indexing changes.

## Verification

Run these before handing off implementation changes:

```bash
npm test
npm run build
```

For GUI changes, also run Vite and smoke the affected public page:

```bash
npm run dev
```
