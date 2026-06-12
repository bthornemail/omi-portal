# OMI Portal Cohesion Audit

Date: 2026-06-12

Branch: `omi-doctrine-root-consequences`

HEAD: `60836c9 normalize changelog root spine entry`

Remote: `git@github.com:bthornemail/omi-portal.git`

## Executive Summary

Verdict: partially coherent, leaning cohesive.

The repository is no longer just a pile of related experiments. It has a real root-document spine, a five-root declarative substrate, broad test coverage, live browser surfaces, a working OMI Pipe receipt ladder, and rule/fact grounding for the main protocol machinery. The strongest evidence is that `npm test`, `npm run build`, `make verify-safe`, the pipe RS/GF256 targets, eBPF verification, and release dry-run all passed in this workspace.

The repo is still partially coherent rather than fully coherent because several historical documents still present CIDR as native scope, multiple kernels are test-only implementation islands, Docker/QEMU gates are blocked for this user/environment, and a fixed `/tmp/omi-pipe` build output can race under parallel Make invocations.

Main blockers:

| Status | Area | Evidence | Required action |
| --- | --- | --- | --- |
| BLOCKER | Docker gates | `make docker-build` cannot access `/var/run/docker.sock`; user `main` is not in group `docker`, and passwordless sudo is unavailable. | Run from a docker-authorized shell or add `main` to `docker` group and start a new login session. |
| BLOCKER | QEMU CI gate | `make qemu-test` starts, then `npm ci` fails on GVFS/SFTP symlink creation: `EIO: symlink ... node_modules/.bin/parser`. | Run QEMU CI from a native filesystem checkout, or adjust CI script/npm config for bin links on mounted workspaces. |
| WEAK | Parallel pipe builds | Parallel `make test-omi-pipe*` calls share `/tmp/omi-pipe`; one concurrent baseline showed `exit=126`. Sequential rerun passed. | Use a PID-scoped temp binary in `build-omi-pipe`. |
| WEAK | Doctrine consistency | Root doctrine is current, but older docs still say CIDR is native/scope authority. | Follow-up docs branch to mark old CIDR wording as adapter/historical. |

Publication readiness: code and docs are pushed on the current branch. The audit update itself is not published until this file is committed and pushed.

Final answer: the repository is a cohesive OMI implementation with historical and experimental layers still visible. The core implementation is connected; the cleanup work is traceability and quarantine, not rescue.

## Verified Root Spine

| File | Role | Evidence | Status |
| --- | --- | --- | --- |
| `MANIFESTO.md` | Orientation and why OMI exists. | Linked from `README.md`, `docs/README.md`, source map, and manifest. | CONNECTED |
| `DOCTRINE.md` | Canonical root doctrine: OMI as versioned rewrite register. | Linked from `README.md`, manifest, source map; tested by `research-assimilation.test.js`. | CONNECTED |
| `ONTOLOGY.md` | Entity layer: what OMI objects are. | Present in root spine and manifest. | CONNECTED |
| `POSTULATES.md` | Construction layer. | Root order preserved in `DOCUMENTATION_SURFACES.md`. | CONNECTED |
| `AXIOMS.md` | Folding/transform layer. | Present and linked into declared document ordering. | WEAK |
| `DECLARATIONS.md` | Derivation layer: how rules become facts. | Present and aligns with five-root declarative system. | CONNECTED |
| `RULES.omi` | Normative obligations. | 191 records in OPPID coherence check. | CONNECTED |
| `FACTS.omi` | Grounded implementation facts. | 211 records in OPPID coherence check. | CONNECTED |
| `CLOSURES.omi` | Closure and boundedness declarations. | 7 records in OPPID coherence check. | CONNECTED |
| `COMBINATORS.omi` | Lawful composition operators. | 8 records in OPPID coherence check. | CONNECTED |
| `CONS.omi` | Pairing, lookup, RRGGBBAA monotonic routing. | 15 records in OPPID coherence check; router seed tests pass. | CONNECTED |
| `README.md` | Consumer/provider entrypoint. | Links `OPEN_PORTAL.md`, `REMOTE_TESTING.md`, `MANIFESTO.md`, `DOCTRINE.md`; documents build/test surface. | CONNECTED |
| `CHANGELOG.md` | Release history. | Single heading, top Unreleased root-spine entry. | CONNECTED |
| `DOCUMENTATION_SURFACES.md` | Boundary between `omi-portal` and `o---o`. | Preserves root ordering and surface boundary. | CONNECTED |
| `AGENTS.md` | Repo-specific agent operating rules. | Present at root and matches current doctrine boundaries. | CONNECTED |
| `SKILLS.md` | Skill/operator reference surface. | Present at root. | WEAK |

