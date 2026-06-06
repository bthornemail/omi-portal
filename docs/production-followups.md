# Production Follow-Ups

This file tracks bounded production follow-ups that should not be mixed back into
core OMI authority work.

## Isolate A-Frame As Projection-Only Dependency

Status: audited; Option B selected.

Core OMI production posture:

```text
reader -> resolver -> validation/receipt
```

A-Frame posture:

```text
projection-only visualization surface
```

Rule:

```text
A visualization dependency may render accepted state, but it must never
participate in accepting state.
```

Scope:

```text
aframe
three-bmfont-text
nice-color-palettes
got
```

Decision:

A-Frame remains available as a demo/browser visualization surface, but it is
not part of the default core production install or default production Vite
bundle. The default core path omits development dependencies; A-Frame builds
are opt-in through the demo visualization build path.

Goal:

Decide whether A-Frame remains a production dependency, moves to demo-only
visualization, or gets replaced/upgraded through a controlled breaking-change
pass.

Constraint:

Do not alter OMI reader, resolver, validation, eBPF, replay, Docker, or
conformance behavior during this pass.

Acceptance criteria:

- A-Frame is not imported by reader/resolver/validation/replay/kernel code.
- Core tests pass with A-Frame removed or unavailable.
- A-Frame usage is limited to public/demo/browser visualization.
- Dependency audit risk is either upgraded, replaced, or documented as demo-only.
- Production Docker/conformance path does not depend on A-Frame.

Audit result:

- No A-Frame imports exist in `src/omilog`, reader/resolver, validation,
  replay, eBPF, or kernel code.
- The only live A-Frame imports are in `public/aframe.html`.
- The default Vite build excludes `public/aframe.html`; after a full dev
  install, use `OMI_BUILD_AFRAME=1 npm run build` or `npm run build:aframe`
  for the demo visualization bundle.
- Core install and Docker build paths use `--omit=dev`, so the A-Frame
  dependency chain is not required for production authority or conformance.
