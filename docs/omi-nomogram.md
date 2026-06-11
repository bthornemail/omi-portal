# Omi-Nomogram / Omi-SlideRule / Omi-Query Plane

Deterministic Function Scales, Post-Address Payloads, DataView Frames, and the ?---? Surface

**Canonical name:** Omi-Nomogram
**Operational face:** Omi-SlideRule
**Payload surface:** Omi-Query Plane / ?---?
**System:** OMI — Omicron Object Model

---

## 0. Canonical Name

The canonical formal name is:

    Omi-Nomogram

The descriptive operational name is:

    Omi-SlideRule

The distinction matters.

- Omi-Nomogram = declarative function-scale surface
- Omi-SlideRule = runtime scale-walk mechanism

A nomogram declares aligned scales.

A slide rule shows how those scales move, fold, invert, and compute.

OMI uses both meanings:

    Omi-Nomogram declares the scale.
    Omi-SlideRule performs the scale walk.

Therefore:

    Omi-Nomogram is the canonical surface.
    Omi-SlideRule is the operational behavior of that surface.

---

## 1. Core Correction

The 0x30–0x3F row is the native OMI function-scale selector row.

It does not carry arbitrary payload bytes.

The Base64URL/DataView payload surface belongs after the fully qualified OMI address, in the post-address query plane.

Correct separation:

    core OMI address:
      omi-<frame>/<control>/<scale>/<relation>/<unit>-imo

    external query / runtime payload:
      ?s=<subpath>&t=<type>&l=<length>&v=<base64url>&h=<hash>

Complete form:

    omi-<frame>/<control>/<scale>/<relation>/<unit>-imo?s=<subpath>&t=<type>&l=<length>&v=<base64url>&h=<hash>

Rule:

- The address identifies.
- The Omi-Nomogram scale declares interpretation.
- The query plane carries external payload.
- The DataView interprets payload bytes.
- The receipt decides whether the payload lawfully attaches.

---

## 2. Placement in the Gauge

Omi-Nomogram is assigned to:

    0x30–0x3F

This row is the readable projection of the .imo runtime control row:

    0x10–0x1F XOR 0x20 = 0x30–0x3F

So:

    0x10–0x1F = compiled/runtime controls
    0x30–0x3F = readable runtime function scales

This makes 0x30–0x3F the natural home for pure function-scale selectors.

It should not be treated as raw geometry.

It chooses how geometry, measurement, routing, replay, payload inspection, or period analysis should be interpreted.

Canon:

> 0x30–0x3F is the Omi-Nomogram row: the native declarative function-scale surface of OMI.

---

## 3. Omi-Nomogram Function Row

The row is not defined by hand. It is computed.

Each slot is derived from the Delta law and the XOR 0x20 fold from the .imo runtime control row:

    0x10–0x1F → XOR 0x20 → 0x30–0x3F

The Delta law does not know these are function scales. It only moves state:

    Δ_C(x) = rotl(x,1) XOR rotl(x,3) XOR rotr(x,2) XOR C

The row identity is earned through the fold. The selector names are LUT projections of computed positions.

Canonical row:

    0x30 = identity / index / unity scale
    0x31 = C/D logarithmic multiply-divide scale
    0x32 = A/B square-square-root scale
    0x33 = K cube-cube-root scale
    0x34 = folded scale / π fold / CF-DF
    0x35 = inverse reciprocal scale / CI-DI
    0x36 = sine-cosine scale
    0x37 = tangent-cotangent scale
    0x38 = small-angle / degree-radian scale
    0x39 = Pythagorean scale / sqrt(1 - x²)
    0x3A = common logarithm / log10 / power-of-10 scale
    0x3B = natural logarithm / ln / eˣ scale, or query clause separator after ?
    0x3C = sexagesimal 60 gate / circular degree fold
    0x3D = roots and powers / arbitrary exponent scale
    0x3E = quadratic / proportion / difference-of-squares / gnomon solver
    0x3F = LFSR / period / primitive-polynomial / query-gate scale selector

Each slot is a deterministic function selector.

The selector does not store every result.

It declares how the runtime should transform, fold, align, inspect, or measure a relation.

The names above are readable LUT faces. The machine authority is the computed row position.

Canon:

> The row names function scales, not payload data. The names themselves are LUT projections of computed positions.

---

## 4. Why Omi-Nomogram Belongs Before Geometry

The runtime must not derive geometry directly from raw byte distance.

It must first ask:

    Which function scale is active?

Examples:

- 0x31 asks for multiplicative/divisive alignment.
- 0x32 asks for square/square-root alignment.
- 0x36 asks for sine/cosine angular alignment.
- 0x3C asks for sexagesimal circular alignment.
- 0x3E asks for quadratic/difference-of-squares alignment.
- 0x3F asks for period/LFSR alignment.

Only after the scale is chosen should the runtime instantiate geometry.

Local pipeline:

    D₂ → Λ → G

Where:

    D₂ = exact two-cube / Omi-Gauge relation
    Λ  = Omi-Nomogram scale selector
    G  = geometry/configuration predicate

Expanded:

    D₂(F₁,W₁,F₂,W₂)
    → Λ(D₂)
    → G(D₂,Λ)

Canon:

> Geometry is stable only when exact distance is interpreted through an explicit Omi-Nomogram scale.

---

## 5. Omi-Nomogram and Omi-Gauge

Omi-Gauge computes the exact plane cell:

    cell = (row << 12) | (x << 6) | y

Omi-Nomogram declares how that computed cell should be interpreted.

Both belong to the pre-0xAA55 autonomous stack. Before the acceptance seal, the system must be able to compute its own gauge plane and derive its own function-scale selectors without external runtime.

Relationship:

    Omi-Gauge computes the addressable plane.
    Omi-Nomogram selects the function scale.
    Omi-Matrix instantiates the relation field.
    Omi-Gnomon orients the result.
    Receipt accepts.

So:

    Omi-Gauge = where the cell is
    Omi-Nomogram = how the cell is read
    Omi-Matrix = how the relation is laid out
    Omi-Gnomon = how the relation is oriented

The underlying Delta law is the transformer. It does not know geometry, glyphs, or rendering. It only moves bits through rotation and XOR. The nomogram scale is a computed position that the Delta law folded into existence; it is not a manually assigned table.

Canon:

> Omi-Gauge resolves; Omi-Nomogram interprets. Both are computed from the Delta law before 0xAA55.

---

## 6. Relation to Slide Rule Mathematics

Slide rules work because logarithms transform multiplication into addition:

    log(x × y) = log(x) + log(y)
    log(x / y) = log(x) - log(y)

Omi-Nomogram generalizes this principle:

    function-scale alignment turns frame distance into measurable relation

For OMI:

    two-cube relation + selected scale = runtime-measurable relation

Omi-SlideRule behavior:

    align scale
    read relation
    fold if needed
    invert if needed
    project if accepted

Canon:

> Omi-SlideRule is the runtime walk over an Omi-Nomogram scale.

---

## 7. Omi-Nomogram and the Geometry Stack

The geometry stack remains:

    4y²   = local control / tetrahedral kernel
    16xy  = Omi-Gauge bridge / cube-octa edge resolver
    60x²  = spectral/world/orientation surface

Omi-Nomogram chooses the function scale that determines how these maps instantiate.

Examples:

    0x30 identity scale
      → preserve current geometry

    0x32 square scale
      → derive area, face, square, root, or two-cube face relation

    0x33 cube scale
      → derive volume, cell, extrusion, or 3D relation

    0x36 sine/cosine scale
      → derive angular projection or spherical orientation

    0x39 Pythagorean scale
      → derive right-angle, gnomon, or Omi-Gnomon relation

    0x3C sexagesimal scale
      → derive circular degree, clock, orbit, Omi-Ring, or Omi-Compass relation

    0x3E quadratic scale
      → derive difference-of-squares, gnomon, frame subtraction, or bridge surface

    0x3F LFSR/period scale
      → derive deterministic replay period or inspection cycle

Canon:

> Omi-Nomogram selects the function scale by which the OMI geometry stack becomes measurable.

---

## 8. Omi-Nomogram, Omi-Matrix, and Omi-Gnomon

The canonical geometric runtime path is:

    Omi-Nomogram → Omi-Matrix → Omi-Gnomon

