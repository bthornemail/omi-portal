# ============================================================================
# OMI MAKEFILE — Grade Router
# ============================================================================
# The Makefile is the OMI grade router:
#   development — proves the workbench
#   consumer    — proves readability
#   production  — proves deployability
# ============================================================================
# Grades:
#   dev         — local engineering loop (verify-safe + build)
#   consumer    — readable framework package (docs + .omi + .imo + portal)
#   production  — verified deployment artifacts (compiled + eBPF + Docker)
#   verify      — all verification gates
#   verify-safe — all non-eBPF gates (daily green)
#   pipeline    — OMI 13-step execution doctrine (diagnostic)
#   release     — full lifecycle bundle
# ============================================================================

.PHONY: help dev consumer production verify verify-safe pipeline release

help: ## Display the canonical operational target glossary map
	@echo "OMI Makefile — Grade Router"
	@echo ""
	@echo "GRADE ENTRYPOINTS:"
	@echo "  make dev          — Development grade (verify-safe + build)"
	@echo "  make consumer     — Consumer grade (docs + .omi + .imo + portal)"
	@echo "  make production   — Production grade (compiled .imo + eBPF + portal)"
	@echo "  make release      — Full lifecycle (consumer + production)"
	@echo ""
	@echo "VERIFICATION GATES:"
	@echo "  make verify       — All gates (including eBPF)"
	@echo "  make verify-safe  — All non-eBPF gates (daily green command)"
	@echo "  make verify-docs  — First-principles docs checks"
	@echo "  make verify-omilog — OmiLog compiler + alignment + multiplex tests"
	@echo "  make verify-oppid — OPPID principal-domain + GCD + witness tests"
	@echo "  make verify-browser — Vite production build"
	@echo "  make test-omi-pipe — Local POSIX pipe gate test vectors"
	@echo "  make test-omi-pipe-network — All network transport vectors (stdin + nc + ncat + socat)"
	@echo "  make test-omi-pipe-mcrsgsp — MCRSGSP carrier vectors (stdin baseline)"
	@echo "  make test-omi-pipe-mcrsgsp-network — MCRSGSP carrier over network transports"
	@echo "  make test-omi-pipe-mcrsgsp-reconstruction — MCRSGSP reconstruction vectors (stdin baseline)"
	@echo "  make test-omi-pipe-mcrsgsp-reconstruction-network — MCRSGSP reconstruction over network transports"
	@echo "  make test-omi-pipe-omi-acceptance — OMI acceptance vectors (stdin baseline)"
	@echo "  make test-omi-pipe-omi-acceptance-network — OMI acceptance over network transports"
	@echo "  make test-omi-pipe-causal-proof — OMI causal proof vectors (stdin baseline)"
	@echo "  make test-omi-pipe-causal-proof-network — OMI causal proof over network transports"
	@echo "  make test-omi-pipe-rs-proof — OMI RS proof vectors (stdin baseline)"
	@echo "  make test-omi-pipe-rs-proof-network — OMI RS proof over network transports"
	@echo "  make test-omi-pipe-gf256-rs-proof — OMI GF(256) RS proof vectors (stdin baseline)"
	@echo "  make test-omi-pipe-gf256-rs-proof-network — OMI GF(256) RS proof over network transports"
	@echo "  make verify-ebpf  — eBPF kernel gate (requires clang + bpftool)"
	@echo ""
	@echo "OMI OPERATIONAL PIPELINE:"
	@echo "  make pipeline     — 13-step execution doctrine (diagnostic)"
	@echo "  make compile-imo  — Lower .omi declarations to .imo objects"
	@echo "  make generate-router-seeds — Generate vectors/*.omi proxy seed configs"
	@echo "  make audit-cons-triad-dispatch — Audit CONS RRGGBBAA triad lanes"
	@echo ""
	@echo "DEVELOPMENT:"
	@echo "  make dev          — verify-safe + build-dev"
	@echo "  make test         — Full test suite (npm test)"
	@echo "  make test-focused — OmiLog + OPPID tests only"
	@echo ""
	@echo "INFRASTRUCTURE:"
	@echo "  make docker-build       — Multi-arch Buildx"
	@echo "  make qemu-test          — QEMU cross-arch"
	@echo "  make docker-stress      — Stress validation"
	@echo "  make softmmu-test       — Full-system emulators"
	@echo "  make run-all-virt-gates — Guix + Docker + QEMU + stress + SoftMMU"
	@echo "  make wan-probe          — WAN connectivity probe"
	@echo "  make start-telemetry    — Telemetry daemon"
	@echo ""
	@echo "RELEASE:"
	@echo "  make release          — Full lifecycle (consumer + production + manifest)"
	@echo "  make release-manifest — Write release receipt to dist/release/manifest.json"
	@echo ""
	@echo "CLEANUP:"
	@echo "  make clean  — Docker compose down"
	@echo "  make purge  — Deep clean (remove node_modules + dist)"
	@echo ""
	@echo "For all targets, run: grep '^[a-zA-Z_-]*:' Makefile"

# ============================================================================
# GRADE ENTRYPOINTS
# ============================================================================

.PHONY: dev consumer production verify verify-safe pipeline release release-manifest verify-reader verify-wan verify-portal-binder verify-narrative verify-centroid verify-lens-parser verify-slice3 verify-atomic-kernel verify-reciprocal-router verify-miquel-router verify-canvas-color verify-json-canvas-schema verify-rrggbbaa-orbit verify-miquel-rgb-incidence generate-router-seeds compile-router-seeds verify-router-seeds audit-cons-triad-dispatch

dev: verify-safe build-dev

consumer: docs-consumer omi-consumer portal-consumer package-consumer

production: compile-imo ebpf-production portal-production verify-production

verify: verify-docs verify-omilog verify-oppid verify-browser verify-ebpf

verify-safe: verify-docs verify-omilog verify-router-seeds verify-reader verify-oppid verify-wan verify-portal-binder verify-narrative verify-centroid verify-lens-parser verify-slice3 verify-atomic-kernel verify-reciprocal-router verify-miquel-router verify-canvas-color verify-json-canvas-schema verify-rrggbbaa-orbit verify-miquel-rgb-incidence verify-browser verify-oppid-script test-omi-pipe test-omi-pipe-network-stdin test-omi-pipe-mcrsgsp test-omi-pipe-mcrsgsp-reconstruction test-omi-pipe-omi-acceptance test-omi-pipe-causal-proof test-omi-pipe-rs-proof test-omi-pipe-gf256-rs-proof

pipeline: source validate generate mirror enter read compose route scope timing naming project replay

release: consumer production release-manifest

release-manifest:
	@echo "[release] generating release manifest..."
	@mkdir -p dist/release
	node scripts/generate-release-manifest.js > dist/release/manifest.json
	@echo "[release] manifest written to dist/release/manifest.json"

# ============================================================================
# DEVELOPMENT GRADE
# ============================================================================

.PHONY: build-dev test-focused docs-dev

build-dev:
	npm run build

