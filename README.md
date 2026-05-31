# OMI Portal

**v1.0.0-RC1 Consumer/Provider Edition**  
**934 verified invariants · 166 production modules · eBPF/XDP · QEMU TYPE_CLOCK · Wallis–Neugebauer notation**

OMI Portal is a protocol runtime for turning addresses, packets, documents, clocks, and browser pages into **verifiable reference states**.

At the center of OMI is the **OMI address pointer**:

```text
omi-<s0>-<s1>-<s2>-<s3>-<s4>-<s5>-<s6>-<s7>/<prefix>
```

Each OMI pointer is an 8-segment, 128-bit reference frame. It can point to a packet, rule, service, memory slot, symbolic fact, visual node, clock state, or page boundary.

OMI is designed so that both humans and machines can ask:

```text
What is this?
Where does it belong?
What rule validates it?
What runtime owns it?
Can it be replayed, verified, or rejected?
```

---

## 1. Why OMI Exists

Most systems separate addresses, data, metadata, rules, logs, and UI state.

OMI treats them as one addressable object:

```text
address → rule → runtime state → visual projection → audit trail
```

That means an OMI pointer can be used as:

* a network frame
* a memory receipt
* a semantic reference
* a JSON Canvas node ID
* a CSS selector target
* a cron/clock state
* an eBPF packet signature anchor
* a page-framing boundary

The goal is not just to store data. The goal is to make every important state **referencable, inspectable, replayable, and rejectable**.

---

## 2. Quick Example: OMI Address as a Reference Pointer

A canonical OMI pointer looks like:

```text
omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48
```

You can read it as:

```text
omi          protocol namespace
0100         opening / local frame selector
03bf         chiral delimiter / OMI structural marker
7c00         boot / payload / current register field
2b01         typed transition segment
2f01         paired transition segment
1434         free variable / payload segment
039f         cardinal closure marker
01ff         terminal closure / suffix field
/48          prefix scope
```

In code, docs, CSS, and packets, this pointer should remain stable. It is not just a label. It is a compact structural reference.

---

## 3. The OMI Address Model

### 3.1 Address Shape

```text
omi-s0-s1-s2-s3-s4-s5-s6-s7/prefix
```

Each `sN` is a 16-bit hexadecimal segment:

```text
s0 = segment 0
s1 = segment 1
s2 = segment 2
s3 = segment 3
s4 = segment 4
s5 = segment 5
s6 = segment 6
s7 = segment 7
```

Together:

```text
8 segments × 16 bits = 128 bits
```

The `/prefix` works like CIDR notation:

```text
/48   local canonical frame
/80   rule-family boundary
/96   gateway / mapped-prefix boundary
/112  narrow rule/register boundary
/128  exact object pointer
```

### 3.2 OMI Pointer Roles

| Pointer Type   |            Example | Meaning                                  |
| -------------- | -----------------: | ---------------------------------------- |
| Exact object   |      `omi-.../128` | One exact state or rule                  |
| Rule family    |      `omi-.../112` | A narrow invariant class                 |
| Gateway prefix |       `omi-.../96` | Translation or embedding boundary        |
| Local frame    |       `omi-.../48` | Canonical runtime frame                  |
| Visual target  | `[id$="-.../128"]` | CSSOM selector for a page/canvas element |

---

## 4. Consumer Guide: How to Use OMI

A **consumer** is anyone reading, viewing, scanning, verifying, or interacting with OMI output.

You do not need to understand every kernel to use OMI. You need to know three things:

```text
1. OMI pointers identify states.
2. Rules explain why a state is valid.
3. Tests/builds prove the implementation still agrees with the rules.
```

### 4.1 Reading an OMI Pointer

Given:

```text
omi-0000-0000-0000-0000-0000-0000-00eb-0066/112
```

Read it as:

```text
This is an OMI rule/register pointer.
The suffix 00eb-0066 identifies the eBPF/XDP link-layer parsing gate.
The /112 scope means this is a narrow infrastructure rule boundary.
```

### 4.2 Reading OMI Visuals

OMI pages and canvases use addresses as IDs:

```html
<svg id="omi-0000-0000-0000-0000-0000-0000-00eb-0066/112"></svg>
```

CSS can target that address directly:

```css
[id$="-00eb-0066/112"] {
  stroke: #ffaa00;
}
```

This means the visual layer is not arbitrary styling. It is a projection of the protocol rule space.

### 4.3 Consumer Safety Rule

Consumers should trust a state only when all three agree:

```text
OMI pointer exists
→ rule exists
→ test/build confirms it
```

For example, the current documentation baseline references a verified 934-invariant state and 166 production modules.

---

## 5. Provider Guide: How to Publish OMI-Compatible State

A **provider** is a service, runtime, page, node, VM, packet source, or application that emits OMI-addressed state.

A provider should publish:

```text
1. OMI pointer
2. Rule binding
3. Validation behavior
4. Runtime location
5. Visual or telemetry projection
```

### 5.1 Provider Checklist

For every new OMI subsystem, create:

