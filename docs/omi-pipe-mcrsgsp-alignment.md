# OmiPipe and MCRSGSP Layer Alignment

Streaming Frames, Erasure-Coded Fragments, Anti-Entropy Repair, and Receipt Authority

## 0. Core Decision

OmiPipe and MCRSGSP do not conflict.

They belong to different layers.

- OmiPipe  = streaming carrier / pipe protocol / route surface
- MCRSGSP  = fragment storage / erasure-coded recovery / gossip substrate
- OMI      = validation, resolution, receipt, projection authority

The correct relationship is:

    OmiPipe carries frames.
    MCRSGSP carries fragments.
    OMI accepts objects.

Therefore neither protocol replaces the other.

They compose.

---

## 1. Layer Roles

### OmiPipe

OmiPipe answers:

- Can this frame move through a pipe?
- Can this stream be parsed deterministically?
- Can this transition produce a valid receipt?
- Can a route self-heal when the pipe fails?

OmiPipe is about:

- stdin / stdout / stderr
- ncat / socat / TCP / Unix pipes
- frame grammar
- CAR / CDR / CID
- 0x1C00 frame scope
- 0x7C00 runtime pipe scope
- 0xAA55 acceptance seal
- receipt emission
- route repair

### MCRSGSP

MCRSGSP answers:

- Can this object be recovered from fragments?
- Which fragments are missing?
- Is this subset causally closed?
- Is this subset RS-sufficient?
- Can gossip repair fragment loss?

MCRSGSP is about:

- Reed-Solomon fragments
- codeword identity
- fragment index
- version vectors
- causal closure
- gossip frontiers
- anti-entropy repair
- candidate reconstruction
- monotone fragment growth

### OMI Receipt

OMI answers:

- Is the reconstructed candidate valid?
- Does the frame resolve?
- Does the relation agree?
- Can the object be accepted?
- Can it be replayed and projected?

OMI is about:

- validated address
- truth-row resolution
- Delta/Fano proof
- Omi-Gauge cell
- Omi-Nomogram scale
- Omi-CONS payload
- receipt
- projection

---

## 2. No Conflict Boundary

The possible confusion is this:

- MCRSGSP has repair.
- OmiPipe has self-healing.

But they repair different failures.

MCRSGSP repair:

- fragment missing
- frontier divergence
- causal subset incomplete
- RS reconstruction unavailable

OmiPipe repair:

- route dead
- pipe failed
- frame malformed
- peer unavailable
- latency high
- CID mismatch on path
- projection route failed

So:

- MCRSGSP repairs missing fragments.
- OmiPipe repairs broken paths.

They are complementary.

---

## 3. Candidate vs Accepted Object

- MCRSGSP reconstructs candidates.
- OmiPipe transports candidates.
- OMI accepts or rejects candidates.

Canonical flow:

    fragment gossip
    → causal closure
    → RS reconstruction
    → candidate
    → OmiPipe frame
    → OMI validation
    → receipt
    → projection

The candidate is not authority.

The receipt is authority.

Canon:

> Recoverability is not acceptance.
> Transport is not acceptance.
> Receipt is acceptance.

---

## 4. How MCRSGSP Fits Inside OmiPipe

A MCRSGSP fragment can be carried as an OmiPipe payload.

Readable frame:

    omi-<frame>/<control>/<scale>/<relation>/<unit>-imo?car=<fragment>;cdr=<frontier>;cid=<checksum-or-witness>

Mapping:

- CAR = fragment payload or fragment summary
- CDR = causal continuation / version-vector frontier / missing-fragment request
- CID = checksum, signature, or reconstruction witness

Example conceptual frame:

    omi-0000/001c/003c/7c00/aa55-imo?car=fragment:codeword.index.payload;cdr=vv:nodeA=4,nodeB=2;cid=sha256:...

Meaning:

- This pipe frame carries one fragment or fragment-related event.
- The fragment remains MCRSGSP data.
- The frame remains OmiPipe transport.
- The receipt remains OMI authority.

---

## 5. How OmiPipe Fits Under MCRSGSP

MCRSGSP currently describes what nodes exchange:

- fragments
- frontiers
- summaries
- requests
- anti-entropy repairs

OmiPipe can become one transport format for those exchanges.

So instead of only saying:

> Node A sends fragment to Node B.

the implementation may say:

> Node A writes an OmiPipe frame.
> Node B parses the frame.
> Node B stores the fragment if causally admissible.
> Node B emits receipt or reject.

This makes MCRSGSP portable over:

- BusyBox nc
- ncat
- socat
- Unix pipes
- TCP streams
- QUIC streams
- WebStreams
- service-worker MessagePorts
- serial links

Canon:

> MCRSGSP defines what is being synchronized.
> OmiPipe defines a minimal stream form for moving it.

---

## 6. Anti-Entropy vs Geometry Repair

MCRSGSP anti-entropy repair asks:

> What fragments are you missing?

OmiPipe geometry repair asks:

> Which path can still carry the frame lawfully?

Together:

- If a peer lacks fragments, MCRSGSP repairs content.
- If a route fails, OmiPipe repairs path.
- If a candidate reconstructs, OMI validates and receipts it.