Root spine issues:

- `DOCTRINE.md` correctly says OMI is not a database and registers transformations.
- `README.md` now correctly says slash denotes relational descent, not CIDR prefix length.
- Older docs still contain native-CIDR framing, especially `docs/omi-whitepaper.md`, `docs/03-network/omi-core-spec.md`, `docs/omi-notation.md`, `docs/agreement-is-all-you-need.md`, and parts of `AXIOMS.md`.
- `MANIFESTO.md` uses database language only to contrast database semantics with OMI, not as authority.

## Code Connectivity Matrix

| Subsystem | Representative files | Rule/doc grounding | Tests/build/runtime | Status |
| --- | --- | --- | --- | --- |
| OMI parser, compiler, reader | `src/omi/omi-parser.js`, `src/omilog/omi-imo-compiler.js`, `src/omilog/reader.js` | `RULES.omi`, `FACTS.omi`, `docs/10-declaration/source-map.md`, `DOCTRINE.md` | `verify-omilog`, `verify-reader`, `npm test`, `compile-imo` | CONNECTED |
| OPPID/generator discipline | `src/omilog/principal-domain.js`, `omi-gcd.js`, `bezout-witness.js`, `cyclic-module.js` | Rules 0x99-0x9C and five-root declaration model | `verify-oppid`, `scripts/oppid-coherence-check.js` | CONNECTED |
| Router seeds and triad dispatch | `src/omilog/router-seeds.js`, `triad-dispatch.js`, `triad-router155.js` | `CONS.omi`, `RULES.omi` 0xCF/0xD2, manifest | `verify-router-seeds`, `audit-cons-triad-dispatch` | CONNECTED |
| OMI Pipe receipt ladder | `src/pipe/omi-pipe.c`, `scripts/pipe/run-*.sh` | Pipe docs, MCRSGSP docs, rewrite-register doctrine | `test-omi-pipe*`, RS/GF256 fixtures | CONNECTED |
| Browser object model | `src/index.js`, `src/document/animated-document.js`, `src/web/dom-cssom-*` | `docs/omi-object-model.md`, `docs/08-surface/INDEX.md`, manifest | `animated-document`, `dom-cssom-registry`, `gui-integration`, Vite | CONNECTED |
| Runtime/browser pages | `index.html`, `public/portal.html`, `public/document.html`, `public/bidi.html`, `public/aframe.html` | `OPEN_PORTAL.md`, `REMOTE_TESTING.md`, surface docs | Vite build, GUI tests, smoke docs | CONNECTED |
| Distributed stack | `src/distributed/*.js` | Manifest and `docs/omi-pipe-mcrsgsp-*` | distributed tests, semantic-memory broker tests | CONNECTED |
| WAN/live portal | `src/wan/*.js`, `scripts/wan-sync.js` | RULES 0xA0-0xA2, WAN docs/tests | `verify-wan`, `verify-portal-binder`, WAN tests | CONNECTED |
| Narrative/world model | `src/narrative/*.js`, `src/world/*.js` | RULES 0xA3-0xA7 and 0xAA-0xAB | `verify-narrative`, `verify-slice3`, triple centroid tests | CONNECTED |
| Canvas/color/address schema | `src/canvas/*`, RRGGBBAA routers | Rules 0xC0-0xCF, `CONS.omi`, JSON Canvas docs | JSON Canvas, RRGGBBAA, Miquel, color-router tests | CONNECTED |
| Legacy CIDR/Omicron kernels | `src/omi/omicron-kernel.js`, `src/addressing/cidr.js` | Historical adapter compatibility and docs | CIDR parser tests, pure IPv6 tests | DEPRECATED-COMPAT |
| Math/protocol kernels | many `src/omi/*-kernel.js` files | Usually grounded by `RULES.omi`/`FACTS.omi` and research assimilation tests | Mostly direct one-file tests | WEAK |
| eBPF gate | `src/ebpf/ebpf-pipeline.bpf.c`, `src/omi/ebpf/delta_orbital_gate.bpf.c` | Physical layer docs and eBPF tests | `make verify-ebpf` | CONNECTED |
| Release/container tooling | `Dockerfile`, `docker-bake.hcl`, `.github/workflows/*`, `scripts/release.sh` | CHANGELOG/release docs | release dry-run passes; Docker local blocked | WEAK |