```text
src/.../<kernel>.js           implementation
test/<kernel>.test.js         regression tests
docs/01-physical/FACTS.omi    rule pointer
public/bidi.css               optional visual selector
Makefile                      optional test target
README.md / docs              human explanation
```

### 5.2 Provider Contract

A provider MUST be able to answer:

```text
What OMI address identifies this subsystem?
What does this address validate?
What happens on success?
What happens on failure?
Where is the test?
Where is the rule?
Where is the visual/telemetry projection?
```

Example:

```text
Subsystem: eBPF/XDP signature gate
Rule: 0x12D–0x12F
Pointer: omi-0000-0000-0000-0000-0000-0000-00eb-0066/112
Source: src/ebpf/ebpf-pipeline.bpf.c
Test: test/ebpf-pipeline.test.js
Output: BPF telemetry map + packet pass/drop
```

The eBPF pipeline and cluster signature gateway are documented as the current kernel-acceleration milestone, including a 64-bit Delta Law signature and telemetry-map bridge.

---

## 6. Core Subsystems

### 6.1 eBPF/XDP Packet Signature Gate

OMI can compile a kernel-space packet gate that validates packet signatures before user-space receives them.

```text
Raw packet
→ XDP hook
→ Delta Law signature
→ BPF telemetry map
→ pass/drop decision
```

Reference pointer:

```text
omi-0000-0000-0000-0000-0000-0000-00eb-0066/112
```

Source:

```text
src/ebpf/ebpf-pipeline.bpf.c
src/omi/cluster-packet-kernel.js
```

Use when you need:

```text
low-latency packet validation
WAN telemetry
cluster signature tracking
kernel-space filtering
```

### 6.2 IPv6 Source Address Frame

OMI can treat an IPv6 source address as the 128-bit instruction frame.

```text
IPv6 saddr
→ uint16[8]
→ OMI frame
→ Q(S)=0 validation
→ Delta/Fano resolution
```

The wire profile uses `profile.net.v0`, offset `0x16`, and the canonical genesis address `0100:03bf:7c00:2b01:2f01:1434:039f:01ff`.

### 6.3 Factorial Replay Ring

OMI uses a 5040-slot replay ring:

```text
5040 = 7!
```

Each slot stores a compact receipt:

```text
provenance:16 | steps:8 | LL:8 | NN:16 | MM:16
```

Use this when you need deterministic replay, bounded state history, or concurrency-safe receipt storage.

### 6.4 Tetragrammaton Scheduler

OMI schedules typed nodes over:

```text
7 Fano points
12 regular divisors of 60
Text / Link / Group / File node roles
```

Use this when you want time-sliced node evaluation that aligns with base-60 intervals.

### 6.5 QEMU TYPE_CLOCK Model

OMI models QEMU clock-tree state using:

```text
period integer
2^-32 ns unit
0 = gated / inactive
```

This lets the runtime represent emulated hardware clock state as an OMI-addressable object. The QEMU clock milestone explicitly maps `TYPE_CLOCK` periods, gated zero states, and Canvas preset outputs.

### 6.6 Wallis–Neugebauer Notation

OMI includes a notation kernel for positional base-60 structure:

```text
Wallis integer multiples
Neugebauer fractional slots
Hex-N to Hex-(N-1) encapsulation
```

The canonical rule text uses `Hex-N to Hex-(N-1)` and avoids leaking literal `-0x` notation into production selector grammar.

---

## 7. OMI Addressing as Reference Pointers

### 7.1 Rules as Pointers

Every rule should have a pointer:

```text
omi-0000-0000-0000-0000-0000-0000-00eb-0066/112
```

This says:

```text
The rule is addressable.
The rule can be targeted by tests.
The rule can be targeted by CSS.
The rule can be referenced by docs.
The rule can be emitted in telemetry.
```

### 7.2 Runtime Objects as Pointers

A runtime object should expose:

```json
{
  "id": "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48",
  "type": "TypedOmiNode",
  "state": "accepted",
  "rule": "delta-orbital-lexer-invariant"
}
```

### 7.3 Pages as Pointers

An OMI page can use an iframe boundary:

```html
<iframe id="omi-64:ff9b::/96"></iframe>
```

This marks the page as NAT64-aware:

```text
64:ff9b::/96 = NAT64 well-known prefix
first 96 bits = bridge prefix
last 32 bits  = embedded IPv4 address
```

### 7.4 CSS as Pointer Resolution

```css
[id$="-03bf-0001-0000-039f/128"] {
  stroke: #ffaa00;
}
```

This means:

```text
When a page contains this OMI pointer,
render it as the matching protocol state.
```

---

## 8. How to Install

```bash
npm install
```

For eBPF/XDP work, install a clang toolchain with BPF target support and Linux headers.

Example requirement:

```text
clang 14+
linux-headers matching host kernel
bpftool optional for verifier/load checks
```

---

## 9. How to Build and Verify

### 9.1 Compile eBPF Objects

```bash
make compile-ebpf-gate
```

This should build:

```text
dist/ebpf/ebpf-pipeline.o
dist/delta_orbital_gate.o
```

The full test suite may expect the eBPF object to exist, so compile it before running all tests. The latest notation milestone explicitly rebuilt the eBPF object before running the full test suite.

