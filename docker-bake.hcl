variable "REGISTRY" {
  default = "omi"
}

variable "TAG" {
  default = "latest"
}

variable "OMI_VERSION" {
  default = "0.2.0"
}

# -----------------------------------------------------------
# Group: all images
# -----------------------------------------------------------
group "default" {
  targets = ["runtime", "qemu-test"]
}

group "stress" {
  targets = ["stress-validation"]
}

group "artifact-boundary" {
  targets = ["runtime", "qemu-test", "stress-validation", "softmmu-test"]
}

# -----------------------------------------------------------
# Group: release (explicit tag push)
# -----------------------------------------------------------
group "release" {
  targets = ["runtime-release", "qemu-test-release"]
}

# -----------------------------------------------------------
# Target: OMI Portal runtime (multi-arch)
# -----------------------------------------------------------
target "runtime" {
  dockerfile = "Dockerfile"
  target     = "runtime"
  tags       = [
    "${REGISTRY}/omi-portal:${TAG}",
    "${REGISTRY}/omi-portal:${OMI_VERSION}"
  ]
  platforms  = ["linux/amd64", "linux/arm64"]
  cache-from = ["type=gha"]
  cache-to   = ["type=gha,mode=max"]
  attest     = ["type=provenance,mode=min"]
  labels     = {
    "org.opencontainers.image.version" = "${OMI_VERSION}"
    "org.opencontainers.image.revision" = "${TAG}"
  }
}

target "runtime-release" {
  inherits   = ["runtime"]
  tags       = [
    "${REGISTRY}/omi-portal:${TAG}",
    "${REGISTRY}/omi-portal:${OMI_VERSION}",
    "${REGISTRY}/omi-portal:latest"
  ]
}

# -----------------------------------------------------------
# Target: OMI native stress validation
# -----------------------------------------------------------
target "stress-validation" {
  dockerfile = "Dockerfile.stress"
  target     = "stress-validation"
  tags       = [
    "${REGISTRY}/omi-portal-stress:${TAG}",
    "${REGISTRY}/omi-portal-stress:${OMI_VERSION}"
  ]
  platforms  = ["linux/amd64"]
  cache-from = ["type=gha"]
  cache-to   = ["type=gha,mode=max"]
}

# -----------------------------------------------------------
# Target: QEMU multi-arch test
# -----------------------------------------------------------
target "qemu-test" {
  dockerfile = "Dockerfile.qemu"
  target     = "qemu-test"
  tags       = [
    "${REGISTRY}/omi-portal-test:${TAG}",
    "${REGISTRY}/omi-portal-test:${OMI_VERSION}"
  ]
  platforms  = ["linux/amd64", "linux/arm64"]
  cache-from = ["type=gha"]
  cache-to   = ["type=gha,mode=max"]
}

# -----------------------------------------------------------
# Target: QEMU SoftMMU full-system test
# -----------------------------------------------------------
target "softmmu-test" {
  dockerfile = "Dockerfile.softmmu"
  target     = "softmmu-runtime"
  tags       = [
    "${REGISTRY}/omi-portal-softmmu:${TAG}",
    "${REGISTRY}/omi-portal-softmmu:${OMI_VERSION}"
  ]
  platforms  = ["linux/amd64"]
  cache-from = ["type=gha"]
  cache-to   = ["type=gha,mode=max"]
}

target "qemu-test-release" {
  inherits   = ["qemu-test"]
  tags       = [
    "${REGISTRY}/omi-portal-test:${TAG}",
    "${REGISTRY}/omi-portal-test:${OMI_VERSION}",
    "${REGISTRY}/omi-portal-test:latest"
  ]
}