Unified repair pipeline:

    detect failure
    → classify as path failure or fragment failure
    → if path failure: OmiPipe repair
    → if fragment failure: MCRSGSP anti-entropy
    → if candidate rebuilt: OMI receipt

Canon:

> Path repair and fragment repair must not be collapsed.

---

## 7. Causality Alignment

MCRSGSP uses version vectors.

OmiPipe uses receipt chains and frame order.

These are compatible because neither requires wall-clock time as authority.

MCRSGSP causality:

    V <= W iff every component of V is <= W

OmiPipe causality:

    accepted frame → receipt → next frame references receipt

The bridge is:

- version vector frontier can be carried in CDR
- receipt root can be carried in CID

So:

- CDR = causal continuation
- CID = agreement witness

Canon:

> MCRSGSP version vectors describe fragment causality.
> OmiPipe receipts describe stream acceptance causality.

---

## 8. Addressing Alignment

MCRSGSP fragment identity:

    (codeword_id, version_vector, fragment_index)

OmiPipe address identity:

    omi-<frame>/<control>/<scale>/<relation>/<unit>-imo

Bridge mapping:

- frame    = codeword namespace or object frame
- control  = fragment/control type
- scale    = Omi-Nomogram transport or repair scale
- relation = fragment index / edge / frontier relation
- unit     = acceptance / reconstruction / fragment unit

The fragment identity should not be destroyed.

It should be carried inside Omi-CONS:

    CAR = codeword_id + fragment_index + payload
    CDR = version_vector + causal frontier
    CID = checksum/signature/reconstruction witness

Canon:

> OmiPipe frames can carry MCRSGSP fragment identity without replacing it.

---

## 9. Receipt Boundary

The core agreement is:

- MCRSGSP has no canonical global state.
- OmiPipe has no authority by itself.
- OMI receipt decides accepted object state.

That gives the correct authority ladder:

    fragment observed
    → fragment stored
    → fragment gossiped
    → candidate reconstructed
    → OMI frame validated
    → receipt accepted
    → projection materialized

Rejected candidates may remain recoverable fragments.

Accepted receipts become replayable OMI state.

Canon:

> MCRSGSP may preserve many candidates.
> OMI may accept one or more receipted projections.
> The storage layer does not decide semantic truth.

---

## 10. eBPF / Edge Probe Alignment

MCRSGSP does not require eBPF.

OmiPipe may optionally use eBPF or XDP as an edge probe.

This does not change protocol semantics.

Allowed eBPF roles:

- classify OmiPipe traffic
- count malformed frames
- rate-limit floods
- measure latency
- export telemetry
- protect receiver

Forbidden eBPF roles:

- accepting OMI state
- rewriting fragments as authority
- bypassing receipt
- executing payload
- changing candidate semantics

Canon:

> eBPF observes and protects transport.
> MCRSGSP repairs fragments.
> OMI receipts accept objects.

---

## 11. Unified Pipeline

The complete integrated stack is:

    OmiPipe stream receives frame
      ↓
    frame parser extracts address + CAR/CDR/CID
      ↓
    if CAR/CDR contains MCRSGSP fragment:
      store fragment
      update frontier
      perform causal closure check
      request missing fragments if needed
      attempt RS reconstruction if RS-sufficient
      emit candidate
      ↓
    OMI validates candidate frame
      ↓
    Delta/Fano/Omi-Gauge/Omi-Nomogram resolution
      ↓
    0xAA55 acceptance seal
      ↓
    receipt
      ↓
    projection / replay / materialization

Compact:

> pipe carries
> gossip repairs
> RS reconstructs
> OMI accepts
> projection displays

---

## 12. Recommended Cross-References

### Add to OmiPipe Spec

> MCRSGSP fragments are valid Omi-CONS payloads. OmiPipe may carry MCRSGSP fragment messages, frontier summaries, anti-entropy requests, and reconstruction candidates as CAR/CDR/CID payloads. OmiPipe transport does not make those candidates authoritative; OMI receipt remains the acceptance boundary.

### Add to MCRSGSP Spec

> OmiPipe is a compatible streaming carrier for MCRSGSP fragment exchange. An implementation may serialize fragment messages, frontier summaries, and anti-entropy requests into OmiPipe frames for transport over POSIX pipes, TCP streams, ncat, socat, WebStreams, or service-worker MessagePorts. MCRSGSP correctness remains defined by causal closure, RS sufficiency, monotone growth, and anti-entropy repair; OmiPipe receipts are application-layer acceptance witnesses.

---

## 13. Final Canon

OmiPipe and MCRSGSP are not competing protocols.

They are complementary layers.

- OmiPipe = stream carrier and route repair
- MCRSGSP = fragment recovery and anti-entropy repair
- OMI Receipt = acceptance authority

MCRSGSP determines whether fragments can form recoverable candidates.

OmiPipe determines whether those candidates can move through deterministic streams and repaired routes.

OMI determines whether a candidate becomes an accepted, replayable, projectable object.

One-line canon:

> MCRSGSP repairs missing fragments, OmiPipe repairs broken paths, and OMI receipts decide accepted state; together they form a layered decentralized runtime where storage recovery, stream transport, and semantic authority remain separate but composable.