Inventory evidence:

- `src/`: 160 source files inspected by read-only inventory.
- `scripts/`: 39 files, including 13 pipe helpers.
- `public/`: 10 files.
- `test/`: 151 `*.test.js` files.
- `npm test`: 1,559 tests passing.

## Orphan Candidates

No source file is confirmed dead. The following are candidates because the audit could not find strong import/runtime linkage; do not delete without owner review.

| File | Why suspected | Evidence | Recommended action |
| --- | --- | --- | --- |
| `scripts/create-omi.sh` | Scaffolding script not referenced by Make/package/tests. | Static reference scan found no active caller. | Mark as developer utility or add Make help entry. |
| `scripts/debian-bootstrap.sh` | Deployment bootstrap not referenced by current Make/CI. | Mentioned historically, not in active gates. | Move under deployment docs or mark reference-only. |
| `scripts/deploy.sh` | Deployment helper not active in current CI. | No Make/package caller found. | Mark manual deployment utility. |
| `scripts/esp32-bridge.sh` | Hardware bridge not active in tests. | No active caller found. | Document as hardware-only reference or add smoke check. |
| `scripts/omi-cron-frame.sh` | Cron helper not tied to current gates. | No active caller found. | Add docs link or quarantine. |
| `scripts/omi-dual-proxy.js` | WAN proxy helper appears manually operated. | No current Make/package caller; WAN tests cover other modules. | Document manual runtime path. |
| `scripts/omi-sse-server.js` | SSE server helper appears manually operated. | No current Make/package caller. | Link from WAN docs or mark dev-only. |
| `scripts/omi-vm-launch.sh` | VM launcher not active in CI. | No active caller found. | Document with QEMU/SoftMMU docs. |
| `scripts/qemu-fabric.scm` | Guix/QEMU fabric reference. | Not called by current gates. | Mark reference-only unless used by operators. |
| `scripts/wan-latency-probe.js` | Tested indirectly, but not in active Make default. | Has direct test import; not orphan, but operational path weak. | Add Make/help link if still operator-facing. |
| `scripts/pipe/compare-receipt.sh` | Helper not directly referenced by Make. | Pipe runner scripts may supersede it. | Keep if used manually; otherwise fold into runner docs. |
| `scripts/pipe/compare-receipt-merged.sh` | Helper not directly referenced by Make. | No active caller found. | Same as above. |
| `scripts/pipe/gf256-root.js` | Generation helper likely fixture tool. | Not invoked by Make; fixture outputs are checked by pipe tests. | Document fixture-generation path. |
| `src/ebpf/ebpf-pipeline.bpf.c` | Static JS import scan shows zero imports. | Actually built by `compile-ebpf-gate`. | Not orphan; classify CONNECTED by Make. |
| `src/omi/ebpf/delta_orbital_gate.bpf.c` | Static JS import scan shows zero imports. | Actually built by `compile-ebpf-gate`. | Not orphan; classify CONNECTED by Make. |

## Weak Connections