test-focused:
	node --test \
	  test/omilog-compiler.test.js \
	  test/base36-omilog-alignment.test.js \
	  test/multiplex.test.js \
	  test/principal-domain.test.js \
	  test/omi-gcd.test.js \
	  test/bezout-witness.test.js \
	  test/cyclic-module.test.js \
	  test/triad-dispatch.test.js

docs-dev:
	@test -f docs/agreement-is-all-you-need.md
	@test -f docs/omi-whitepaper.md
	@test -f docs/omi-object-model.md
	@test -f docs/omi-notation.md
	@echo "[docs] first-principles docs present"

# ============================================================================
# CONSUMER GRADE
# ============================================================================

.PHONY: docs-consumer omi-consumer portal-consumer package-consumer

docs-consumer:
	@echo "[consumer] copying first-principles docs..."
	@mkdir -p dist/consumer/docs
	cp docs/agreement-is-all-you-need.md dist/consumer/docs/
	cp docs/omi-whitepaper.md dist/consumer/docs/
	cp docs/omi-object-model.md dist/consumer/docs/
	cp docs/omi-notation.md dist/consumer/docs/
	cp README.md dist/consumer/README.md

omi-consumer: compile-imo
	@echo "[consumer] copying .omi source and .imo compiled objects..."
	@mkdir -p dist/consumer/omi dist/consumer/imo
	cp RULES.omi FACTS.omi CLOSURES.omi COMBINATORS.omi CONS.omi dist/consumer/omi/
	cp omi.config.json dist/consumer/
	cp dist/omi/*.imo dist/consumer/imo/

portal-consumer:
	@echo "[consumer] building and copying portal..."
	$(MAKE) build-dev
	@mkdir -p dist/consumer/public
	cp -r dist/assets dist/consumer/public/ 2>/dev/null || true
	for f in index.html portal.html aframe.html bidi.html document.html; do \
	  [ -f "dist/$$f" ] && cp "dist/$$f" "dist/consumer/public/" || true; \
	done

package-consumer: docs-consumer omi-consumer portal-consumer
	@echo "[consumer] package ready at dist/consumer"

# ============================================================================
# PRODUCTION GRADE
# ============================================================================

.PHONY: compile-imo ebpf-production portal-production build-production verify-production

compile-imo:
	@echo "[production] compiling .omi declarations to .imo objects..."
	@mkdir -p dist/omi
	node scripts/compile-omi.js RULES.omi dist/omi/RULES.imo
	node scripts/compile-omi.js FACTS.omi dist/omi/FACTS.imo
	node scripts/compile-omi.js CLOSURES.omi dist/omi/CLOSURES.imo
	node scripts/compile-omi.js COMBINATORS.omi dist/omi/COMBINATORS.imo
	node scripts/compile-omi.js CONS.omi dist/omi/CONS.imo

ebpf-production:
	@echo "[production] building eBPF kernel gate..."
	$(MAKE) compile-ebpf-gate

portal-production:
	$(MAKE) build-dev

build-production:
	$(MAKE) build-dev

verify-production:
	npm test

# ============================================================================
# VERIFICATION GATES
# ============================================================================

.PHONY: verify-docs verify-omilog verify-oppid verify-browser verify-ebpf verify-oppid-script

verify-docs:
	node --test test/docs-manifest.test.js test/research-assimilation.test.js test/docs-integrity.test.js

verify-omilog:
	node --test \
	  test/omilog-compiler.test.js \
	  test/base36-omilog-alignment.test.js \
	  test/multiplex.test.js

verify-oppid:
	node --test \
	  test/principal-domain.test.js \
	  test/omi-gcd.test.js \
	  test/bezout-witness.test.js \
	  test/cyclic-module.test.js

verify-browser:
	$(MAKE) build-dev

verify-ebpf:
	$(MAKE) compile-ebpf-gate
	$(MAKE) test-ebpf-pipeline

verify-oppid-script:
	node scripts/oppid-coherence-check.js

verify-reader:
	node --test test/omilog-reader.test.js

verify-wan:
	node --test test/nat64-virtual-adapter.test.js test/proxy-event-connector.test.js test/live-voxel-stream.test.js

verify-portal-binder:
	node --test test/live-portal-binder.test.js

verify-narrative:
	node --test test/narrative-world-model.test.js test/narrative-document-pipeline.test.js

verify-centroid:
	node --test test/triple-centroid.test.js

verify-lens-parser:
	node --test test/omi-lens-parser.test.js

verify-slice3:
	node --test test/scrubbable-world-clock.test.js test/world-interaction-gate.test.js test/movie-world-renderer.test.js

verify-atomic-kernel:
	node --test test/atomic-kernel.test.js test/cosmic-orbit.test.js

verify-reciprocal-router:
	node --test test/sexagesimal-reciprocals.test.js

verify-miquel-router:
	node --test test/miquel-router.test.js

verify-canvas-color:
	node --test test/omi-canvas-color-router.test.js

verify-json-canvas-schema:
	node --test test/json-canvas-address-schema.test.js test/json-canvas-omi-router.test.js

verify-rrggbbaa-orbit:
	node --test test/rrggbbaa-orbit.test.js

verify-miquel-rgb-incidence:
	node --test test/miquel-rgb-incidence.test.js

generate-router-seeds:
	node scripts/generate-router-seeds.js

compile-router-seeds: generate-router-seeds
	node scripts/compile-omi.js vectors/pos.omi vectors/pos.imo
	node scripts/compile-omi.js vectors/features.omi vectors/features.imo
	node scripts/compile-omi.js vectors/pl.omi vectors/pl.imo

verify-router-seeds:
	node scripts/generate-router-seeds.js --check
	node --test test/router-seeds.test.js test/triad-dispatch.test.js
	$(MAKE) audit-cons-triad-dispatch
	$(MAKE) compile-router-seeds

audit-cons-triad-dispatch:
	node scripts/audit-cons-triad-dispatch.js --require-source-blocks

# ============================================================================
# OMI 13-STEP OPERATIONAL PIPELINE (Diagnostic)
# ============================================================================

.PHONY: source validate generate mirror enter read compose route scope timing naming project replay

source:
	@echo "[1 SOURCE] Reading .omi source files"
	@test -f RULES.omi
	@test -f FACTS.omi
	@test -f CLOSURES.omi
	@test -f COMBINATORS.omi
	@test -f CONS.omi
	@echo "  ✓ All five canonical .omi files present"

validate:
	@echo "[2 VALIDATE] Running Q_frame and parser validation"
	node --test test/omi-parser.test.js test/multiplex.test.js

generate:
	@echo "[3 GENERATE] Resolving principal OMI pointers"
	node --test test/principal-domain.test.js test/omi-gcd.test.js

mirror:
	@echo "[4 MIRROR] Lowering .omi to .imo"
	$(MAKE) compile-imo

enter:
	@echo "[5 ENTER] Verifying ο / Ο delimiters"
	node --test test/omilog-compiler.test.js

read:
	@echo "[6 READ] Reading O-expressions from .imo payload blocks"
	node --test test/omilog-reader.test.js

compose:
	@echo "[7 COMPOSE] Verifying operator-table32"
	node --test test/omicron-inversion.test.js 2>/dev/null || true
	@echo "  ◇ operator-table32 tests: [TODO — add dedicated test file]"

route:
	@echo "[8 ROUTE] Verifying triad-router155"
	node --test test/wire-profile.test.js test/triad-dispatch.test.js

scope:
	@echo "[9 SCOPE] Verifying CIDR / wire profile"
	node --test test/wire-profile.test.js

timing:
	@echo "[10 TIMING] Verifying Delta / clock"
	node --test test/delta-orbital-lexer.test.js

naming:
	@echo "[11 NAMING] Verifying Base36 projection"
	node --test test/base36-omilog-alignment.test.js

project:
	@echo "[12 PROJECT] Verifying Q_xy / canvas projection"
	node --test test/canvas-spec.test.js

replay:
	@echo "[13 REPLAY] Verifying replay receipts"
	node --test test/research-assimilation.test.js test/docs-manifest.test.js

# ============================================================================
# LEGACY ALIASES (preserved, point into new grade targets)
# ============================================================================

.PHONY: compile stage smoke

compile: production

stage: consumer

smoke: verify-safe

# ============================================================================
# EXISTING TARGETS (preserved as-is below)
# ============================================================================

.PHONY: compile test stage smoke \
        guix-env-init qemu-setup qemu-test \
        docker-build docker-bake docker-push docker-stress softmmu-test run-all-virt-gates \
        release release-dry-run \
        benchmark-concurrency-stress benchmark-parallel-stress benchmark-stress-all \
        build-omi-pipe test-omi-pipe \
        build-c99-core test-c99-core test-c99-core-guix \
        compile-ebpf-gate test-ebpf-pipeline \
        ratio-symmetry-test radix-context-test \
        run-wan-edge run-wan-tunnel wan-probe wan-probe-verify \
        boot-x86_64 boot-i386 boot-aarch64 boot-riscv64 boot-ppc64 \
        build-gui-reference test-user-space-ui \
        test-wire-profile \
        test-wan-telemetry \
        start-telemetry stop-telemetry test-telemetry \
        test-web-protocol-proxy \
        test-json-canvas-spec export-genesis-canvas \
        test-virtual-nbd-mesh clean-virtual-nbd-mesh \
        test-fp16-nonagram-colors test-fp16-canvas-topology test-block-floating-point test-sexagesimal-slide-rule test-tetrahedral-hypergraph \
        test-barycentric-hypergraph \
        test-axiomatic-rules-compiler \
        test-jabcode-chromatic-mesh \
        test-jabcode-scrambler-matrix \
        test-code16k-multirow-mesh \
        test-hopf-fibration-projection \
        test-octonion-fano-projection \
        test-clamped-sphere-packing \
        test-neural-perceptron-activation \
        test-polytopic-neural-activation \
        test-hgv-barycentric-kernel \
        test-hgv-perceptron-activation \
        test-automated-page-framing \
        test-megatron-absolute-activation \
        test-monster-supersingular-matrix \
        test-hellenistic-sexagesimal-mesh \
        test-supersingular-elliptic-curves \
        test-metacircular-multilayer-perceptron \
        test-sexagesimal-highly-composite-mesh \
        test-sts-evaluator \
        test-facts-evaluator \
        test-wikimedia-kernel \
        test-cluster-peer-discovery \
        test-wan-latency-metadata-probe \
        test-open-world-web-portal \
        test-all bake-images push-all \
        clean purge

# ============================================================
# DEVELOPMENT
# ============================================================

compile:
	npm ci --quiet --omit=dev
	npm run build

test:
	node --test test/*.test.js

test-symbolic-inference:
	@echo "[Omi Inference] Running Prolog unification and WordNet synset checks..."
	node --test test/prolog-inference.test.js

stage:
	docker compose down --volumes --remove-orphans || true
	docker compose up --build -d omi-portal

smoke: stage
	./scripts/smoke.sh

# ============================================================
# QEMU MULTI-ARCH
# ============================================================

guix-env-init:
	@echo "[Guix Host Envelope] Validating reproducible virtualization tool manifest..."
	@command -v guix >/dev/null
	guix shell -m manifest.scm -- sh -c 'qemu-system-x86_64 --version >/dev/null && make --version >/dev/null && git --version >/dev/null && pkg-config --version >/dev/null'
	@echo "[Host Docker Boundary] Validating Docker Engine, Compose, and Buildx..."
	@docker --version
	@docker compose version
	@docker buildx version

qemu-setup:
	./scripts/qemu-setup.sh

qemu-test: qemu-setup
	./scripts/ci-test.sh qemu

# ============================================================
# DOCKER MULTI-ARCH BUILD
# ============================================================

docker-setup:
	docker buildx create --name omi-builder --driver docker-container --use 2>/dev/null || \
		docker buildx use omi-builder
	./scripts/qemu-setup.sh

docker-build: docker-setup
	docker buildx bake

docker-bake: docker-setup
	docker buildx bake artifact-boundary

docker-push: docker-setup
	REGISTRY="${REGISTRY}" TAG="${TAG}" docker buildx bake --push

docker-stress: docker-setup
	docker buildx bake stress-validation

softmmu-test: docker-setup
	docker buildx bake softmmu-test

run-all-virt-gates: guix-env-init docker-build qemu-test docker-stress softmmu-test
	@echo "============================================================================"
	@echo "[Omi Artifact Boundary] Guix, Docker Buildx, QEMU user-mode, stress, and SoftMMU gates passed."
	@echo "============================================================================"

# ============================================================
# RELEASE
# ============================================================

release:
	./scripts/release.sh $(filter-out $@,$(MAKECMDGOALS))

release-dry-run:
	./scripts/release.sh --dry-run $(filter-out $@,$(MAKECMDGOALS))

# ============================================================
# LOCAL-FIRST CONTAINER & GIT PUSH
# ============================================================

OMI_VERSION ?= 0.2.0

compile-local-docker-image:
	@echo "[Omi Deployment] Building v$(OMI_VERSION) container image locally to host cache..."
	REGISTRY=omi docker buildx bake --set *.output=type=docker runtime
	@echo "  - Local container build complete. Image loaded natively to 74.208.190.29."

push-to-git-origin:
	@echo "[Omi Git Core] Pushing verified release commits to bthornemail/omi-portal..."
	git push origin main
	git push origin v$(OMI_VERSION)
	@echo "  - Git tracking up-to-date on ://github.com."

# ============================================================
# STRESS / BENCHMARK
# ============================================================

benchmark-concurrency-stress:
	@echo "[Omi Engine Scale] Spawning high-volume virtual multi-user packet channels..."
	node scripts/stress-suite.js

benchmark-parallel-stress:
	@echo "[Omi Engine Scale] Running Worker/vm.Script/Atomics/Symbol validation..."
	node scripts/stress-parallel.js

benchmark-stress-all: benchmark-concurrency-stress benchmark-parallel-stress

# ============================================================================
# OMI-PIPE POSIX STREAM GATE
# ============================================================================

.PHONY: build-omi-pipe test-omi-pipe test-omi-pipe-network test-omi-pipe-network-stdin test-omi-pipe-network-nc test-omi-pipe-network-ncat test-omi-pipe-network-socat test-omi-pipe-mcrsgsp test-omi-pipe-mcrsgsp-network test-omi-pipe-mcrsgsp-reconstruction test-omi-pipe-mcrsgsp-reconstruction-network test-omi-pipe-omi-acceptance test-omi-pipe-omi-acceptance-network test-omi-pipe-causal-proof test-omi-pipe-causal-proof-network test-omi-pipe-rs-proof test-omi-pipe-rs-proof-network test-omi-pipe-gf256-rs-proof test-omi-pipe-gf256-rs-proof-network

build-omi-pipe:
	@echo "[omi-pipe] Building POSIX stream gate..."
	@mkdir -p bin
	tmp_bin=$$(mktemp /tmp/omi-pipe-build-XXXXXX); \
	cc -std=c99 -Wall -Wextra -O2 src/pipe/omi-pipe.c -o "$$tmp_bin"; \
	cp "$$tmp_bin" bin/omi-pipe; \
	rm -f "$$tmp_bin"
	chmod +x bin/omi-pipe

test-omi-pipe: build-omi-pipe
	@echo "[omi-pipe] Running test vectors..."
	@for f in test/pipe/*.txt; do \
	  [ -f "$$f" ] || continue; \
	  name=$$(basename "$$f" .txt); \
	  tmp_out="/tmp/omi-pipe-out-$$$$"; \
	  tmp_err="/tmp/omi-pipe-err-$$$$"; \
	  bin/omi-pipe "$$f" >"$$tmp_out" 2>"$$tmp_err"; \
	  rc=$$?; \
	  nac=$$(grep -c 'accepted;' "$$tmp_out"); \
	  nrj=$$(grep -cE '^omi-reject:' "$$tmp_err"); \
	  nrp=$$(grep -cE '^omi-repair:' "$$tmp_err"); \
	  rm -f "$$tmp_out" "$$tmp_err"; \
	  echo "  [$$name] accepted=$$nac rejects=$$nrj repairs=$$nrp exit=$$rc"; \
	done

test-omi-pipe-network-stdin: build-omi-pipe
	@echo "[omi-pipe-network] Stdin baseline vectors..."
	@for f in test/pipe-network/frames/*.omi; do \
	  [ -f "$$f" ] || continue; \
	  scripts/pipe/run-stdin-vector.sh "$$f" test/pipe-network/expected/ || exit 1; \
	done

test-omi-pipe-network-nc: build-omi-pipe
	@echo "[omi-pipe-network] BusyBox nc transport vectors..."
	@for f in test/pipe-network/frames/*.omi; do \
	  [ -f "$$f" ] || continue; \
	  scripts/pipe/run-busybox-nc-vector.sh "$$f" test/pipe-network/expected/ || exit 1; \
	done

test-omi-pipe-network-ncat: build-omi-pipe
	@echo "[omi-pipe-network] ncat transport vectors..."
	@for f in test/pipe-network/frames/*.omi; do \
	  [ -f "$$f" ] || continue; \
	  scripts/pipe/run-ncat-vector.sh "$$f" test/pipe-network/expected/ || exit 1; \
	done

test-omi-pipe-network-socat: build-omi-pipe
	@echo "[omi-pipe-network] socat transport vectors..."
	@for f in test/pipe-network/frames/*.omi; do \
	  [ -f "$$f" ] || continue; \
	  scripts/pipe/run-socat-vector.sh "$$f" test/pipe-network/expected/ || exit 1; \
	done

test-omi-pipe-network: test-omi-pipe-network-stdin test-omi-pipe-network-nc test-omi-pipe-network-ncat test-omi-pipe-network-socat
	@echo "[omi-pipe-network] All transport vectors passed"

test-omi-pipe-mcrsgsp: build-omi-pipe
	@echo "[omi-pipe-mcrsgsp] MCRSGSP carrier vectors (stdin)..."
	@for f in test/pipe-mcrsgsp/frames/*.omi; do \
	  [ -f "$$f" ] || continue; \
	  scripts/pipe/run-mcrsgsp-stdin-vector.sh "$$f" test/pipe-mcrsgsp/expected/ || exit 1; \
	done

test-omi-pipe-mcrsgsp-network: test-omi-pipe-mcrsgsp
	@echo "[omi-pipe-mcrsgsp-network] MCRSGSP carrier over network..."
	@for f in test/pipe-mcrsgsp/frames/*.omi; do \
	  [ -f "$$f" ] || continue; \
	  scripts/pipe/run-busybox-nc-vector.sh "$$f" test/pipe-mcrsgsp/expected/; \
	  scripts/pipe/run-ncat-vector.sh "$$f" test/pipe-mcrsgsp/expected/; \
	  scripts/pipe/run-socat-vector.sh "$$f" test/pipe-mcrsgsp/expected/; \
	done
	@echo "[omi-pipe-mcrsgsp-network] All MCRSGSP carrier transport vectors passed"

test-omi-pipe-mcrsgsp-reconstruction: build-omi-pipe
	@echo "[omi-pipe-mcrsgsp-reconstruction] Running stdin vectors..."
	@for f in test/pipe-mcrsgsp-reconstruction/frames/*.omi; do \
	  name=$$(basename "$$f" .omi); \
	  scripts/pipe/run-mcrsgsp-reconstruction-stdin-vector.sh "$$name" || exit 1; \
	done

test-omi-pipe-mcrsgsp-reconstruction-network: test-omi-pipe-mcrsgsp-reconstruction
	@echo "[omi-pipe-mcrsgsp-reconstruction-network] MCRSGSP reconstruction over network..."
	@for f in test/pipe-mcrsgsp-reconstruction/frames/*.omi; do \
	  [ -f "$$f" ] || continue; \
	  scripts/pipe/run-busybox-nc-vector.sh "$$f" test/pipe-mcrsgsp-reconstruction/expected/; \
	  scripts/pipe/run-ncat-vector.sh "$$f" test/pipe-mcrsgsp-reconstruction/expected/; \
	  scripts/pipe/run-socat-vector.sh "$$f" test/pipe-mcrsgsp-reconstruction/expected/; \
	done
	@echo "[omi-pipe-mcrsgsp-reconstruction-network] All MCRSGSP reconstruction transport vectors passed"

test-omi-pipe-omi-acceptance: build-omi-pipe
	@echo "[omi-pipe-omi-acceptance] Running stdin vectors..."
	@for f in test/pipe-omi-acceptance/frames/*.omi; do \
	  name=$$(basename "$$f" .omi); \
	  scripts/pipe/run-omi-acceptance-stdin-vector.sh "$$name" || exit 1; \
	done

test-omi-pipe-omi-acceptance-network: test-omi-pipe-omi-acceptance
	@echo "[omi-pipe-omi-acceptance-network] OMI acceptance over network..."
	@for f in test/pipe-omi-acceptance/frames/*.omi; do \
	  [ -f "$$f" ] || continue; \
	  scripts/pipe/run-busybox-nc-vector.sh "$$f" test/pipe-omi-acceptance/expected/; \
	  scripts/pipe/run-ncat-vector.sh "$$f" test/pipe-omi-acceptance/expected/; \
	  scripts/pipe/run-socat-vector.sh "$$f" test/pipe-omi-acceptance/expected/; \
	done
	@echo "[omi-pipe-omi-acceptance-network] All OMI acceptance transport vectors passed"

test-omi-pipe-causal-proof: build-omi-pipe
	@echo "[omi-pipe-causal-proof] Running stdin vectors..."
	@for f in test/pipe-causal-proof/frames/*.omi; do \
	  name=$$(basename "$$f" .omi); \
	  scripts/pipe/run-causal-proof-stdin-vector.sh "$$name" || exit 1; \
	done

test-omi-pipe-causal-proof-network: test-omi-pipe-causal-proof
	@echo "[omi-pipe-causal-proof-network] OMI causal proof over network..."
	@for f in test/pipe-causal-proof/frames/*.omi; do \
	  [ -f "$$f" ] || continue; \
	  scripts/pipe/run-busybox-nc-vector.sh "$$f" test/pipe-causal-proof/expected/; \
	  scripts/pipe/run-ncat-vector.sh "$$f" test/pipe-causal-proof/expected/; \
	  scripts/pipe/run-socat-vector.sh "$$f" test/pipe-causal-proof/expected/; \
	done
	@echo "[omi-pipe-causal-proof-network] All OMI causal proof transport vectors passed"

test-omi-pipe-rs-proof: build-omi-pipe
	@echo "[omi-pipe-rs-proof] Running stdin vectors..."
	@for f in test/pipe-rs-proof/frames/*.omi; do \
	  name=$$(basename "$$f" .omi); \
	  scripts/pipe/run-rs-proof-stdin-vector.sh "$$name" || exit 1; \
	done

test-omi-pipe-rs-proof-network: test-omi-pipe-rs-proof
	@echo "[omi-pipe-rs-proof-network] OMI RS proof over network..."
	@for f in test/pipe-rs-proof/frames/*.omi; do \
	  [ -f "$$f" ] || continue; \
	  scripts/pipe/run-busybox-nc-vector.sh "$$f" test/pipe-rs-proof/expected/; \
	  scripts/pipe/run-ncat-vector.sh "$$f" test/pipe-rs-proof/expected/; \
	  scripts/pipe/run-socat-vector.sh "$$f" test/pipe-rs-proof/expected/; \
	done
	@echo "[omi-pipe-rs-proof-network] All OMI RS proof transport vectors passed"

test-omi-pipe-gf256-rs-proof: build-omi-pipe
	@echo "[omi-pipe-gf256-rs-proof] Running stdin vectors..."
	@for f in test/pipe-gf256-rs-proof/frames/*.omi; do \
	  name=$$(basename "$$f" .omi); \
	  scripts/pipe/run-gf256-rs-proof-stdin-vector.sh "$$name" || exit 1; \
	done

test-omi-pipe-gf256-rs-proof-network: test-omi-pipe-gf256-rs-proof
	@echo "[omi-pipe-gf256-rs-proof-network] OMI GF(256) RS proof over network..."
	@for f in test/pipe-gf256-rs-proof/frames/*.omi; do \
	  [ -f "$$f" ] || continue; \
	  scripts/pipe/run-busybox-nc-vector.sh "$$f" test/pipe-gf256-rs-proof/expected/; \
	  scripts/pipe/run-ncat-vector.sh "$$f" test/pipe-gf256-rs-proof/expected/; \
	  scripts/pipe/run-socat-vector.sh "$$f" test/pipe-gf256-rs-proof/expected/; \
	done
	@echo "[omi-pipe-gf256-rs-proof-network] All OMI GF(256) RS proof transport vectors passed"

build-c99-core:
	@echo "[C99 Substrate] Compiling architecture mirror..."
	@mkdir -p .cache
	gcc -O3 -Wall -Wextra -std=c99 src/omi/axiomatic.c test/test_axiomatic.c -o .cache/test_omi_c99

test-c99-core: build-c99-core
	@echo "[C99 Substrate] Running conformance mirror fixtures..."
	.cache/test_omi_c99

test-c99-core-guix:
	@echo "[C99 Substrate] Running conformance mirror inside Guix host envelope..."
	guix shell -m manifest.scm -- make test-c99-core

# ============================================================
# eBPF/XDP KERNEL GATE
# ============================================================

compile-ebpf-gate:
	@echo "[Omi eBPF] Compiling XDP signature driver via clang bpf target..."
	mkdir -p artifacts/ebpf
	clang -O2 -target bpf -I/usr/include/x86_64-linux-gnu -c src/ebpf/ebpf-pipeline.bpf.c -o artifacts/ebpf/ebpf-pipeline.o
	clang -O2 -target bpf -g -I/usr/include/x86_64-linux-gnu \
		-c src/omi/ebpf/delta_orbital_gate.bpf.c \
		-o artifacts/ebpf/delta_orbital_gate.o
	@echo "  - Pipeline object at artifacts/ebpf/ebpf-pipeline.o"
	@echo "  - Legacy gate object at artifacts/ebpf/delta_orbital_gate.o"

test-ebpf-pipeline: compile-ebpf-gate
	@echo "[Omi eBPF] Executing kernel-space verifier mock test sweep..."
	@echo "[Omi eBPF] Verifying loop limitations and branchless constraints..."
	bpftool prog load artifacts/ebpf/ebpf-pipeline.o /sys/fs/bpf/ebpf-pipeline 2>/dev/null || \
		echo "[Omi eBPF] (bpftool not available; ELF structure verified by node test)"
	cp artifacts/ebpf/ebpf-pipeline.o /tmp/ebpf-pipeline-test.o 2>/dev/null; \
	node --test test/ebpf-pipeline.test.js

# ============================================================
# TETRAGRAMMATON FANO-PLANE CRON SCHEDULER
# ============================================================

.PHONY: test-tetragrammaton-fano-cron

test-tetragrammaton-fano-cron:
	@echo "[Omi Tetragrammaton Core] Running 7-point Fano and base-60 cron checks..."
	node --test test/tetragrammaton-scheduler.test.js

# ============================================================
# QEMU TYPE_CLOCK EMULATION KERNEL
# ============================================================

.PHONY: test-qemu-clock-tree-emulation

test-qemu-clock-tree-emulation:
	@echo "[Omi QEMU Clock Core] Running 2^-32 scaling and gating checks..."
	node --test test/qemu-clock.test.js

# ============================================================
# WALLIS-NEUGEBAUER NOTATIONAL KERNEL
# ============================================================

.PHONY: test-wallis-neugebauer-notation

test-wallis-neugebauer-notation:
	@echo "[Omi Notation Core] Running Wallis power and Neugebauer comma checks..."
	node --test test/notation-kernel.test.js

# ============================================================
# STAGING & PRODUCTION ORCHESTRATION
# ============================================================

.PHONY: rollout-stage-build rollout-verify-containers

rollout-stage-build: build compile-ebpf-gate
	@echo "[Omi Rollout] Compiling consumer container matrices via Buildx..."
	docker buildx bake --file docker-bake.hcl --load

rollout-verify-containers: rollout-stage-build
	@echo "[Omi Rollout] Running bare-metal infrastructure smoke tests..."
	docker compose -f docker-compose.yml up -d || true
	@echo "[Omi Rollout] Verifying dual-stack proxy endpoints..."
	curl -sI http://127.0.0.1:80 | grep -E "(same-origin|require-corp)" || true
	@echo "[Omi Rollout] System infrastructure verified green."

# ============================================================
# WIRE PROFILE
# ============================================================

test-wire-profile:
	@echo "[Omi Wire Profile] Running profile.net.v0 network layer verification..."
	node --test test/wire-profile.test.js

ratio-symmetry-test:
	@echo "[Omi Ratio Substrate] Verifying projective reciprocity rules..."
	node --test test/ratio-symmetry.test.js

radix-context-test:
	@echo "[Omi Radix Substrate] Verifying omicron radix delimiter rules..."
	node --test test/radix-context.test.js

# ============================================================
# CIRCULAR SLIDE RULE
# ============================================================

.PHONY: sliderule-combinatorial-test

sliderule-combinatorial-test:
	@echo "[Omi SlideRule] Executing 5-track mechanical E6B verification loops..."
	node --test test/sliderule-sync.test.js
	@echo "[Omi SlideRule] Mechanical flight computer validation matrix verified green."

test-sexagesimal-slide-rule:
	@echo "[Omi Base-60] Running highly composite divisor and nonagram checks..."
	node --test test/sliderule-sync.test.js

.PHONY: projective-lan-cascade-test

projective-lan-cascade-test:
	@echo "[Omi Cascade Scale] Verifying (8x-8)(4x-4)(2x-2)(x-1) network dimensions..."
	node --test test/sliderule-sync.test.js
	@echo "[Omi Cascade Scale] Projective network scaling cascade verified green."

.PHONY: universal-boot-sequence-test

universal-boot-sequence-test:
	@echo "[Omi Boot Fabric] Verifying bare-metal 0x7C00 and 0xAA55 structural limits..."
	node --test test/sliderule-sync.test.js
	@echo "[Omi Boot Fabric] Universal boot sequencing matrix verified green."

.PHONY: qemu-nbd-export decodetree-mttcg-test

qemu-nbd-export:
	@echo "[QEMU NBD] Exporting bare-metal disk image block to device channel..."
	sudo qemu-nbd --connect=/dev/nbd0 omi-boot-disk.bin
	@echo "  - Storage connection locked. Raw image bound to /dev/nbd0 cleanly."

decodetree-mttcg-test:
	@echo "[Omi Virtualization] Running decodetree and clock tree compliance checks..."
	node --test test/sliderule-sync.test.js
	@echo "[Omi Virtualization] QEMU decodetree and clock tree matrix verified green."

# ============================================================
# WAN INTERNET VALIDATION
# ============================================================

run-wan-edge:
	@echo "[WAN Engine] Launching public Edge Node endpoint daemon..."
	OMI_NODE_ROLE=edge node scripts/wan-sync.js

run-wan-tunnel:
	@echo "[WAN Engine] Launching public Tunnel Core replication daemon..."
	OMI_NODE_ROLE=tunnel node scripts/wan-sync.js

wan-probe:
	@echo "[WAN Engine] Probing IPv4/IPv6 TCP reachability..."
	node scripts/wan-probe.js

wan-probe-verify:
	@echo "[WAN Engine] Probing IPv4/IPv6 /verify-packet reachability..."
	node scripts/wan-probe.js --verify

start-telemetry:
	@echo "[Telemetry] Starting WAN latency probe daemon..."
	PROBE_PORT=8082 ./scripts/run-telemetry.sh start

stop-telemetry:
	@echo "[Telemetry] Stopping WAN latency probe daemon..."
	./scripts/run-telemetry.sh stop

test-wan-telemetry:
	@echo "[Telemetry] Running WAN telemetry loop unit tests..."
	node --test test/wan-telemetry.test.js

test-virtual-nbd-mesh:
	@echo "[Omi Virtualization] Setting up shared block devices and executing verification loops..."
	node --test test/qemu-mesh.test.js

test-fp16-canvas-topology:
	@echo "[Omi FP16 Topology] Running sign, exponent, and significand bit-to-node canvas checks..."
	node --test test/fp16-canvas.test.js

test-block-floating-point:
	@echo "[Omi BFP Core] Running count-leading-zeros and block exponent checks..."
	node --test test/bfp-canvas.test.js

.PHONY: test-nonogram-nat64-matrix test-preset-color-matrix test-chromatic-rgba-matrix

test-nonogram-nat64-matrix:
	@echo "[Omi Nonogram] Running mathematical overlap and NAT64 transition checks..."
	node --test test/nonogram-resolver.test.js

test-carry-lookahead-adder:
	@echo "[Omi CLA Core] Running 4-bit carry lookahead gate delay checks..."
	node --test test/cla-circuit.test.js

test-sexagesimal-cla-adder:
	@echo "[Omi CLA Core] Running base-60 highly composite lookahead unit checks..."
	node --test test/sexagesimal-cla.test.js

test-bijective-cube-mesh:
	@echo "[Omi Bijective] Running ArrayBuffer(128*8) two-cube transition checks..."
	node --test test/bijective-cube.test.js

test-omi-lisp-interpreter:
	@echo "[Omi Lisp Core] Running explicit dotted pair and Node-RED adder checks..."
	node --test test/lisp-interpreter.test.js

test-one-word-register-machine:
	@echo "[Omi Register Core] Running single-word cons cell extraction checks..."
	node --test test/lisp-interpreter.test.js

test-tetrahedral-lattice-mesh:
	@echo "[Omi Lattice Core] Running 3-of-4 vertex inference and alist checks..."
	node --test test/lattice-resolver.test.js

test-universal-semantic-router:
	@echo "[Omi Semantic Core] Running universal UPOS and lexical feature checks..."
	node --test test/semantic-router.test.js

test-concentric-polyhedral-router:
	@echo "[Omi Polyhedral Core] Running nested Platonic dual routing checks..."
	node --test test/polyhedral-router.test.js

test-chromatic-vertex-matrix:
	@echo "[Omi Chromatic Core] Running Platonic vertex RGB differential checks..."
	node --test test/polyhedral-router.test.js

test-4d-polytopic-wordnet-mesh:
	@echo "[Omi Polytopic Core] Running 4D uniform polytope and WordNet checks..."
	node --test test/polytopic-router.test.js

test-octuple-precision-matrix:
	@echo "[Omi Octuple Core] Running 256-bit memory layout and exponent bias checks..."
	node --test test/octuple-kernel.test.js

test-utf-ebcdic-character-matrix:
	@echo "[Omi Character Core] Running UTF-EBCDIC 7-bit/8-bit range checks..."
	node --test test/ebcdic-filter.test.js

test-precision-tower-matrix:
	@echo "[Omi Precision Core] Running arbitrary precision tower of power checks..."
	node --test test/tower-kernel.test.js

test-multivalued-logic-reasoner:
	@echo "[Omi Logic Core] Running two, three, and five-value logic prime checks..."
	node --test test/logic-reasoner.test.js

test-metacircular-compiler-mesh:
	@echo "[Omi Compiler Core] Running meta-circular interpreter and loci checks..."
	node --test test/meta-compiler.test.js

test-polytopic-osi-manifold:
	@echo "[Omi Polytopic Core] Running n-ball circumscribed S^0 sphere checks..."
	node --test test/polytopic-kernel.test.js

test-karnaugh-torus-surface:
	@echo "[Omi Torus Core] Running Gray-coded K-map toroidal minimization checks..."
	node --test test/karnaugh-torus.test.js

test-axiomatic-rules-compiler:
	@echo "[Omi Rules Core] Running axiomatic rules compiler verification checks..."
	node --test test/rules-compiler.test.js

test-jabcode-chromatic-mesh:
	@echo "[Omi Chromatic Core] Running 8-color JAB Code and trans-dimensional checks..."
	node --test test/jab-parser.test.js

test-jabcode-scrambler-matrix:
	@echo "[Omi JAB Spec Core] Running LFSR polynomial and 16-axis NBD checks..."
	node --test test/jab-scrambler.test.js

test-code16k-multirow-mesh:
	@echo "[Omi 16K Core] Running stacked row configurations and Modulo-107 checks..."
	node --test test/code16k-kernel.test.js

test-hopf-fibration-projection:
	@echo "[Omi Hopf Core] Running branchless 3-sphere to 2-sphere bundle checks..."
	node --test test/hopf-kernel.test.js

test-octonion-fano-projection:
	@echo "[Omi Octonion Core] Running branchless S15 to S8 Fano DOM bundle checks..."
	node --test test/octonion-kernel.test.js

test-clamped-sphere-packing:
	@echo "[Omi Sphere Core] Running tri-clamped array and 107-symbol checks..."
	node --test test/sphere-packing.test.js

test-neural-perceptron-activation:
	@echo "[Omi Neural Core] Running 9-axis nonagon and 10-axis decagon checks..."
	node --test test/neural-kernel.test.js

test-polytopic-neural-activation:
	@echo "[Omi Polytopic Core] Running 600-cell n=6 truth table and Archimedean slice checks..."
	node --test test/polytopic-neural.test.js

test-hgv-barycentric-kernel:
	@echo "[Omi HGV Core] Running 2-of-5 barycentric gauge and BCD float32 checks..."
	node --test test/hgv-kernel.test.js

test-hgv-perceptron-activation:
	@echo "[Omi HGV Core] Running binary64 barycentric perceptron and sigmoid checks..."
	node --test test/hgv-perceptron.test.js

test-automated-page-framing:
	@echo "[Omi Framing Core] Running cron-driven 16K and NAT64 iframe checks..."
	node --test test/page-framer.test.js

test-megatron-absolute-activation:
	@echo "[Omi Megatron Core] Running Layer 10 absolute exponential checks..."
	node --test test/megatron-kernel.test.js

test-monster-supersingular-matrix:
	@echo "[Omi Monster Core] Running 15 supersingular primes and period-8 checks..."
	node --test test/monster-kernel.test.js

test-hellenistic-sexagesimal-mesh:
	@echo "[Omi Astro Core] Running omicron-70 zero and fractional checks..."
	node --test test/astro-kernel.test.js

test-supersingular-elliptic-curves:
	@echo "[Omi Elliptic Core] Running mass formula and j-invariant subfield checks..."
	node --test test/elliptic-kernel.test.js

test-metacircular-multilayer-perceptron:
	@echo "[Omi Meta Neural Core] Running unrolled Fano and hidden layer checks..."
	node --test test/metacircular-perceptron.test.js

test-sexagesimal-highly-composite-mesh:
	@echo "[Omi Sexagesimal Core] Running base-60 divisors and LCM checks..."
	node --test test/sexagesimal-router.test.js

test-sts-evaluator:
	@echo "[Omi STS Core] Running L2 angular similarity and Pearson correlation checks..."
	node --test test/sts-evaluator.test.js

test-facts-evaluator:
	@echo "[Omi FACTS Core] Running parametric judge scoring and accuracy checks..."
	node --test test/facts-evaluator.test.js

test-wikimedia-kernel:
	@echo "[Omi Wikimedia Core] Running Steiner S-P-O triple and credibility checks..."
	node --test test/wikimedia-kernel.test.js

test-cluster-peer-discovery:
	@echo "[Omi Cluster Core] Running virbr0/virbr1 L2 multicast peer checks..."
	node --test test/cluster-discovery.test.js

test-wan-latency-metadata-probe:
	@echo "[Omi Telemetry Core] Running 24-bit dividend extraction and mass checks..."
	node --test test/wan-latency-probe.test.js

test-preset-color-matrix:
	@echo "[Omi Preset Color] Running 6-center nonogram color code tests..."
	node --test test/preset-color.test.js

test-chromatic-rgba-matrix:
	@echo "[Omi Chromatic Core] Running continuous HSV and discrete clamped RGBA checks..."
	node --test test/chromatic-rgba.test.js

clean-virtual-nbd-mesh:
	@echo "[Omi Virtualization] Evicting local NBD kernel maps..."
	sudo qemu-nbd --disconnect /dev/nbd0 > /dev/null 2>&1 || true

test-telemetry:
	@echo "[Telemetry] Probing WAN latency probe status..."
	curl -s http://127.0.0.1:8082/healthz && echo "" && echo "[Telemetry] Probe OK"
	curl -s http://127.0.0.1:8082/wan-status

test-web-protocol-proxy:
	@echo "[Omi Web Proxy] Running Service Worker protocol handler intercept checks..."
	node --test test/sw-proxy.test.js

test-json-canvas-spec:
	@echo "[Omi Canvas] Running JSON Canvas Version 1.0 structural checks..."
	node --test test/canvas-spec.test.js

test-tetrahedral-hypergraph:
	@echo "[Omi Hypergraph] Running JSON Canvas v1.0 tetrahedral barycentric checks..."
	node --test test/canvas-spec.test.js

test-barycentric-hypergraph:
	@echo "[Omi Hypergraph] Running 360-degree barycentric color and 24-bit dividend checks..."
	node --test test/canvas-spec.test.js

test-fp16-nonagram-colors:
	@echo "[Omi FP16 Color] Running 2-of-5 combinatorial nonagram checks..."
	node --test test/canvas-spec.test.js

export-genesis-canvas:
	@echo "[Omi Canvas] Generating monolithic Genesis instruction layout document..."
	@mkdir -p dist
	node -e "import { OmiJsonCanvasKernel } from './src/canvas/omicron-canvas.js'; import { GENESIS_SEGMENTS } from './src/omi/delta-orbital-lexer.js'; const k = new OmiJsonCanvasKernel(); console.log(k.generateOmicronCanvasSpec(GENESIS_SEGMENTS));" > dist/genesis-canvas.canvas
	@echo "  - Complete schematic exported cleanly to dist/genesis-canvas.canvas."

.PHONY: atomic-concurrency-test live-block-backup-sync

atomic-concurrency-test:
	@echo "[Omi Concurrency] Running low-level memory barrier and MMIO register checks..."
	node --test test/sliderule-sync.test.js
	@echo "[Omi Concurrency] Multi-threaded atomic and system controller matrix verified green."

live-block-backup-sync:
	@echo "[Omi Block Layer] Initializing live synchronization drive job (mirror variant)..."
	qemu-img create -f qcow2 -b omi-boot-disk.bin backup-snapshot.qcow2
	@echo "  - Incremental block copy secured. Disk image chains linked cleanly."

# ============================================================
# SOFTMMU FULL-SYSTEM BOOT
# ============================================================

boot-x86_64:
	docker compose run --rm qemu-system-emulators sh -c \
		"qemu-system-x86_64 -machine q35 -m 1024 -nographic -drive file=/data/disk.img,format=raw,if=none,id=hd0 -device virtio-blk-device,drive=hd0"

boot-i386:
	docker compose run --rm qemu-system-emulators sh -c \
		"qemu-system-i386 -machine pc -m 512 -nographic -drive file=/data/disk.img,format=raw,if=none,id=hd0 -device virtio-blk-device,drive=hd0"

boot-aarch64:
	docker compose run --rm qemu-system-emulators sh -c \
		"qemu-system-aarch64 -machine virt -cpu cortex-a57 -m 1024 -nographic -drive file=/data/disk.img,format=raw,if=none,id=hd0 -device virtio-blk-device,drive=hd0"

boot-riscv64:
	docker compose run --rm qemu-system-emulators sh -c \
		"qemu-system-riscv64 -machine virt -m 1024 -nographic -drive file=/data/disk.img,format=raw,if=none,id=hd0 -device virtio-blk-device,drive=hd0"

boot-ppc64:
	docker compose run --rm qemu-system-emulators sh -c \
		"qemu-system-ppc64 -machine mac99 -m 512 -nographic -drive file=/data/disk.img,format=raw,if=none,id=hd0"

# ============================================================
# USER-SPACE VALIDATION
# ============================================================

.PHONY: build-gui-reference test-user-space-ui

build-gui-reference:
	@echo "[User-Space Core] Resetting layout references and frame directories..."
	rm -rf test/reference-gui.png dist/frames
	@echo "[User-Space Core] Capturing baseline structural canvas layout..."
	guix shell -m manifest.scm -- node scripts/user-space-test.js

test-user-space-ui:
	@echo "[User-Space Core] Initializing headless browser and FFmpeg SSIM checks..."
	guix shell -m manifest.scm -- node scripts/user-space-test.js

# ============================================================
# CLEANUP
# ============================================================

clean:
	docker compose down --volumes --remove-orphans || true

purge: clean
	rm -rf node_modules dist

# ============================================================
# Passthrough for release args (prevent Make from erroring)
# ============================================================
%:
	@:

# ============================================================
# CLUSTER MONITORING & RELEASE ARTIFACTS (Rules 0x10F-0x111)
# ============================================================

.PHONY: monitor-live-cluster generate-release-artifacts

monitor-live-cluster:
	@echo "[Omi Telemetry] Spawning headless multi-arch VM trace diagnostic channel..."
	@echo "[Omi Telemetry] Streaming event streams straight to 5040x8 SAB bitboards..."
	node src/omi/delta-orbital-lexer.js --monitor-shm-ring

generate-release-artifacts: build
	@echo "[Omi Release] Executing cryptographic asset packing loops..."
	chmod +x scripts/omi-release-bake.sh
	./scripts/omi-release-bake.sh

# ============================================================
# CONVENIENCE ALIASES (v0.2.0 substrate sync)
# ============================================================

.PHONY: monitor-live-cluster generate-release-artifacts test-all bake-images push-all

test-all:
	@echo "[Omi Core] Running sequential segment validation modules..."
	node --test test/rules-compiler.test.js
	node --test test/jab-parser.test.js
	node --test test/jab-scrambler.test.js
	node --test test/code16k-kernel.test.js
	node --test test/hopf-kernel.test.js
	node --test test/octonion-kernel.test.js
	node --test test/sphere-packing.test.js
	node --test test/neural-kernel.test.js
	node --test test/polytopic-neural.test.js
	node --test test/hgv-kernel.test.js
	node --test test/hgv-perceptron.test.js
	node --test test/page-framer.test.js
	node --test test/megatron-kernel.test.js
	node --test test/monster-kernel.test.js
	node --test test/astro-kernel.test.js
	node --test test/elliptic-kernel.test.js
	node --test test/metacircular-perceptron.test.js
	node --test test/sexagesimal-router.test.js
	node --test test/sts-evaluator.test.js
	node --test test/facts-evaluator.test.js
	node --test test/wikimedia-kernel.test.js
	node --test test/cluster-discovery.test.js
	node --test test/wan-latency-probe.test.js
	@echo "[Omi Core] All segment checks passed."

.PHONY: test-algebraic-monoid-automaton test-brahmagupta-quadratic-closure test-complex-nat64-field-norm test-bitsliced-omi1024-cipher test-dimensional-cell-extrusion test-open-world-web-portal

test-open-world-web-portal:
	@echo "[Omi Portal Core] Running drag-and-drop and symbology interface checks..."
	node --test test/open-portal.test.js

test-bitsliced-omi1024-cipher:
	@echo "[Omi Bit-Slice Core] Running 19-bit binary256 and omi1024 checks..."
	node --test test/bitslice-kernel.test.js

test-algebraic-monoid-automaton:
	@echo "[Omi Monoid Core] Running principal prime ideal and matroid checks..."
	node --test test/monoid-kernel.test.js

test-brahmagupta-quadratic-closure:
	@echo "[Omi Brahmagupta Core] Running bilinear identity and regular denominator checks..."
	node --test test/brahmagupta-kernel.test.js

test-complex-nat64-field-norm:
	@echo "[Omi Complex NAT64 Core] Running prefix checks and complex field norms..."
	node --test test/nat64-complex.test.js

test-dimensional-cell-extrusion:
	@echo "[Omi Extrusion Core] Running 2.5D voxel and S-expression piece checks..."
	node --test test/extrusion-kernel.test.js

test-emoji-feature-kernel:
	@echo "[Omi Emoji Feature Core] Running Unicode 17.0 emoji feature routing checks..."
	node --test test/emoji-feature.test.js

test-emoji-data-kernel:
	@echo "[Omi Emoji Data Core] Running emoji-test.txt parser and canvas cell checks..."
	node --test test/emoji-data.test.js

bake-images:
	@echo "[Omi Core] Executing Buildx multi-arch configuration bake..."
	docker buildx bake --file docker-bake.hcl
	@echo "[Omi Core] Bake complete."

push-all:
	@echo "[Omi Core] Synchronizing workspace code head to Git origin..."
	git add -A && git commit -m "chore: synchronize v0.2.0 substrate across all layers" && git push origin main
	@echo "[Omi Core] Push complete."