Meaning:

    Omi-Nomogram:
      Which function scale is active?

    Omi-Matrix:
      Which rows, columns, cells, and relations align?

    Omi-Gnomon:
      Which orientation, shadow, pointer, or right-angle surface appears?

Compact:

    function scale → relation matrix → oriented gnomon

Canon:

> Omi-Nomogram declares; Omi-Matrix instantiates; Omi-Gnomon orients.

---

## 9. 0x3C as Sexagesimal Gate

0x3C is special because:

    0x3C = 60 decimal

So it is the natural slot for:

    sexagesimal degree
    60x² orbit
    circular fold
    clock face
    Omi-Ring
    Omi-Compass
    Omi-Gnomon degree pointer

Canon:

> 0x3C = sexagesimal circular gate

This connects the function-scale row to the 60x² orientation surface.

---

## 10. 0x3E as Quadratic / Gnomon Scale

0x3E is the quadratic solver slot.

It handles:

    proportion
    quadratic equations
    difference of squares
    gnomon relations
    frame bridge surfaces

Core identity:

    a² - b² = (a + b)(a - b)

OMI reading:

    frame A² - frame B² = measurable bridge surface

So:

    0x3E → Omi-Gnomon

Canon:

> 0x3E selects the quadratic/gnomon function that turns two frame surfaces into a measurable bridge.

---

## 11. 0x3F as LFSR / Period / Query-Gate Scale

0x3F is the period selector.

It opens:

    LFSR
    primitive polynomial
    period 2ⁿ - 1
    replay cycle
    inspection phase
    signature
    query-gate behavior

Examples:

    n = 4  → period 2⁴ - 1  = 15
    n = 8  → period 2⁸ - 1  = 255
    n = 16 → period 2¹⁶ - 1 = 65535
    n = 17 → period 2¹⁷ - 1 = 131071

Important rule:

    2¹⁶ remains the native OMI field.
    2¹⁷ belongs to outer runtime period inspection.

So 2¹⁷ is not the new OMI address body.

It is an outer runtime period horizon.

Canon:

> 0x3F selects period, LFSR, primitive-polynomial, and query-gate inspection without replacing the native 2¹⁶ OMI field.

---

## 12. Palindromic Two-Cube Addresses

Every function in 0x30–0x3F participates in the two-cube mirror law.

Readable function address:

    0x3M

Mirrored relation face:

    0xM3

Examples:

    0x31 ↔ 0x13
    0x32 ↔ 0x23
    0x3C ↔ 0xC3
    0x3F ↔ 0xF3

Canon:

> 0x3M = function scale. 0xM3 = mirrored relation face.

This keeps the function row inside the same two-cube relation law:

    0xNM ↔ 0xMN

---

## 13. Omi-Nomogram and Omi-Spectral Plane

The Omi-Spectral Plane is the user-interface and epistemic rendering layer.

It occupies valid BMP scalar ranges:

    U+0000–U+D7FF
    U+E000–U+FFFF

The surrogate band is reserved:

    U+D800–U+DFFF = RPC bridge, not public glyphs

In the spectral plane:

    low BMP plane  = CAR / source-facing UI
    high BMP plane = CDR / continuation/private mirror UI
    CID            = witness across the bridge

Omi-Nomogram scale selectors can be rendered in the spectral plane, but the rendered glyph is not authority.

Canon:

> Omi-Spectral Plane renders the selected Omi-Nomogram scale; it does not define the scale.

---

## 14. Omi-Query Plane / ?---?

The post-address query plane is:

    ?---?

It opens after identity has been addressed.

Canonical delimiter planes:

    omi---imo = readable OMI object relation
    o---o     = minimal tangent / Omi-Point relation
    /---/     = relational descent / identity path
    ?---?     = external query / transferable payload plane

Rule:

    /---/ belongs to identity descent.
    ?---? belongs to post-identity payload attachment.

The query plane carries:

    DataView payloads
    Base64URL bytes
    worker scripts
    WASM modules
    MCRSGSP fragments
    Omi-CONS frames
    bitboards
    rewrite tables
    node-graph process capsules
    RPC capsules

But it does not replace identity.

Canon:

> The query plane attaches payload after the OMI address is formed.

---

## 15. Query Plane Grammar

