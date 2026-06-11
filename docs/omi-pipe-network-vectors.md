# OmiPipe Network Transport Vectors

## Purpose

Prove OmiPipe is **transport-invariant**: the same canonical OmiPipe frame
produces the same deterministic receipt whether delivered through stdin, nc,
ncat, or socat.

## Canonical Receipt Fields (Compared)

These fields are compared across transports:

| Field        | Source   | Example                     |
|--------------|----------|-----------------------------|
| status       | receipt  | `accepted` / `reject` / `repair` / `parse-error` |
| scope        | stdout   | `0x7c00`                    |
| accept-seal  | stdout   | `0xaa55`                    |
| seal-byte    | stdout   | `0x55`                      |
| gauge-cell   | stdout   | `0x1035`                    |
| nomogram     | stdout   | `sexagesimal-60`            |
| nomogram-scale | stdout | `0x3c`                      |
| frame-bytes  | stdout   | `2`                         |
| control      | stdout   | `0x1c`                      |
| relation     | stdout   | `0x7c`                      |
| unit         | stdout   | `0x55`                      |
| car          | stdout   | `0xaa55`                    |
| cdr          | stdout   | `0x55aa`                    |
| cid          | stdout   | `0xffff`                    |
| repair-cid   | stdout   | `0xffff` (repair only)      |

## Fields NOT Compared (Ignored)

| Field  | Reason                                     |
|--------|--------------------------------------------|
| input= | Raw input line; quoting differs by transport |
| omi-pipe-summary | Aggregate line, not frame-level     |

## Vectors

### accept-basic

Single valid OmiPipe frame → accepted receipt.

```
Frame:     omi-0000-0035/001c/003c/007c/0055-imo?car=aa55;cdr=55aa;cid=ffff
Expected:  omi-receipt:accepted;scope=0x7c00;accept-seal=0xaa55;seal-byte=0x55;...
```

### accept-multi-line

Three valid frames piped sequentially → three accepted receipts.

### repair-cid-mismatch

Frame with car=cdr=cid 0x0000 but CID doesn't match → repair with suggested CID.

```
Frame:     omi-0000-0035/001c/003c/007c/0055-imo?car=aa55;cdr=55aa;cid=0000
Expected:  omi-repair:car-cdr-cid-mismatch:car=0xaa55;cdr=0x55aa;cid=0x0000;repair-cid=0xffff;scope=0x7c00
```

## Supported Transports

| Transport   | Script                         | Status       |
|-------------|--------------------------------|--------------|
| stdin       | `run-stdin-vector.sh`          | Baseline     |
| nc          | `run-busybox-nc-vector.sh`     | Must pass    |
| ncat        | `run-ncat-vector.sh`           | Must pass    |
| socat       | `run-socat-vector.sh`          | Must pass    |

Missing tools produce SKIP (not FAIL).

## Running

```bash
# All network tests (skips missing tools silently)
make test-omi-pipe-network

# Individual transport
make test-omi-pipe-network-stdin
make test-omi-pipe-network-nc
make test-omi-pipe-network-ncat
make test-omi-pipe-network-socat

# Stdin baseline only (hooked into verify-safe)
make test-omi-pipe-network-stdin

# Also always runs existing local pipe tests
make test-omi-pipe
```

## Failure Modes Tested

| Frame              | Expected Result |
|--------------------|-----------------|
| Unknown scale      | parse-error     |
| Out of pipe scope  | reject          |
| CID mismatch       | repair          |
| Malformed frame    | parse-error     |
| Multi-line stream  | accepted × N    |