| Area | Evidence | Risk | Recommended action |
| --- | --- | --- | --- |
| Historical CIDR docs | `docs/omi-whitepaper.md` says "Addressing Is Scoped by CIDR"; `docs/03-network/omi-core-spec.md` still defines "OMI-CIDR Address Grammar". | New readers may treat CIDR as native identity instead of adapter compatibility. | Add historical/adapter warning banners or rewrite in a docs-only branch. |
| Math kernel islands | Many `src/omi/*-kernel.js` files are referenced only by their direct tests. | They are tested but not always connected to a runtime surface or Make target. | Add a generated traceability table mapping each kernel to rule/fact/docs/runtime. |
| `SKILLS.md` | Present in root spine but weakly connected in docs/tests. | Role is unclear relative to AGENTS and plugin skills. | Define whether this is canonical operator docs or developer reference. |
| Docker local gates | CI workflow uses GitHub actions to set up Docker; local Make assumes Docker socket access. | Local release confidence varies by user shell. | Add preflight that clearly reports docker group/socket status. |
| QEMU local gate | `scripts/ci-test.sh qemu` runs `npm ci`, which fails on GVFS/SFTP symlinks. | Mounted workspaces cannot complete local QEMU gate. | Use native checkout for QEMU, or set a documented npm bin-link workaround. |
| `build-omi-pipe` temp path | Links to `/tmp/omi-pipe` before copying into `bin/omi-pipe`. | Parallel builds can race. | Use `/tmp/omi-pipe-$$` or `mktemp`. |

## Duplicate / Conflicting Concepts

| Concept | Current state | Classification |
| --- | --- | --- |
| Database/store wording | Root doctrine uses database language as contrast. Older audit text had "OMI stores transformations"; current doctrine uses "registers transformations". | CONNECTED in doctrine; stale references should be avoided. |
| CIDR native vs adapter | README and native gauge canon say slash path is not CIDR; older whitepaper/core spec/notation still present CIDR as scope grammar. | WEAK |
| `0x03BF` / `0x039F` | Grounded in `RULES.omi`, `delta-orbital-lexer`, compiler tests, multiplex tests, and C/eBPF checks. | CONNECTED |
| `0x5A3C` | Grounded in Delta Law tests, COMBINATORS, RULES, and WASM/C99 equivalence. | CONNECTED |
| `0x11d` | GF256 proof uses primitive polynomial and rejects unsupported poly. | CONNECTED |
| `240`, `720`, `5040` | Repeated across rules, docs, tests, portal projection, and ring memory docs. | CONNECTED |
| RRGGBBAA | Grounded in `RULES.omi`, `FACTS.omi`, `CONS.omi`, JSON Canvas schema, orbit tests, router seeds. | CONNECTED |
| Base36 | Explicitly projection-only in rules/closures/tests; does not authorize frame validity. | CONNECTED |
| `bin/omi-pipe` tracked binary | Built by Make and copied from `/tmp`; remains tracked. | WEAK |

## Build and Script Graph

| Command/surface | Calls | Result in this audit | Status |
| --- | --- | --- | --- |
| `npm test` | `node --test test/*.test.js` | PASS, 1,559 tests. | CONNECTED |
| `npm run build` | Vite build, HTML hoist plugin | PASS, 162 modules transformed; large `document` chunk warning. | CONNECTED |
| `make verify-safe` | Docs, compiler, router seeds, reader, OPPID, WAN, narrative, browser, pipe ladders | PASS. | CONNECTED |
| `make test-omi-pipe` | Builds C pipe and runs baseline vectors | PASS sequential; parallel anomaly observed. | WEAK |
| `make test-omi-pipe-rs-proof` | RS proof fixtures | PASS. | CONNECTED |
| `make test-omi-pipe-gf256-rs-proof` | GF256 RS proof fixtures | PASS. | CONNECTED |
| `make verify-ebpf` | Clang BPF build plus Node verifier tests | PASS; `bpftool` load unavailable but target handles fallback. | CONNECTED |
| `make docker-build` | Docker buildx bake | FAIL environment-blocked: no Docker socket permission. | BLOCKER |
| `make qemu-test` | QEMU setup, `scripts/ci-test.sh qemu` | FAIL environment-blocked: `npm ci` symlink EIO on GVFS/SFTP mount. | BLOCKER |
| `make release-dry-run patch` | `scripts/release.sh --dry-run patch` | PASS, reports `v0.2.1`, no changes. | CONNECTED |

Generated files:

