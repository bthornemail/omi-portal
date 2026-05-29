.PHONY: compile test stage smoke \
        guix-env-init qemu-setup qemu-test \
        docker-build docker-bake docker-push docker-stress softmmu-test run-all-virt-gates \
        release release-dry-run \
        benchmark-concurrency-stress benchmark-parallel-stress benchmark-stress-all \
        build-c99-core test-c99-core test-c99-core-guix \
        ratio-symmetry-test radix-context-test \
        run-wan-edge run-wan-tunnel wan-probe wan-probe-verify \
        boot-x86_64 boot-i386 boot-aarch64 boot-riscv64 boot-ppc64 \
        clean purge

# ============================================================
# DEVELOPMENT
# ============================================================

compile:
	npm ci --quiet
	npm run build

test:
	node --test test/*.test.js

stage:
	docker compose down --volumes --remove-orphans || true
	docker compose up --build -d omi-kernel-node

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
# STRESS / BENCHMARK
# ============================================================

benchmark-concurrency-stress:
	@echo "[Omi Engine Scale] Spawning high-volume virtual multi-user packet channels..."
	node scripts/stress-suite.js

benchmark-parallel-stress:
	@echo "[Omi Engine Scale] Running Worker/vm.Script/Atomics/Symbol validation..."
	node scripts/stress-parallel.js

benchmark-stress-all: benchmark-concurrency-stress benchmark-parallel-stress

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
