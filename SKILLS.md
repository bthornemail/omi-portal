# SKILLS

This file records the repeatable project workflows used in the OMI Portal.

## Documentation Declaration

Use when turning exploratory `dev-docs/` material into canonical framework docs or adding root-layer specs.

1. Root-layer documents live at project root: `POSTULATES.md` (construction), `AXIOMS.md` (fold axioms), `DECLARATIONS.md` (derivation).
2. Add or update curated Markdown in `docs/`.
3. Update `docs/omi-object-model.manifest.json` with stable machine-readable declarations.
4. Update `docs/source-map.md` when a new source document contributes concepts.
5. Add or extend documentation integrity tests.
6. Run `npm test` and `npm run build`.

## OMI Parser Or Index Work

Use when changing `omi-*`, `omi-fano-*`, or `*.omi` token behavior.

1. Keep canonical output deterministic.
2. Accept documented deprecated forms only through explicit compatibility paths.
3. Validate bounds such as RS `0x00..0x3f`, US `0x00..0x7f`, Fano `p1..p7`, slot `0..5040`, and 9-byte synset ids.
4. Add parser rejection tests for malformed inputs.

## OmiPipe Receipt And Vector Work

Use when changing `src/pipe/omi-pipe.c`, OmiPipe receipt formats, transport invariance, MCRSGSP carrier/reconstruction behavior, OMI acceptance, causal proof, RS proof, or GF(256) proof vectors.

1. Prefer Make targets for suites. Use `make test-omi-pipe-network`, `make test-omi-pipe-mcrsgsp`, `make test-omi-pipe-mcrsgsp-reconstruction`, `make test-omi-pipe-omi-acceptance`, `make test-omi-pipe-causal-proof`, `make test-omi-pipe-rs-proof`, and `make test-omi-pipe-gf256-rs-proof` before calling runner scripts directly.
2. Run `make build-omi-pipe` before direct `scripts/pipe/*` vector runs so `bin/omi-pipe` matches the current source.
3. For one-off fixture debugging, use `scripts/pipe/run-stdin-vector.sh <frame-file> <expected-dir>` or the matching network transport runner: `run-busybox-nc-vector.sh`, `run-ncat-vector.sh`, or `run-socat-vector.sh`.
4. For named proof fixtures, call the stdin proof runner with the fixture basename: `run-mcrsgsp-reconstruction-stdin-vector.sh <name>`, `run-omi-acceptance-stdin-vector.sh <name>`, `run-causal-proof-stdin-vector.sh <name>`, `run-rs-proof-stdin-vector.sh <name>`, or `run-gf256-rs-proof-stdin-vector.sh <name>`.
5. Fixture roots live under the matching `test/pipe*/frames/` and `test/pipe*/expected/` directories. Keep receipts deterministic and compare only canonical fields.
6. Use `scripts/pipe/gf256-root.js --k <k> --subset <csv> --frags <idx:hex,...>` to regenerate or inspect GF(256) `candidate-root` values for `rs=gf256` fixtures.
7. `compare-receipt.sh` normalizes transport noise such as `input=` and summary lines. `compare-receipt-merged.sh` is only for transports that merge stdout and stderr, such as `socat EXEC`.
8. Missing optional transports (`nc`, `ncat`, `socat`) may skip individual network vectors; the stdin baselines remain the required deterministic gate.

Per-script rules:

- `scripts/pipe/compare-receipt-merged.sh`: use only when stdout and stderr are intentionally merged; compare combined transport output against expected receipt plus stderr after normalization.
- `scripts/pipe/compare-receipt.sh`: use as the default receipt comparator; it strips transport-only fields and summary lines while preserving canonical accept/reject/repair fields.
- `scripts/pipe/gf256-root.js`: use to compute `candidate-root=0x....` for GF(256) RS proof fixtures; pass `--k`, sorted `--subset`, and `--frags` from the test vector.
- `scripts/pipe/run-busybox-nc-vector.sh`: use to prove a frame is receipt-stable over `nc`; missing `nc` is a skip, not a failure.
- `scripts/pipe/run-causal-proof-stdin-vector.sh`: use with a fixture basename from `test/pipe-causal-proof/frames/` to debug causal-closure acceptance and rejection.
- `scripts/pipe/run-gf256-rs-proof-stdin-vector.sh`: use with a fixture basename from `test/pipe-gf256-rs-proof/frames/` after verifying GF(256) roots with `gf256-root.js`.
- `scripts/pipe/run-mcrsgsp-reconstruction-stdin-vector.sh`: use with a fixture basename from `test/pipe-mcrsgsp-reconstruction/frames/` to debug candidate emission after k-of-n fragments.
- `scripts/pipe/run-mcrsgsp-stdin-vector.sh`: use with `<frame-file> <expected-dir>` for MCRSGSP carrier receipt debugging without network transport.
- `scripts/pipe/run-ncat-vector.sh`: use to prove a frame is receipt-stable over `ncat`; missing `ncat` is a skip, not a failure.
- `scripts/pipe/run-omi-acceptance-stdin-vector.sh`: use with a fixture basename from `test/pipe-omi-acceptance/frames/` to debug promotion from candidate shape to accepted OMI receipt.
- `scripts/pipe/run-rs-proof-stdin-vector.sh`: use with a fixture basename from `test/pipe-rs-proof/frames/` to debug `rs=xor` replay proof behavior.
- `scripts/pipe/run-socat-vector.sh`: use to prove a frame is receipt-stable over `socat`; because `socat EXEC` merges streams, compare with `compare-receipt-merged.sh`.
- `scripts/pipe/run-stdin-vector.sh`: use as the baseline direct-vector runner with `<frame-file> <expected-dir>` before testing optional transports.