Canonical URL-safe query form:

    ?s=<subpath>&t=<type>&l=<length>&e=<endian>&v=<base64url>&h=<hash>

Fields:

    s = subpath index
    t = declared interpretation type
    l = byte length
    e = endian policy
    v = Base64URL-encoded byte payload
    h = hash or receipt witness

Optional fields:

    q = epistemic selector
    r = radix / representation
    p = period selector
    g = geometry selector
    m = measurement mode

Recommended default:

    e=be

because big-endian/network order is stable for wire format.

Canon:

> Base64URL carries bytes. ArrayBuffer stores bytes. DataView interprets bytes. TypedArrays specialize bytes. Receipt validates attachment.

---

## 16. Subpath Index s

Given:

    omi-<frame>/<control>/<scale>/<relation>/<unit>-imo

A simple subpath map is:

    s=0 → whole qualified object
    s=1 → frame
    s=2 → control
    s=3 → scale
    s=4 → relation
    s=5 → unit
    s=6 → receipt/projection
    s=7 → external runtime payload

Canon:

> s does not redefine the address. s selects where the external payload attaches.

---

## 17. 0x3F Inside Path vs ? After Path

This distinction is essential:

    0x3F inside the OMI path = Omi-Nomogram period/query-gate scale selector
    ? after the OMI path      = external payload gate

Example:

    omi-<frame>/<control>/0x3F/<relation>/<unit>-imo?s=7&t=dataview&l=64&v=<base64url>&h=<hash>

Meaning:

    Use the 0x3F period/LFSR function scale on this relation,
    then attach a DataView-compatible payload to subpath 7.

Canon:

> 0x3F selects a function scale. ? opens the external transfer plane.

---

## 18. External Power Bands

Native OMI field:

    2¹⁶ = native OMI gauge limit

Post-address external query region:

    2¹⁶ <= ?---? <= 2³²

Practical 32-bit external query header:

    bits 0–15   = subpath index or local payload offset
    bits 16–23  = exponent / packet class / Block-B phase
    bits 24–30  = significand axis / interpolation mode
    bit 31      = sign / query-gate / chirality bit

Canon:

> 2¹⁶ is the boundary between native OMI identity and external Omi-CONS payload.

---

## 19. Block B as Query Exponent Phase

The Delta law gives period 8.

The smallest prime with decimal period 8 is 73.

Therefore:

    1 / 73 = 0.01369863...

Block B:

    B = [0,1,3,6,9,8,6,3]

This can define query-plane exponent phase:

    bits 16–23 = exponent byte
    exponent phase = B[position mod 8]

Canon:

> The query exponent phase is derived from the period-8 Delta law through Block B.

---

## 20. Omi-CONS Relationship

Omi-CONS is the structured post-address payload frame.

Canonical compact form:

    ?car:<OR>;cdr:<XOR>;cid:<XNOR>

Meaning:

    CAR = source/head payload
    CDR = continuation/tail payload
    CID = lawful agreement witness

Omi-Nomogram may select how the CAR/CDR relation is interpreted.

Example:

    omi-<frame>/<control>/0x3E/<relation>/<unit>-imo?car=<A>;cdr=<B>;cid=<witness>

Meaning:

    Interpret CAR/CDR through the quadratic/gnomon scale,
    then accept only if CID witnesses lawful agreement.

Canon:

> Omi-CONS carries; Omi-Nomogram interprets; receipt accepts.

---

## 21. OmiPipe Relationship

OmiPipe streams OMI frames through POSIX/BusyBox/ncat/socat/WebStreams-style pipes.

Omi-Nomogram is used by OmiPipe to declare the transition or repair scale.

Examples:

    0x30 = direct retry / identity route
    0x35 = reciprocal / backpressure route
    0x39 = distance route
    0x3C = circular/orbit retry schedule
    0x3E = gnomon repair between failed and stable path
    0x3F = period/liveness probe

Canon:

> OmiPipe carries the frame; Omi-Nomogram declares how the route or repair is measured.

---

## 22. MCRSGSP Relationship

MCRSGSP fragments may be carried inside Omi-CONS payloads.

Example:

    omi-<frame>/<control>/0x3F/<relation>/<unit>-imo?car=<fragment>;cdr=<frontier>;cid=<witness>

