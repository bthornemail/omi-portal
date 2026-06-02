import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  OmiMiquelRouter, recoverColorOrbit, miquelDivmod36,
  compileMiquelVoxel, getMiquelConfiguration,
} from "../src/omilog/miquel-router.js";

describe("Miquel Router — Color Orbit Recovery", () => {
  it("decodes 00000048 as integer 72 with orbit 2 offset 0", () => {
    const result = recoverColorOrbit("00000048");
    assert.equal(result.integerPayload, 72);
    assert.equal(result.orbitQuotient, 2);
    assert.equal(result.offsetRemainder, 0);
    assert.equal(result.activePrimeMode, 73);
    assert.ok(result.isValidOmiMiquelCarrier);
  });

  it("decodes FF000000 with correct divmod", () => {
    const result = recoverColorOrbit("FF000000");
    assert.equal(result.integerPayload, 0xFF000000);
    assert.equal(result.orbitQuotient, Math.floor(0xFF000000 / 36));
    assert.equal(result.offsetRemainder, 0xFF000000 % 36);
  });

  it("throws for non-8-char hex string", () => {
    assert.throws(() => recoverColorOrbit("FF0000"), /exact 8-character hex/);
    assert.throws(() => recoverColorOrbit(""), /exact 8-character hex/);
  });

  it("throws for invalid hex", () => {
    assert.throws(() => recoverColorOrbit("ZZZZZZZZ"), /valid hex/);
  });

  it("sets prime mode 73 for even offset, 37 for odd offset", () => {
    assert.equal(recoverColorOrbit("00000048").activePrimeMode, 73); // 72 % 2 = 0
    assert.equal(recoverColorOrbit("00000049").activePrimeMode, 37); // 73 % 2 = 1
  });
});

describe("Miquel Router — miquelDivmod36", () => {
  it("handles numeric input", () => {
    const r = miquelDivmod36(100);
    assert.equal(r.orbitQuotient, 2);
    assert.equal(r.offsetRemainder, 28);
  });

  it("handles hex string input", () => {
    const r = miquelDivmod36("FF");
    assert.equal(r.integerPayload, 255);
    assert.equal(r.orbitQuotient, 7);
    assert.equal(r.offsetRemainder, 3);
  });
});

describe("Miquel Router — Configuration", () => {
  it("returns 8_3_6_4 config by default", () => {
    const config = getMiquelConfiguration("8_3_6_4");
    assert.equal(config.points, 8);
    assert.equal(config.circles, 6);
    assert.equal(config.automorphisms, 48);
    assert.equal(config.symmetry, "OCTAHEDRAL");
  });

  it("returns 6_4_8_3 config", () => {
    const config = getMiquelConfiguration("6_4_8_3");
    assert.equal(config.points, 6);
    assert.equal(config.circles, 8);
    assert.equal(config.automorphisms, 128);
    assert.equal(config.symmetry, "TETRAHEDRAL");
  });

  it("falls back to 8_3_6_4 for unknown config", () => {
    const config = getMiquelConfiguration("unknown");
    assert.equal(config.points, 8);
  });
});

describe("Miquel Router — Voxel Compilation", () => {
  const mockSchema = {
    color_carrier_payload: { hex_string_32bit: "FF007C1E" },
    miquel_geometry_profile: { configuration_type: "8_3_6_4" },
  };

  it("compiles a voxel from schema instance", () => {
    const result = compileMiquelVoxel(mockSchema);
    assert.ok(result.elementColor.startsWith("#"));
    assert.equal(result.elementColor, "#FF007C");
    assert.ok(result.canonicalAddress.startsWith("omi-"));
    assert.equal(result.points, 8);
    assert.equal(result.circles, 6);
    assert.equal(result.symmetry, "OCTAHEDRAL");
    assert.ok(result.transylvaniaStepCode >= 0);
    assert.ok(result.transylvaniaStepCode < 14);
  });

  it("uses different multiplier for 6_4_8_3 config", () => {
    const schema = {
      color_carrier_payload: { hex_string_32bit: "00000048" },
      miquel_geometry_profile: { configuration_type: "6_4_8_3" },
    };
    const result = compileMiquelVoxel(schema);
    assert.equal(result.points, 6);
    assert.equal(result.circles, 8);
    assert.equal(result.symmetry, "TETRAHEDRAL");
  });
});

describe("Miquel Router — Class Interface", () => {
  it("exposes recoverColorOrbit through class", () => {
    const router = new OmiMiquelRouter();
    const result = router.recoverColorOrbit("00000048");
    assert.equal(result.orbitQuotient, 2);
  });

  it("exposes compileMiquelVoxel through class", () => {
    const router = new OmiMiquelRouter();
    const schema = {
      color_carrier_payload: { hex_string_32bit: "FF000000" },
      miquel_geometry_profile: { configuration_type: "8_3_6_4" },
    };
    const result = router.compileMiquelVoxel(schema);
    assert.ok(result.canonicalAddress.includes("omi-"));
  });
});
