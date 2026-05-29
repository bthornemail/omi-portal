# eBPF/XDP Δ_C-Orbital Gate v0

**The eBPF/XDP gate rejects malformed Δ_C-orbital frames at the kernel boundary by evaluating the same quadratic surface Q(S)=0 used by JS, C99, and WASM.**

## Scope (v0)

- Accept only 16-byte canonical frame payloads
- Parse as big-endian uint16_t[8]
- Compute Q(S) = E_var + E_const
- Return XDP_PASS iff Q(S) = 0
- Return XDP_DROP iff Q(S) ≠ 0
- Do **not** run fanoTruthResolver yet
- Do **not** mutate ring cursor in kernel yet

This keeps eBPF as **Gate 1 only**. Gate 2 (Fano resolution) and CAS receipt (ring indexing) stay in userspace until the packet filter is proven stable.

## Wire Profile (profile.net)

| Bit Offset | Width | Field |
|------------|-------|-------|
| 0..31      | 32    | magic_guard (future use, currently 0x00000000) |
| 32..159    | 128   | Core vector S (16 bytes, big-endian uint16_t[8]) |
| 160..175   | 16    | Provenance tag (optional, default 0x0000) |

Total minimum: 144 bits (18 bytes) without magic guard; 176 bits (22 bytes) with guard.

## Branchless Quadratic Surface

```
E_var = (ll0 - ll3)² + (ll3 - ll4)² + (ll4 - ll7)²
E_const = (s0_lo)² + (s1 - 0x03BF)² + (s3_hi - 0x2B00)²
        + (s4_hi - 0x2F00)² + (s6 - 0x039F)² + (s7_lo - 0x00FF)²
Q(S) = E_var + E_const
```

PASS iff Q(S) = 0. DROP otherwise.

### Constant Delimiter Values

| Segment | Required Value | Rationale |
|---------|---------------|-----------|
| S[0] low byte  | 0x00          | LL-origin low byte zero |
| S[1]           | 0x03BF        | Chiral execution operator (ο) |
| S[3] high byte | 0x2B          | S3 header mask |
| S[4] high byte | 0x2F          | S4 header mask |
| S[6]           | 0x039F        | Cardinal boundary operator (Ο) |
| S[7] low byte  | 0xFF          | Closure boundary |

Free variables: S[2] (NNNN), S[5] (MMMM), S[0]/S[3]/S[4]/S[7] LL agreement.

## Build & Load

Requires `clang` with `bpf` target and `libbpf-dev` or `libbpf`:

```bash
clang -O2 -target bpf -c src/omi/ebpf/delta_orbital_gate.bpf.c \
  -o src/omi/ebpf/delta_orbital_gate.bpf.o

# Load via bpftool (XDP generic mode for testing)
bpftool net attach xdp generic dev lo \
  obj src/omi/ebpf/delta_orbital_gate.bpf.o sec xdp

# Verify loaded
bpftool prog list | grep omi_ingress_filter

# Detach
bpftool net detach xdp dev lo
```

## Conformance

The eBPF program must produce identical Q(S) outcomes as the JS reference implementation for all inputs. The test suite in `test/ebpf-delta-orbital-gate.test.js` validates this equivalence in userspace by mirroring the exact branchless arithmetic of the BPF program.
