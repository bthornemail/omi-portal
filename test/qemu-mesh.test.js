import { test, mock } from "node:test";
import { strict as assert } from "node:assert";
import { OmiQemuNbdMeshCoordinator } from "../src/wan/qemu-nbd-mesh.js";
import { promises as fs } from "node:fs";

test("QEMU Mesh: coordinator correctly creates a zero-allocation raw contiguous binary file image", async () => {
  const testImgPath = "dist/test-timeline.img";
  const coordinator = new OmiQemuNbdMeshCoordinator(testImgPath);

  await coordinator.initializeSharedNbdDisk();

  const stats = await fs.stat(coordinator.storageImg);
  assert.equal(stats.size, 5040 * 8);

  await fs.unlink(coordinator.storageImg);
});

test("QEMU Mesh: multi-variant tracking configurations array initializes with clean system constants", () => {
  const coordinator = new OmiQemuNbdMeshCoordinator();
  assert.equal(coordinator.nbdDevice, "/dev/nbd0");
  assert.equal(Array.isArray(coordinator.activeGuests), true);
  assert.equal(coordinator.activeGuests.length, 0);
});

test("QEMU Mesh: getGuestSummary returns correct shape without active guests", () => {
  const coordinator = new OmiQemuNbdMeshCoordinator("/tmp/test-mesh.img");
  const summary = coordinator.getGuestSummary();

  assert.equal(summary.nbdDevice, "/dev/nbd0");
  assert.equal(summary.capacityBytes, 5040 * 8);
  assert.ok(summary.storageImg.endsWith("test-mesh.img"));
  assert.deepEqual(summary.activeGuests, []);
});

test("QEMU Mesh: attachKernelNbd throws when not running as root", () => {
  const coordinator = new OmiQemuNbdMeshCoordinator("/tmp/test-nbd.img");
  assert.throws(() => coordinator.attachKernelNbd(), /NBD attach failed/);
});

test("QEMU Mesh: cleanMeshTopology runs without error as no-op", () => {
  const coordinator = new OmiQemuNbdMeshCoordinator();
  assert.doesNotThrow(() => coordinator.cleanMeshTopology());
});

test("QEMU Mesh: storage image path defaults to dist/shared-timeline.img", () => {
  const coordinator = new OmiQemuNbdMeshCoordinator();
  assert.ok(coordinator.storageImg.includes("dist/shared-timeline.img"));
});

test("QEMU Mesh: disk image allocation uses Buffer.alloc with correct byte count", async () => {
  const tmpPath = "dist/test-capacity.img";
  const coordinator = new OmiQemuNbdMeshCoordinator(tmpPath);

  await coordinator.initializeSharedNbdDisk();
  const data = await fs.readFile(coordinator.storageImg);

  assert.equal(data.length, 5040 * 8);
  assert.ok(data.every(b => b === 0));

  await fs.unlink(coordinator.storageImg);
});

test("QEMU Mesh: bootArchitectureVariants adds two guest records", () => {
  const coordinator = new OmiQemuNbdMeshCoordinator();
  assert.equal(coordinator.activeGuests.length, 0);

  coordinator.bootArchitectureVariants();

  assert.equal(coordinator.activeGuests.length, 2);
  assert.equal(coordinator.activeGuests[0].arch, "x86_64");
  assert.equal(coordinator.activeGuests[1].arch, "aarch64");
  assert.ok(typeof coordinator.activeGuests[0].pid === "number");
  assert.ok(typeof coordinator.activeGuests[1].pid === "number");
});
