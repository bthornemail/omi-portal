;; OMI Portal Guix host-tool envelope.
;;
;; This manifest pins virtualization and build orchestration tools only. Node.js
;; remains Docker-managed because the local Guix channel exposes Node 14 while
;; the repository runtime is Node 24.

(specifications->manifest
  (list "bash"
        "coreutils"
        "findutils"
        "gcc-toolchain"
        "git"
        "grep"
        "make"
        "pkg-config"
        "qemu"
        "sed"))