- `vectors/*.omi` and `vectors/*.imo` are generated by `compile-router-seeds`; drift checked by `verify-router-seeds`.
- `dist/` is build output and gitignored.
- `artifacts/ebpf/*.o` are generated by eBPF gates and not part of source authority.
- `bin/omi-pipe` is a tracked build artifact; this is intentional history but weak from source-only packaging perspective.

CI/local alignment:

- GitHub CI uses `actions/setup-node`, `docker/setup-qemu-action`, and `docker/setup-buildx-action`; local Make expects equivalent Docker permissions and binfmt support.
- Local `make qemu-test` calls `npm ci --ignore-scripts --omit=dev` inside `scripts/ci-test.sh`, which is not safe on this GVFS/SFTP checkout due symlink creation.

## Runtime Surface Map

| Surface | Link path | Runtime role | Evidence | Status |
| --- | --- | --- | --- | --- |
| `/` / `index.html` | `OPEN_PORTAL.md`, `REMOTE_TESTING.md`, Vite main input | Object Inbox/root portal entry. | Built by Vite; GUI tests inspect navigation. | CONNECTED |
| `/portal.html` | `OPEN_PORTAL.md`, `REMOTE_TESTING.md`, `README.md` | Interactive portal, bitblip grid, live voxel state. | Built by Vite; research tests inspect constants. | CONNECTED |
| `/document.html` | `OPEN_PORTAL.md`, nav links | DOM/CSSOM inspector. | Built by Vite; animated/document tests cover helpers. | CONNECTED |
| `/bidi.html` | `OPEN_PORTAL.md`, `REMOTE_TESTING.md`, package scripts | BiDi/CodeMirror projection surface. | Built by Vite; CSSOM/pure IPv6/gui tests. | CONNECTED |
| `/aframe.html` | `OPEN_PORTAL.md` marks demo-only | 3D WordNet/A-Frame visualization. | Excluded from default build unless `OMI_BUILD_AFRAME=1`; tests verify demo boundary. | DEMO-ONLY |
| `public/sw-router.js` | Browser custom protocol proxy tests | Service worker protocol projection helper. | `sw-proxy.test.js`. | CONNECTED |
| `public/wan-dashboard.html` | WAN telemetry surface. | Runtime/manual dashboard. | WAN tests cover telemetry modules, not page rendering. | WEAK |

Runtime consistency:

- `README.md`, `OPEN_PORTAL.md`, and `REMOTE_TESTING.md` make `/`, `/portal.html`, `/document.html`, and `/bidi.html` discoverable.
- A-Frame is correctly quarantined as demo-only in remote testing docs and default build behavior.
- DOM/CSSOM selector and `data-omi-*` paths are covered by `public/bidi.html`, `public/bidi.css`, `public/document.html`, `src/web/dom-cssom-registry.js`, and GUI/pure IPv6 tests.

## Test Meaning Map

| Test family | Implementation under test | Invariant proved | Does not prove |
| --- | --- | --- | --- |
| `docs-manifest`, `research-assimilation` | Root docs, manifest, rules/facts/docs promotion | Canonical claims are promoted outside `_temp`; doctrine boundary is explicit. | Full doc wording consistency across older whitepapers. |
| `omilog-*`, `base36-*`, `multiplex` | Parser/compiler/native `.imo` lowering | Five roots compile, native char plane safe, Omicron delimiters preserved. | Semantic completeness of every rule. |
| `principal-domain`, `omi-gcd`, `bezout`, `cyclic` | OPPID generator discipline | Principal generator, shared closures, replay components. | Large-scale graph performance. |
| `router-seeds`, `triad-dispatch` | CONS/RRGGBBAA lookup and triad routing | Monotonic lookup, no sixth root, generated seed drift checks. | Runtime UI display of every generated seed. |
| Pipe fixture targets | `src/pipe/omi-pipe.c` and shell runners | Receipt ladder, causal proof, RS/GF256 proof replay, malformed proof rejection. | Network transport variants not included in `verify-safe`; full RS payload reconstruction. |
| Distributed tests | gossip, erasure, anti-entropy, fragment store, HNSW, WebRTC, CoTURN | Core distributed algorithms run locally. | Real network deployment reliability. |
| Browser/GUI tests | `public/bidi.*`, Vite, portal/document links | Selector purity, HTML hoisting, public page discoverability. | Pixel-perfect browser rendering. |
| WAN/live tests | NAT64 adapter, proxy connector, voxel stream, binder, telemetry | Reader-to-projection event path. | Public internet tunnel behavior. |
| Narrative/world tests | world state, narrative pipeline, clocks, gates | Open-world state and interaction lifecycle. | Full product UX. |
| eBPF/WASM/C99 tests | BPF objects, C99 equivalence, WASM loader | Cross-language kernel agreement. | Kernel load with live bpftool in this user session. |