## OMI Script Operations Work

Use when running or documenting repository scripts under `scripts/` and `scripts/pipe/`.

1. Prefer Make targets where they exist. Use `make compile-imo`, `make verify-router-seeds`, `make audit-cons-triad-dispatch`, `make release-manifest`, `make qemu-test`, `make smoke`, `make wan-probe`, `make start-telemetry`, and related targets instead of duplicating command sequences by hand.
2. Canonical build and index scripts are `compile-omi.js`, `generate-router-seeds.js`, `audit-cons-triad-dispatch.js`, `oppid-coherence-check.js`, and `generate-release-manifest.js`. Keep generated outputs deterministic; use `node scripts/generate-router-seeds.js --check` or `make verify-router-seeds` before updating vector outputs.
3. CI, container, and release scripts are `ci-test.sh`, `qemu-setup.sh`, `smoke.sh`, `release.sh`, and `omi-release-bake.sh`. Treat them as lifecycle gates that may install/register QEMU handlers, start containers, write release artifacts, commit, tag, or push.
4. Runtime, WAN, and telemetry scripts are `omi-sse-server.js`, `omi-dual-proxy.js`, `wan-sync.js`, `wan-probe.js`, `run-telemetry.sh`, and `omi-cron-frame.sh`. Treat server, probe, cron, and telemetry commands as side-effectful daemons unless explicitly running a read-only probe.
5. Edge, hardware, VM, and scaffold scripts are `create-omi.sh`, `debian-bootstrap.sh`, `deploy.sh`, `esp32-bridge.sh`, `omi-vm-launch.sh`, and `qemu-fabric.scm`. Do not run bootstrap, deploy, VM, FIFO, or hardware bridge scripts casually; confirm target host, privileges, and cleanup path first.
6. Diagnostic scripts are `stress-suite.js`, `stress-parallel.js`, `user-space-test.js`, `tetragrammatron-modem.js`, and `wan-latency-probe.js`. Expect stress, browser, FFmpeg, WAN, or telemetry dependencies depending on the script.
7. Use dry-run modes where available, especially `./scripts/release.sh --dry-run <version>`. Do not run release, deploy, or bootstrap scripts as part of ordinary documentation edits.
8. For documentation-only edits to script guidance, inspect `SKILLS.md` and `git diff -- SKILLS.md`; reserve `make verify-safe`, `npm test`, and `npm run build` for behavior changes or explicit verification requests.

Per-script rules:

- `scripts/audit-cons-triad-dispatch.js`: use through `make audit-cons-triad-dispatch` or with `--require-source-blocks` to verify CONS RRGGBBAA triad lookup discipline.
- `scripts/ci-test.sh`: use for CI lifecycle checks only; it may run dependency install, tests, builds, QEMU, Docker, and smoke behavior depending on mode.
- `scripts/compile-omi.js`: use as `node scripts/compile-omi.js <source.omi> <target.imo>` to lower `.omi` declarations into `.imo` records with canonical Omicron delimiters.
- `scripts/create-omi.sh`: use only when scaffolding a separate OMI workspace; never point it at a directory that already contains a `package.json`.
- `scripts/debian-bootstrap.sh`: use only on an intended Debian host; it changes packages, firewall, nginx, and systemd service state.
- `scripts/deploy.sh`: use only for an intended remote host and directory; it rsyncs the workspace, may run bootstrap, starts the SSE server, and performs remote health checks.
- `scripts/esp32-bridge.sh`: use for hardware byte-stream bridging into a FIFO/SAB mirror; confirm FIFO path and serial source before starting the long-running loop.
- `scripts/generate-release-manifest.js`: use via `make release-manifest` to emit release metadata into `dist/release/manifest.json`; expect it to inspect git, tests, and built artifacts.
- `scripts/generate-router-seeds.js`: use `--check` for drift detection and no flag to rewrite `vectors/*.omi`; follow with router seed tests or `make verify-router-seeds`.
- `scripts/omi-cron-frame.sh`: use from cron or a controlled manual probe to append transient state to `.cron-state/` and signal `/dev/shm/omi-cron-tick`.
- `scripts/omi-dual-proxy.js`: use only when running the dual-stack tunnel proxy service; it binds a public HTTP/SSE endpoint and should be treated as a daemon.
- `scripts/omi-release-bake.sh`: use through release artifact targets to package release outputs; do not run during ordinary docs or parser work.
- `scripts/omi-sse-server.js`: use only when starting the edge SSE proxy server; verify port ownership and COOP/COEP expectations first.
- `scripts/omi-vm-launch.sh`: use to start, stop, restart, or inspect persistent QEMU/libvirt domains; it may invoke `sudo virsh` and Docker Compose.
- `scripts/oppid-coherence-check.js`: use through `make verify-oppid-script` or directly to verify principal generator discipline across canonical `.omi` files.
- `scripts/qemu-fabric.scm`: use as Guix/QEMU fabric reference material for virtualization environments; do not treat it as a normal Node or shell runner.
- `scripts/qemu-setup.sh`: use before multi-architecture Docker/QEMU tests; `--install-qemu` may install host packages and binfmt registration may require privileges.
- `scripts/release.sh`: use `--dry-run` first; non-dry runs update version/changelog, commit, tag, build/push images, push git refs, and may create a GitHub release.
- `scripts/run-telemetry.sh`: use `start|stop|status|restart` to manage the WAN telemetry daemon; check the PID and log file before assuming a new process is needed.
- `scripts/smoke.sh`: use after staging a container to verify health and COOP/COEP headers; it starts and stops Docker Compose services.
- `scripts/stress-parallel.js`: use for Worker/vm/Atomics parallel stress diagnostics; keep it out of lightweight verification unless performance behavior changed.
- `scripts/stress-suite.js`: use for high-concurrency OMI kernel stress diagnostics; expect runtime cost and tune options rather than running by default.
- `scripts/tetragrammatron-modem.js`: use as `node scripts/tetragrammatron-modem.js [file]` or via stdin to compile test output streams into geometry receipts and `.o` words.
- `scripts/user-space-test.js`: use inside the Guix/browser envelope to capture GUI screenshots and FFmpeg SSIM checks; it may create or compare visual baselines.
- `scripts/wan-latency-probe.js`: use as the WAN telemetry probe implementation module; prefer `run-telemetry.sh` for lifecycle management.
- `scripts/wan-probe.js`: use through `make wan-probe` or `make wan-probe-verify` to check IPv4/IPv6 reachability and optional `/verify-packet` behavior.
- `scripts/wan-sync.js`: use with `OMI_NODE_ROLE=edge` or `OMI_NODE_ROLE=tunnel` to run the WAN sync daemon; it exposes health, topology, SSE, and packet verification endpoints.

## DOM/CSSOM GUI Work

Use when changing `public/document.html`.

1. Compile through `compileTextToAnimatedDocument()`.
2. Build registry/index data through exported helpers.
3. Apply OMI metadata as `data-omi-*` attributes.
4. Filter by native dataset and CSS-hidden state.
5. Preserve generated atom markup and animation behavior.

## A-Frame WordNet Work

Use when changing `public/aframe.html`.

1. Keep the scene as the canonical 3D GUI.
2. Query local `vendor/prolog/wn_*.pl` data through the JavaScript Prolog WordNet broker.
3. Render synsets as entities with `data-omi`, `data-omi-service`, operator, synset, centroid, and cell metadata.
4. Keep v1 scoped to a deterministic JS fact broker, not a live Prolog runtime.

## CodeMirror BiDi Work

Use when changing `public/bidi.html` or `src/bidi/`.

1. Treat CM6 transactions as the input stream.
2. Keep BiDi marks and DataView/SAB behavior deterministic.
3. Surface state through DOM attributes so CSSOM can react without replacing the editor.
4. Test pure engine behavior separately from browser-only UI behavior.

## Document Architecture Work

Use when defining or revising the root-layer document stack (POSTULATES → AXIOMS → DECLARATIONS → RULES.omi → FACTS.omi).

1. POSTULATES.md defines *construction permissions* — what may be built (points, lines, surfaces, rules, facts, transitions, masks, proofs, replays, projections, complements).
2. AXIOMS.md defines *fold transformations* — how constructed objects may be reflected, aligned, complemented, resolved (O1–O13 + Ones-Complement Law).
3. DECLARATIONS.md defines *derivation* — how RULES.omi clauses become FACTS.omi rows via a-list transitions, bitboard masks, and bitblip corrections.
4. Every address point must trace through the full chain: construct → rule → fact → fold → declare → test → replay → project.
5. Run `make compile-ebpf-gate && npm test && npm run build` to verify.
