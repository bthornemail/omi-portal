import { execSync, spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import { join } from "node:path";

const TOTAL_RING_CAPACITY_BYTES = 5040 * 8;

export class OmiQemuNbdMeshCoordinator {
  constructor(storageImgPath = "dist/shared-timeline.img") {
    this.storageImg = join(process.cwd(), storageImgPath);
    this.nbdDevice = "/dev/nbd0";
    this.activeGuests = [];
  }

  async initializeSharedNbdDisk() {
    await fs.mkdir(join(process.cwd(), "dist"), { recursive: true });
    const buffer = Buffer.alloc(TOTAL_RING_CAPACITY_BYTES);
    await fs.writeFile(this.storageImg, buffer);
  }

  attachKernelNbd() {
    try {
      execSync("sudo modprobe nbd max_part=8", { stdio: "pipe" });
      execSync(`sudo qemu-nbd --connect=${this.nbdDevice} ${this.storageImg}`, { stdio: "pipe" });
    } catch (err) {
      throw new Error(`NBD attach failed: ${err.message}`);
    }
  }

  bootArchitectureVariants() {
    const variants = [
      { arch: "x86_64", cmd: "qemu-system-x86_64", ram: "256M", port: "5222" },
      { arch: "aarch64", cmd: "qemu-system-aarch64", ram: "256M", port: "5223" },
    ];

    for (const v of variants) {
      const args = [
        "-m", v.ram,
        "-nographic",
        "-kernel", "dist/vmlinuz",
        "-drive", `file=${this.nbdDevice},format=raw,if=virtio`,
        "-net", "nic,model=virtio",
        "-net", `user,hostfwd=tcp:127.0.0.1:${v.port}-:22`,
      ];

      const proc = spawn(v.cmd, args, { detached: true, stdio: "ignore" });
      proc.unref();
      this.activeGuests.push({ arch: v.arch, pid: proc.pid });
    }
  }

  cleanMeshTopology() {
    try {
      execSync(`sudo qemu-nbd --disconnect ${this.nbdDevice} > /dev/null 2>&1 || true`);
    } catch {
      /* idempotent cleanup */
    }
  }

  getGuestSummary() {
    return {
      nbdDevice: this.nbdDevice,
      storageImg: this.storageImg,
      capacityBytes: TOTAL_RING_CAPACITY_BYTES,
      activeGuests: this.activeGuests.map(g => ({ arch: g.arch, pid: g.pid })),
    };
  }
}
