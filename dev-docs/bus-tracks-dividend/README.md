# Face 8 — bus tracks dividend

**Hardware Metadata — 24-Bit Spare Dividend Tracking**

## 🟢 What

Every receipt in the atomic ledger packs 64 bits. The upper 24 bits — **provenance (16 bits) + steps (8 bits)** — form the **metadata dividend**: spare tracking capacity that identifies the source and proof of each committed frame.

This face manages the hardware buses that generate and consume these dividends:

1. **WebSerial bus (::10)** — serial CDC/SPP devices for ESP32-class microcontrollers
2. **WebUSB bus (::11)** — USB vendor-class devices (custom firmware, FPGAs)
3. **WebHID bus (::12)** — HID report descriptors (keyboards, sensors, badges)
4. **Tri-tier network** — three physical tiers mapped to ring slots:
   - Tier 1 (ESP32) → slot stride 720
   - Tier 2 (Edge adapter) → slot stride 1440
   - Tier 3 (VPS cloud) → slot stride 5040
5. **Boot compiler** — 512-byte MBR sector with 0xAA55 signature, boot table (0x7C00–0x7F00), and extended execution surface (0x7F01–0xAA55)

The **24-bit dividend** space:

```
Bit position:  63  62 ... 48 | 47  46 ... 40 | 39 ... 0
Field:         [ provenance ] | [   steps   ] | [ LL | NN | MM ]
Size:              16 bits    |    8 bits     |    40 bits
```

## 🔵 How

### Source file map

| File | Role |
|------|------|
| `src/web/hardware-bus.js` | `OmiHardwareBus` — WebSerial/USB/HID device lifecycle, ASCII opcode dispatch (0x00 NUL–0x1F US), polytope slot buffer |
| `src/web/tri-tier-network.js` | `OmiTriTierNetworkEngine` — 3-tier parse, `compileTransitFrame()` — 16-byte binary packet, tier→slot mapping |
| `src/web/polytope-webgl.js` | 3D position from packed 4D coordinates, Three.js BufferGeometry, factorial HUD overlay |
| `src/runtime/boot-compiler.js` | `OmiBareMetalBootCompiler` — 512-byte MBR compile, 0xAA55 signature, boot address range validation |
| `src/web/hardware-peripheral-engine.js` | `OmiHardwarePeripheralEngine` — peripheral address parse, ASCII opcode routing, coefficient extraction |

### ASCII opcode dispatch

```javascript
// ASCII_OPCODES — maps control characters to hardware operations
const ASCII_OPCODES = Object.freeze({
  0x00: "NUL",  0x01: "SOH",  0x02: "STX",  /* ... */  0x1F: "US"
});

// ASCII_HARDWARE_BUS — routes opcodes to hardware ports
const ASCII_HARDWARE_BUS = Object.freeze({
  serial:  { cdc: 0x01, spp: 0x02 },
  usb:     { vendor: 0x03 },
  hid:     { descriptor: 0x04 }
});
```

### Tri-tier transit frame

```javascript
// 16-byte binary packet layout:
// [0]    = opcode (ASCII control code)
// [1]    = tier identifier (1=ESP32, 2=Edge, 3=VPS)
// [2-3]  = clock tick (uint16, modulo 5040)
// [4-9]  = coefficients (6 bytes)
// [10-13]= payload (4 bytes)
// [14-15]= 0xAA55 footer

function compileTransitFrame(address, payload) {
  const buf = Buffer.alloc(16);
  buf.writeUInt8(address.opcode, 0);
  buf.writeUInt8(address.tier, 1);
  buf.writeUInt16BE(address.clockTick, 2);
  // ... pack coefficients ...
  buf.writeUInt16BE(0xAA55, 14);  // boot signature footer
  return buf;
}
```

### Test tour

| Test file | What it verifies |
|-----------|-----------------|
| `test/hardware-bus.test.js` | Bus construction (serial/usb/hid), mock device I/O, polytope slot storage, peripheral address parsing |
| `test/tri-tier-network.test.js` | ESP32/adapter/VPS tier parsing, transit frame compilation, tier→slot mapping |
| `test/polytope-webgl.test.js` | 3D coordinate unpacking, factorial HUD, page names |
| `test/softmmu-system.test.js` | MBR boot sector validation, boot table/extended surface address parsing |
| `test/boot-compiler.test.js` | Boot compiler construction, MBR compile/parse, payload decoding |

## 🔴 Extend

### FACTS.omi rules

- **Rule 0x72**: Boot memory boundaries at 0x7C00 and 0x7F00 MUST be enforced
- **Rule 0x73**: 0xAA55 signature MUST terminate valid boot sectors
- **Rule 0x74**: Omicron transit frames MUST include valid provenance tag

### Extension points

- **New hardware bus**: Add a bus ID (::13+) to `OMI_SEMANTIC_SERVICE_BUSES` in `fano-prolog.js`. Implement `requestDevice`, `open`, `write` following the `OmiHardwareBus` pattern.
- **Custom opcode map**: Extend `ASCII_OPCODES` with application-specific control codes in the 0x20–0x3F range. Must not conflict with the 0x00–0x1F standard range.
- **Tier routing override**: Change the `slotFromTier` mapping for custom deployment topologies (e.g., map ESP32 to slot stride 5040 for high-frequency log ingestion).

### Performance constraints

- All hardware bus operations are async (Web serial/USB/HID APIs are promise-based).
- Transit frame compilation is O(1) — fixed 16-byte buffer, no heap allocation.
- Boot sector compilation allocates exactly one 512-byte `Buffer.alloc(512)` — zero fragmentation.
