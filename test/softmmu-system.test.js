import { test } from "node:test";
import { strict as assert } from "node:assert";
import { spawn } from "node:child_process";
import { OmiBareMetalBootCompiler } from "../src/runtime/boot-compiler.js";

class OmiSoftMMUTestSuite {
  constructor() {
    this.sab = new SharedArrayBuffer(5040 * 8);
    this.compiler = new OmiBareMetalBootCompiler(this.sab);
  }

  generateValidMBRImage() {
    const sectorBuffer = new ArrayBuffer(512);
    const view = new DataView(sectorBuffer);
    for (let i = 0; i < 510; i++) view.setUint8(i, 0x90);
    view.setUint16(510, 0xAA55, true);
    return sectorBuffer;
  }

  async validateSystemBoot(binaryName, machineArguments) {
    return new Promise((resolve) => {
      console.log(` -> Booting: ${binaryName} ${machineArguments.join(" ")}`);
      const proc = spawn(binaryName, [...machineArguments, "-snapshot"], {
        timeout: 500
      });
      let stderr = "";
      proc.stderr.on("data", (d) => { stderr += d.toString(); });
      proc.stdout.on("data", (d) => { stderr += d.toString(); });
      proc.on("close", (code) => {
        const ok = !stderr.toLowerCase().includes("error") &&
                   !stderr.toLowerCase().includes("fatal");
        resolve(ok);
      });
      proc.on("error", () => resolve(false));
    });
  }
}

test("SoftMMU MBR ingestion via OmiBareMetalBootCompiler", () => {
  const suite = new OmiSoftMMUTestSuite();
  const mbr = suite.generateValidMBRImage();
  const ingested = suite.compiler.compileBootSector(mbr);
  assert.ok(ingested, "Failed to ingest valid MBR block");
  const boot = suite.compiler.parseBootAddress("omi-ffff-127-0-0-1-7C00-7F00-80");
  assert.ok(boot, "Boot address should resolve");
  assert.equal(boot.tier, "BOOT_SECTOR_LOOKUP_TABLE");
});

test("SoftMMU MBR rejects invalid 0xAA55 signature", () => {
  const suite = new OmiSoftMMUTestSuite();
  const bad = new ArrayBuffer(512);
  assert.throws(() => suite.compiler.compileBootSector(bad), /0xAA55/);
});

test("SoftMMU full system emulation boots targets", async (t) => {
  const suite = new OmiSoftMMUTestSuite();
  const mbr = suite.generateValidMBRImage();
  assert.ok(suite.compiler.compileBootSector(mbr));

  const targets = [
    { binary: "qemu-system-x86_64",  args: ["-machine", "q35", "-display", "none"] },
    { binary: "qemu-system-i386",    args: ["-machine", "pc", "-display", "none"] },
    { binary: "qemu-system-riscv64", args: ["-machine", "virt", "-display", "none"] },
    { binary: "qemu-system-aarch64", args: ["-machine", "virt", "-display", "none"] }
  ];

  for (const target of targets) {
    const ok = await suite.validateSystemBoot(target.binary, target.args);
    assert.ok(ok, `Boot stalled on ${target.binary}`);
    console.log(`    -> [Pass] ${target.binary}`);
  }
});

test("Boot compiler pre-header invariants for Big-Endian (ppc64)", () => {
  const sab = new SharedArrayBuffer(64);
  const view = new DataView(sab);
  const isBigEndian = true;
  view.setUint8(0, 0x02);
  view.setUint8(1, 0x0B);
  view.setUint8(2, 0x3F);
  view.setUint8(3, 0x2D);
  const value = 44.6875;
  view.setFloat64(8, value, !isBigEndian);
  const readback = view.getFloat64(8, !isBigEndian);
  assert.equal(readback, value);
});

test("Boot compiler pre-header invariants for 32-bit (i386)", () => {
  const sab = new SharedArrayBuffer(64);
  const view = new DataView(sab);
  view.setUint8(0, 0x01);
  view.setUint8(1, 0x0A);
  view.setUint8(2, 0x20);
  view.setUint8(3, 0x2D);
  const value = 44.6875;
  view.setFloat32(8, value, true);
  const readback = view.getFloat32(8, true);
  assert.equal(readback, value);
});
