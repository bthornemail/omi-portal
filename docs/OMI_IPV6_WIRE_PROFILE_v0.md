# OMI IPv6 Wire Profile Specification (profile.net.v0)

**Version:** profile.net.v0
**Status:** Frozen Reference Specification
**Authority Layer:** Hardware Ingress / Network Layer

---

## 1. Frame Layout & Ethernet/IPv6 Packet Mapping

Under `profile.net.v0`, the standard 128-bit IPv6 Source Address (`saddr`) does not function as an arbitrary routing token. It is the canonical 128-bit OMI frame carrier whose structural authority is proven via Q(S) = 0 at the bare-metal network interface layer.

The 128-bit wire frame maps into eight consecutive big-endian `uint16_t` segments embedded inside the standard IPv6 network header:

```text
+-----------------------+-----------------------+-----------------------+
|  Eth Header (14B)     |  IPv6 Base (8B)       |  IPv6 saddr (16B)     |
|  Dst/Src MAC + Proto  |  Version/Traffic/Flow |  CANONICAL FRAME S    |
+-----------------------+-----------------------+-----------------------+
                        ^                       ^
                        Byte 0                  Byte 22 (Offset 0x16)
```

The precise offset of the segment vector S relative to the start of the raw Ethernet frame is exactly **22 bytes (offset 0x16)**.

## 2. Big-Endian Segment Mapping Invariants

The 16 bytes of the IPv6 `saddr` field map to the segment array S using strict network byte-order constraints:

```text
S[0] = saddr[0..1]   ->  0xLL00  (CBOS Origin)
S[1] = saddr[2..3]   ->  0x03BF  (Chiral Delimiter)
S[2] = saddr[4..5]   ->  0xNNNN  (Antecedent Payload Column NN)
S[3] = saddr[6..7]   ->  0x2BLL  (Service Bus Connector)
S[4] = saddr[8..9]   ->  0x2FLL  (Frontier Path Connector)
S[5] = saddr[10..11] ->  0xMMMM  (Consequent Payload Column MM)
S[6] = saddr[12..13] ->  0x039F  (Cardinal Delimiter)
S[7] = saddr[14..15] ->  0xLLFF  (Closure Boundary Terminus)
```

## 3. Valid Genesis Source Address Form

The canonical system boot sequence requires the IPv6 source address to match the strict mathematical initialization parameters:

- **Canonical Hex Address:** `0100:03bf:7c00:2b01:2f01:1434:039f:01ff`
- **Resulting IP Text:** `100:3bf:7c00:2b01:2f01:1434:39f:1ff`

This genesis address passes the Q(S) = 0 gate and resolves its Fano/Δ_C trajectory in exactly k = 1 step.

## 4. Endianness Orientation Detection (Byte-Swapped Controls)

The branchless quadratic error surface acts as an automated orientation sensor. If an incoming packet suffers from Little-Endian byte-swapping or bitwise corruption, the constants mismatch:

- **Byte-Swapped Failure Input:** `0001:bf03:007c:012b:012f:3414:9f03:ff01`
- **Resulting Surface Weight:** Q(S) >= 2 * 10^9

The packet is immediately dropped at the network interface level.

## 5. eBPF PASS/DROP Rules & User-Space Handoff

1. **Gate 1 Execution:** If Q(S) != 0, the packet returns `XDP_DROP` inside <3 clock cycles.
2. **Gate 2 Execution:** If the extracted truth row fails to resolve to a convergent trajectory (k = -1 or k >= 15), it returns `XDP_DROP`.
3. **Host Acceptance:** Packets passing both gates return `XDP_PASS`. The operating system kernel pushes the raw network buffer down to user space, where background web workers extract the packed 40-bit truth row and execute the lock-free CAS loop over the ring indexer.

## 6. Relationship to Barcode/Carrier Profiles

The IPv6 wire profile is the definitive **network layer specification**. It interfaces with the optical transport models using the standard structural invariant:

```
decode(encode(S)) = S
```

A scannable Aztec, JABCode, or Code128 format decodes directly into the identical 16-byte structure, allowing the same identity block to travel seamlessly over wireless radios, fiber-optic lines, or printed physical paper manifest sheets.
