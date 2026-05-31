#!/usr/bin/env bash
# ============================================================================
# OMI PROTOCOL - PERSISTENT HYPERVISOR LAUNCHER
# File Target: scripts/omi-vm-launch.sh
# ============================================================================
set -euo pipefail

ACTION="${1:-start}"

start_vms() {
  echo "[Omi Hypervisor] Starting persistent QEMU/KVM guest domains..."
  for domain in omi-x86_64 omi-aarch64 omi-riscv64; do
    if sudo virsh domstate "$domain" 2>/dev/null | grep -q "running"; then
      echo "  -> $domain already running"
    else
      sudo virsh start "$domain" 2>/dev/null && echo "  -> $domain started" || echo "  -> $domain unavailable (no disk?)"
    fi
  done

  # Start Docker softmmu container with tty for persistent QEMU shell access
  docker compose --profile qemu up -d qemu-emulators 2>/dev/null || true
  echo "[Omi Hypervisor] All VMs dispatched."
}

stop_vms() {
  echo "[Omi Hypervisor] Stopping persistent QEMU/KVM guest domains..."
  for domain in omi-riscv64 omi-aarch64 omi-x86_64; do
    sudo virsh destroy "$domain" 2>/dev/null || true
  done
  echo "[Omi Hypervisor] All VMs stopped."
}

status_vms() {
  echo "=== Libvirt Domains ==="
  sudo virsh list --all
  echo ""
  echo "=== Docker QEMU Container ==="
  docker ps --filter "name=omi-qemu-matrix" --format "table {{.ID}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
}

case "$ACTION" in
  start)   start_vms ;;
  stop)    stop_vms  ;;
  status)  status_vms ;;
  restart) stop_vms; sleep 1; start_vms ;;
  *)
    echo "Usage: $0 {start|stop|status|restart}"
    exit 1
    ;;
esac