Meaning:

    CAR = fragment payload
    CDR = version-vector frontier / anti-entropy continuation
    CID = checksum / reconstruction witness
    0x3F = period/frontier/replay scale

Canon:

> MCRSGSP repairs missing fragments. OmiPipe repairs broken paths. Omi-Nomogram declares the function scale. OMI receipt accepts state.

---

## 23. Updated Runtime Reducer

All values before receipt are computed, not defined. The Delta law is the sole transformer; the renderer and geometry map are separate LUT projections applied only after the nomogram scale has been selected.

Corrected reducer:

    ψ(A, Q, Λ, Γ, Δ, G, I, B, H, S) = R

Where:

    A = accepted OMI address (pre-0xAA55 derived)
    Q = external query/DataView/Omi-CONS payload (post-address)
    Λ = Omi-Nomogram function scale (computed from 0x10–0x1F XOR 0x20)
    Γ = Omi-Gauge computed cell or folded witness (reversible 2¹⁶ plane)
    Δ = Delta law transformer (rotl⊕rotl⊕rotr⊕C, period 8)
    G = geometry/configuration predicate (LUT projection, not authority)
    I = incidence scheduler
    B = 11-cell / Archimedean-Catalan orientation shell
    H = HNSW/runtime measurement projection (advisory, not authority)
    S = sexagesimal inspection phase
    R = receipt candidate

Expanded:

    A → accepted pre-0xAA55 identity
    Q → external payload descriptor
    Λ → computed function-scale interpretation
    Γ → computed gauge cell / witness
    Δ → Delta law transformer
    G → geometry LUT projection
    I → valid incidence
    B → chiral shell
    H → runtime measure (projection, not authority)
    S → sexagesimal degree
    R → receipt

Compact:

    address → query payload → nomogram scale → gauge cell → Delta law → geometry → incidence → shell → measure → receipt

---

## 24. Final Authoritative Canon

Omi-Nomogram is the canonical declarative function-scale surface of OMI.

It occupies the 0x30–0x3F row, the readable projection of the .imo runtime control row through XOR 0x20.

Each slot in the row is a deterministic function-scale selector — computed from the Delta law fold, not defined by hand.

The row does not carry BLOBs.

Payloads belong after the fully qualified address in the ?---? Omi-Query Plane.

The native address remains inside the 2¹⁶ Omicron-gated gauge.

The query plane begins at the native word boundary and extends into the 2¹⁶–2³² runtime payload space.

The canonical payload view is:

    Base64URL → Uint8Array → ArrayBuffer → DataView → typed interpretation

0x3F inside the address path selects a period/LFSR/query-gate scale.

? after the address opens external transfer.

Omi-Nomogram must be applied before geometry, HNSW/runtime measurement, sexagesimal degree, route repair, or payload execution.

Omi-Nomogram, Omi-Gauge, and Omi-SlideRule all belong to the pre-0xAA55 autonomous stack. Before the acceptance seal, the system must be able to compute its own gauge plane, derive its own function-scale selectors, and fold them into a witness surface. The Delta law is the transformer and does not know geometry or meaning. The renderer and LUT are separate projection maps applied only after the nomogram scale has been selected and the receipt has accepted.

Omi-SlideRule is the operational scale-walk of Omi-Nomogram.

Omi-Matrix instantiates the selected relation field.

Omi-Gnomon orients it.

Receipt accepts.

One-line canon:

> Omi-Nomogram is the 0x30–0x3F computed function-scale row that interprets exact Omi-Gauge/two-cube relations before geometry, routing, measurement, or payload attachment; it belongs to the pre-0xAA55 autonomous stack where the Delta law folds row positions into function selectors, while ?---? carries post-address Base64URL/DataView/Omi-CONS payloads that are bound only by receipt.

Shortest form:

    omi---imo
    → /---/ identity path (pre-0xAA55)
    → Omi-Nomogram scale (computed from Delta law)
    → Omi-Gauge cell (reversible 2¹⁶ plane)
    → Omi-Matrix (relation field)
    → Omi-Gnomon (orientation)
    → 0xAA55 acceptance seal
    → ?---? payload (post-address)
    → DataView interpretation
    → projection
    → receipt
