# OmiPipe MCRSGSP Carrier

## Purpose

Prove that MCRSGSP fragment, frontier, request, and candidate messages can
ride inside OmiPipe frames without changing OMI receipt authority.

## Layer Boundary

```
MCRSGSP → fragment recovery and anti-entropy
OmiPipe → deterministic stream carrier
OMI Receipt → acceptance authority
```

**Doctrine**: Transport is not authority. Recoverability is not authority.
Receipt is authority.

## Message Types

| Type              | `t=` value             | Required Fields                          |
|-------------------|------------------------|------------------------------------------|
| Fragment          | `mcrsgsp-frag`         | id, idx, k, n, car, cdr, cid            |
| Frontier          | `mcrsgsp-frontier`     | peer, vv or cdr, cid                     |
| Request           | `mcrsgsp-request`      | id, missing, cdr, cid                    |
| Candidate         | `mcrsgsp-candidate`    | id, k, n, car, cdr, cid                 |

## CAR / CDR / CID Mapping

```
CAR = message payload / fragment body / candidate root
CDR = causal continuation / version vector / frontier
CID = witness checksum: car ^ cdr
```

All MCRSGSP carrier frames use scale `0x3F` (Omi-Nomogram lfsr-period).

## Address Pattern

```
omi-<x>-<y>/<control>/<scale>/<relation>/<unit>-imo?<query>
```

Canonical MCRSGSP carrier address:
```
omi-0000-0035/001c/003f/007c/aa55-imo?t=mcrsgsp-frag;...
```

Where:
- `0000-0035` = gauge coordinates (x=0x00, y=0x35 → seal=0x55)
- `001c` = local frame scope
- `003f` = lfsr-period / MCRSGSP carrier nomogram scale
- `007c` = readable pipe relation marker (0x007C → 0x7C00)
- `aa55` = acceptance seal unit (low byte 0x55)

## Canon

OmiPipe carries MCRSGSP fragment, frontier, request, and candidate messages
as deterministic CAR/CDR/CID frames; MCRSGSP repairs missing fragments,
transport remains invariant across pipes, and only OMI receipts accept
state.

## Receipt Fields

### Accepted fragment
```
omi-receipt:accepted;scope=0x7c00;accept-seal=0xaa55;seal-byte=0x55;
  gauge-cell=0x1035;nomogram=lfsr-period;nomogram-scale=0x3f;
  frame-bytes=2;control=0x1c;relation=0x7c;unit=0x55;
  car=0xdead;cdr=0xbeef;cid=0x6042;
  type=mcrsgsp-frag;id=abc123;idx=2;k=3;n=5;vv=nodeA:4,nodeB:2
```

### Rejected (missing id)
```
omi-reject:missing-codeword-id;type=mcrsgsp-frag;scope=0x7c00
```

### Repaired (CID mismatch)
```
omi-repair:car-cdr-cid-mismatch;type=mcrsgsp-frag;
  car=0xdead;cdr=0xbeef;cid=0x0000;repair-cid=0x6042;scope=0x7c00
```

## Test Vectors

| Vector                   | Frame                              | Expected     |
|--------------------------|------------------------------------|--------------|
| frag-basic               | valid fragment, id+idx+k+n+vv     | accepted     |
| frontier-basic           | valid frontier, peer+vv            | accepted     |
| request-missing          | valid request, id+missing          | accepted     |
| candidate-basic          | valid candidate, id+k+n+car        | accepted     |
| reject-malformed-frag    | frag without id                    | reject       |
| repair-frag-cid-mismatch | frag with wrong cid                | repair       |

## Failure Modes

**Reject**:
- unknown mcrsgsp type
- missing codeword id (frag, request, candidate)
- missing or invalid fragment index (frag)
- k > n (frag, candidate)
- idx >= n (frag)
- missing peer id (frontier)
- missing version vector (frontier)
- missing missing-indices (request)
- missing CAR for candidate
- invalid scale outside 0x30–0x3F
- relation outside pipe scope (=0x7x)
- acceptance seal failure

**Repair**:
- CID mismatch (car ^ cdr != cid) → suggests repair-cid

**Accept**:
- well-formed message with valid scale, pipe scope, and witness triple

## Running

```bash
# Local stdin baseline (hooked into verify-safe)
make test-omi-pipe-mcrsgsp

# Full transport matrix (nc + ncat + socat)
make test-omi-pipe-mcrsgsp-network
```

## Relationship to Other Layers

- **OmiPipe network vectors**: same transport invariance (stdin/nc/ncat/socat
  produce identical receipts) applies to MCRSGSP carrier frames
- **MCRSGSP anti-entropy**: this layer carries MCRSGSP wire messages but
  does not perform fragment recovery, frontier reconciliation, or
  reconstruction
- **Next branch** (omi-pipe-mcrsgsp-reconstruction): consumes k-of-n
  fragment carrier frames, tracks frontiers, detects RS-sufficient subsets,
  emits candidate receipts