Coverage gaps:

- No dedicated test for malformed `candidate-root` syntax in current branch.
- No explicit test for unsupported RS mode with otherwise valid fragments.
- GF256 `subset_count > k` accepts extra roots but does not cross-check every k-combination on this branch.
- Many math kernels are direct-test only; traceability to runtime surfaces is weak.

## Required Fixes

1. Fix local Docker authority for the operator account or document that Docker gates must run from a docker-authorized shell.
2. Fix `make qemu-test` for GVFS/SFTP workspaces or document native-filesystem requirement.
3. Make `build-omi-pipe` use a unique temporary binary path.
4. Add doctrine consistency banners or rewrites for older CIDR-native docs.
5. Add pipe hardening fixtures for malformed candidate-root, unsupported RS mode, duplicate GF256 fragment index, and explicit basis mismatch.

## Recommended Follow-Up Branches

| Branch | Purpose |
| --- | --- |
| `omi-audit-cidr-doc-alignment` | Mark older CIDR-native docs as historical/adapter or rewrite them under the new doctrine. |
| `omi-pipe-parallel-build-safe` | Replace `/tmp/omi-pipe` with a PID-scoped or `mktemp` path. |
| `omi-pipe-proof-hardening-fixtures` | Add malformed-root, unsupported RS mode, duplicate fragment index, and explicit basis mismatch fixtures. |
| `omi-runtime-surface-traceability` | Generate or maintain a source-to-rule-to-test-to-surface matrix. |
| `omi-local-docker-preflight` | Add Make preflight for Docker socket, Buildx builder, QEMU binfmt, and mounted-workspace npm symlink behavior. |

## Do Not Touch Yet

| Path/area | Why |
| --- | --- |
| `dev-docs/_temp/` | Research inbox; tests assert drafts are not canonical until promoted. |
| `demos/` or demo-like historical surfaces | AGENTS says demos are reference-only snapshots unless a root artifact is missing. |
| `public/aframe.html` | Demo-only but intentionally present and linked for local dev. |
| `docs/omi-whitepaper.md`, `docs/03-network/omi-core-spec.md`, `docs/omi-notation.md` | Stale CIDR wording exists, but these need a docs-specific alignment pass, not opportunistic edits during audit. |
| `src/omi/omicron-kernel.js` and CIDR parser tests | Deprecated compatibility path remains necessary for historical adapter compatibility. |
| `bin/omi-pipe` | Tracked artifact by current repo convention; source-only policy should be separate. |
| `chat.history.html` | Explicitly protected by AGENTS. |
| `session-ses_1495.md` | Pre-existing local deletion unrelated to this audit. |

## Audit Conclusion

The repo is a cohesive OMI implementation with a broad experimental perimeter. Its core path is now clear:

```text
root doctrine
-> ontology/postulates/axioms/declarations
-> RULES.omi / FACTS.omi / CLOSURES.omi / COMBINATORS.omi / CONS.omi
-> implementation modules
-> tests and Make targets
-> browser projection or pipe receipt
```

The strongest connected path is parser/compiler/reader -> OPPID -> router seeds -> pipe receipts -> browser projection. The weakest areas are older CIDR-era documents, local Docker/QEMU environment reproducibility, and source files that are tested but not visibly connected to a runtime surface.

Answer: it is not merely a pile of related experiments. It is a cohesive implementation whose historical layers need traceability cleanup and doctrine-aligned labeling.
