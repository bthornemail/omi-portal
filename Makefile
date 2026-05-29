.PHONY: compile test stage smoke \
        qemu-setup qemu-test \
        docker-build docker-bake docker-push \
        release release-dry-run \
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

qemu-setup:
	./scripts/qemu-setup.sh

qemu-test: qemu-setup
	./scripts/ci-test.sh --qemu

# ============================================================
# DOCKER MULTI-ARCH BUILD
# ============================================================

docker-setup:
	docker buildx create --name omi-builder --driver docker-container --use 2>/dev/null || \
		docker buildx use omi-builder
	./scripts/qemu-setup.sh

docker-build: docker-setup
	docker buildx bake

docker-push: docker-setup
	REGISTRY="${REGISTRY}" TAG="${TAG}" docker buildx bake --push

# ============================================================
# RELEASE
# ============================================================

release:
	./scripts/release.sh $(filter-out $@,$(MAKECMDGOALS))

release-dry-run:
	./scripts/release.sh --dry-run $(filter-out $@,$(MAKECMDGOALS))

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