### 9.2 Run Tests

```bash
npm test
```

Expected current baseline:

```text
934/934 passing
0 failures
```

### 9.3 Build Production Bundle

```bash
npm run build
```

Expected current baseline:

```text
166 code-split modules
```

---

## 10. How to Add a New OMI Kernel

### Step 1 — Choose the Address

Pick an unused rule pointer:

```text
omi-0000-0000-0000-0000-0000-0000-abcd-0001/112
```

### Step 2 — Add a Rule

```text
# [Rule 0xXYZ]: Human Readable Rule Name
# Explain what must be true.
omi-0000-0000-0000-0000-0000-0000-abcd-0001/112 MUST enforce-your-new-invariant
```

### Step 3 — Implement the Kernel

```text
src/omi/your-kernel.js
```

Suggested shape:

```js
export class OmiYourKernel {
  evaluate(S, input) {
    // 1. validate S
    // 2. evaluate rule
    // 3. return accepted/rejected state
  }
}
```

### Step 4 — Add Tests

```text
test/your-kernel.test.js
```

Minimum tests:

```text
valid frame accepted
invalid frame rejected
rule-specific success path
rule-specific failure path
```

### Step 5 — Add CSS Selector

```css
[id$="-abcd-0001/112"] {
  stroke: #ffaa00;
}
```

### Step 6 — Add Documentation

Document:

```text
what it is
why it exists
how consumers use it
how providers emit it
what pointer identifies it
what tests verify it
```

---

## 11. Consumer Examples

### 11.1 Verify a Pointer Exists

```bash
grep "00eb-0066" docs/01-physical/FACTS.omi
```

### 11.2 Find Its Visual Rule

```bash
grep "00eb-0066" public/bidi.css
```

### 11.3 Run Its Test

```bash
node --test test/ebpf-pipeline.test.js
```

---

## 12. Provider Examples

### 12.1 Emit a JSON Canvas Node

```json
{
  "id": "omi-0000-0000-0000-0000-0000-0000-00eb-0066/112",
  "type": "text",
  "text": "eBPF/XDP packet parsing gate",
  "x": 0,
  "y": 0,
  "width": 480,
  "height": 160,
  "color": "6"
}
```

### 12.2 Emit a Telemetry Event

```json
{
  "event": "omi.telemetry.packet",
  "id": "omi-0000-0000-0000-0000-0000-0000-00eb-0066/112",
  "accepted": true,
  "signature": "0xa270ca70",
  "slot": 1504
}
```

### 12.3 Emit a DOM Element

```html
<section
  id="omi-0000-0000-0000-0000-0000-0000-00eb-0066/112"
  data-omi-role="xdp-ingress-gate"
  color="6">
  eBPF/XDP Gate
</section>
```

---

## 13. Directory Map

```text
docs/        canonical rule and specification layers
src/omi/     core OMI kernels
src/canvas/  JSON Canvas, Code16K, JABCode, page framing
src/ebpf/    eBPF/XDP kernel programs
src/wan/     WAN telemetry and distributed runtime loops
public/      browser surfaces and CSSOM selectors
test/        regression tests
prolog/      logic facts and symbolic inference support
dev-docs/    deeper mathematical and developer onboarding docs
```

The project has also used a Tetragrammatron-style developer documentation map with SPO-named face folders and beginner/intermediate/expert README tiers.

---

## 14. Glossary

| Term           | Meaning                                                     |
| -------------- | ----------------------------------------------------------- |
| OMI pointer    | 128-bit address reference in `omi-.../prefix` form          |
| `S`            | 8-segment instruction frame                                 |
| `Q(S)=0`       | Branchless structural acceptance gate                       |
| `Δ_C`          | Delta Law transition function                               |
| Fano point     | One of seven projective selector positions                  |
| TypedOmiNode   | Text, Link, Group, or File node in the Tetragrammaton model |
| FACTS.omi      | Rule registry for OMI invariants                            |
| CSSOM selector | Browser-side visual projection of an OMI pointer            |
| SAB            | SharedArrayBuffer runtime memory                            |
| XDP            | eBPF fast path for packet ingress                           |
| NAT64          | IPv6-to-IPv4 bridge prefix, commonly `64:ff9b::/96`         |
| TYPE_CLOCK     | QEMU clock object model for emulated period/gating state    |

---

## 15. Current Release State

```text
Version: v1.0.0-RC1
Tests: 934/934 passing
Build: 166 modules
Kernel path: eBPF/XDP enabled after make compile-ebpf-gate
Addressing model: OMI pointer / IPv6-CIDR-style 128-bit frame
Consumer model: read, scan, verify, route, visualize
Provider model: emit pointer, bind rule, expose test, project state
```

---

## 16. Project Philosophy

OMI is built around a simple idea:

```text
Every meaningful state should have an address.
Every address should have a rule.
Every rule should have a test.
Every test should be replayable.
Every replayable state should be visible.
```

That is why OMI uses address pointers everywhere: in packets, rules, CSS, Canvas nodes, telemetry, clocks, and documents.
