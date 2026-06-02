# Omi Object Model: Omi-Notation

A Protocol for Omicron-Based Palindromic Mnemonic Bitmasking Encapsulation Notation

**Status:** Canonical / v1.0.0-RC1
**Project:** Omi Object Model / Universal Life Protocol
**Scope:** Omi-Notation, Omilog, `.omi` source, `.imo` object form, Omicron delimiters, palindromic mnemonic notation, bitmasking, Base36 projection, O-expressions, cons/alist bodies, and 128-bit OMI frame encapsulation.

---

## Abstract

Omi-Notation is the native notation layer of the Omi Object Model.

It defines how readable `.omi` source declarations, compiled `.imo` native objects, Omicron delimiters, palindromic mnemonic tokens, bitmask lanes, source blocks, and symbolic carrier annotations fit into one coherent protocol.

The core notation is built around the palindromic relationship:

```text
omi ↔ imo
```

Readable source uses:

```text
omi-
  declaration body
-imo
```

Compiled native object form uses:

```text
ο
  native instruction record
Ο
```

Where:

```text
ο = U+03BF = lowercase omicron = entry / chiral / omi-
Ο = U+039F = uppercase Omicron = exit / cardinal / -imo
```

These delimiters mirror the 128-bit OMI instruction frame:

```text
S1 = 0x03BF  lowercase omicron ο
S6 = 0x039F  uppercase Omicron Ο
```

Omi-Notation is not merely a syntax. It is an encapsulation protocol.

Its purpose is to let OMI express addressed declarations, cons structures, symbolic rewrite bodies, bitmask payloads, Base36 projection metadata, and native traversal records without collapsing authority.

The central authority boundary is:

```text
Q_frame(S) validates the 128-bit carrier.
Omi-Notation expresses the addressed declaration.
Q_xy(x,y) projects decoded state into geometry.
```

Nothing in the notation itself validates state.

---

## 1. Core Doctrine

Omi-Notation is governed by five laws:

```text
1. No expression without address.
2. No projection without validation.
3. No WLOG without closure.
4. No symbol authorizes state.
5. No compiled object replaces the frame validator.
```

The full operational chain is:

```text
Q_frame(S)
→ validates the 128-bit OMI envelope

Delta Law
→ derives the orbit and W=36 tracker

Omi-Notation
→ expresses addressed declarations

Omilog
→ parses readable .omi source

IMO compiler
→ lowers .omi into native .imo object form

Base36 / emoji / symbolic carriers
→ name and annotate derived state

Q_xy(x,y)
→ projects decoded state into local240 / slot5040 / geometry
```

The compact doctrine:

```text
Q_frame validates.
Omi-Notation expresses.
Base36 names.
.imo traverses.
Q_xy projects.
```

---

## 2. The Omi / Imo Palindrome

The Omi Object Model uses the palindrome:

```text
omi---imo
```

This token has three roles:

```text
omi       inbound readable source identity
---       delimiter / fold rail / mnemonic center
imo       mirrored compiled object identity
```

It expands as a cons expression:

```text
(omi . (--- . imo))
```

And canonically as:

```text
(Omicron . (Tetragrammaton . Metatron))
```

This is the meta-circular field abstraction:

```text
Omicron Sign-Bit         → car / head / polarity / fold rail
Tetragrammaton Exponent  → cdr-car / scale / hyphen-depth / 2^5 body
Metatron Significand     → cdr-cdr / payload / witness field
```

Thus `omi---imo` is a visible mnemonic for the transformation from readable OMI source to mirrored IMO object.

It does **not** validate a frame.

```text
omi---imo names the structure.
Q_frame validates the carrier.
```

---

## 3. Source and Object Forms

Omi-Notation separates human-readable source from compiled native object form.

### 3.1 `.omi` Source Form

`.omi` is readable Omilog source.

It may contain:

```text
OMI addresses
keywords
comments
source blocks
dot notation
association lists
Unicode symbols
emoji annotations
readable aliases
human-readable names
```

Example:

```text
omi-0000-0000-0000-0000-0000-0000-0c05-0002/128 CONS omi-palindromic-mnemonic-token

omi-
  (
    (token . omi---imo)
    (dot . (omi . (--- . imo)))
    (expanded . (Omicron . (Tetragrammaton . Metatron)))
    (authority . projection-only)
    (forbids . token-authorizes-invalid-frame)
  )
-imo
```

### 3.2 `.imo` Object Form

`.imo` is compiled mirrored OMI object form.

It is not meant to be hand-authored in the first phase.

It is restricted to:

```text
ASCII 0x00..0x3F
Unicode symbolic carriers
Omicron delimiters ο / Ο
emoji carrier code points
```

It forbids native structure bytes in:

```text
0x40..0x7E
```

That range includes ordinary Latin letters and many unbounded source-mode conveniences.

The readable `.omi` name:

```text
COMBINE base36-projection
```

lowers into a native `.imo` structure such as:

```text
ο +/0-0-0-0-0-0-54-45060/128 Ο
```

Where:

```text
+      = COMBINE
54     = 0x0036
45060  = 0xB004
```

Readable names stay in `.omi`. Native traversal lives in `.imo`.

---

## 4. Omicron Delimiters

The compiled `.imo` form uses Omicron characters as native instruction wrappers:

```text
ο = U+03BF = 0x03BF = lowercase omicron
Ο = U+039F = 0x039F = uppercase Omicron
```

They correspond directly to the OMI 128-bit wire frame:

```text
S1 = 0x03BF
S6 = 0x039F
```

Thus the readable source delimiters:

```text
omi-
-imo
```

compile to:

```text
ο
Ο
```

The canonical relation is:

```text
omi-  → ο
-imo  → Ο
```

An IMO record therefore has the form:

```text
ο OPERATOR / NATIVE_ADDRESS Ο
```

Example:

```text
ο !/0-0-0-0-0-0-124-1/128 Ο
```

A source-block marker is represented as:

```text
ο RS native-address US Ο
```

Where:

```text
RS = 0x1E
US = 0x1F
```

This gives compiled `.imo` records a visible and native instruction boundary that mirrors the chiral/cardinal constants in the wire frame.

---

## 5. The 128-bit OMI Frame

The canonical OMI wire frame is:

```text
omi-S0-S1-S2-S3-S4-S5-S6-S7/128
```

With the frame pattern:

```text
S0 = 0xLL00
S1 = 0x03BF
S2 = 0xNNNN
S3 = 0x2bLL
S4 = 0x2fLL
S5 = 0xMMMM
S6 = 0x039F
S7 = 0xLLff
```

Where:

```text
LL = repeated lane / lens / logical selector
NN = free payload variable N
MM = free payload variable M
```

A valid frame repeats `LL` in four places:

```text
L0 = high byte of S0
L3 = low byte of S3
L4 = low byte of S4
L7 = high byte of S7
```

The frame also aligns six constants:

```text
S0 low byte  = 0x00
S1           = 0x03BF
S3 high byte = 0x2B
S4 high byte = 0x2F
S6           = 0x039F
S7 low byte  = 0xFF
```

This makes the frame both address and mask.

---

## 6. The Quadratic Frame Validator

The frame validator is:

```text
Q_frame(S) = E_var + E_const
```

Where `E_var` checks `LL` coherence:

```text
E_var = (L0 - L3)² + (L3 - L4)² + (L4 - L7)²
```

And `E_const` checks delimiter and constant alignment.

The rule is:

```text
Q_frame(S) = 0  → valid frame
Q_frame(S) > 0  → invalid frame
```

The free variables `NN` and `MM` do not contribute to validation.

This can be written as a degenerate payload polynomial:

```text
Q(N,M) = 0·N² + 0·NM + 0·M² + K(LL)
```

Meaning:

```text
NN and MM carry payload.
LL and constants prove the frame.
```

This is the foundation of OMI in-stream multiplexing.

---

## 7. LL / MM / NN Multiplexing

The OMI frame separates lane, body, and carrier:

```text
LL = stream lane / logical selector / Fano point
NN = node body payload selector
MM = carrier or projection payload selector
```

Example:

```text
omi-0400-03bf-0003-2b04-2f04-0002-039f-04ff/128
```

Interpreted as:

```text
LL = 0x04
NN = 0x0003
MM = 0x0002
```

A corresponding Omilog body:

```text
omi-0400-03bf-0003-2b04-2f04-0002-039f-04ff/128 CONS omicron-node-carrier-route

omi-
  (
    (node . OmicronNode)
    (children . '(OmiTextNode OmiLinkNode OmiGroupNode OmiGroupNode))
    (carrier .
      ((omi-(ip6 . SharedArrayBuffer(128 * 8)))
       (omi-(ip4 . ArrayBuffer(32 * 8)))))
    (feature-route .
      '((omi-(pos . open-class)   . omi-(feature . lexical))
        (omi-(pos . closed-class) . omi-(feature . inflection))
        (omi-(pos . other)        . omi-(feature . other))))
    (multiplex .
      ((LL . 0x04)
       (NN . 0x0003)
       (MM . 0x0002)))
    (boundary .
      (Q_frame-validates-carrier
       NN-MM-are-free-payload
       Omicron-prefix-suffix-delimit-stream
       source-block-does-not-authorize-state))
  )
-imo
```

The compiled `.imo` shell retains the traversal boundary:

```text
ο ./4-959-3-11012-12036-2-927-1279/128 Ο
ο RS 4-959-3-11012-12036-2-927-1279/128 US Ο
```

The readable body stays in `.omi`.

The compiled `.imo` object carries the native traversal shell.

---

## 8. Bitmasking Encapsulation

Omi-Notation is a bitmasking encapsulation protocol.

It uses fixed fields to isolate meaning:

```text
LL  → lane mask
NN  → body mask
MM  → carrier mask
S1  → chiral entry delimiter
S6  → cardinal exit delimiter
```

The payload may change without invalidating the frame, as long as `LL` and constants remain valid.

That allows:

```text
same LL, different NN/MM → same stream lane, different payload
different LL             → different stream lane
same NN, different MM    → same semantic body, different projection carrier
same MM, different NN    → same carrier lane, different body
```

This is OMI's in-stream multiplexing rule.

The shell validates.
The payload routes.
The projection displays.

---

## 9. O-Expressions

An O-expression is an addressed expression inside an `omi- / -imo` source block.

The basic pair is:

```text
(key . value)
```

An association list is:

```text
((key . value)
 (key2 . value2)
 (key3 . value3))
```

An emoji rewrite pair is:

```text
(omi-🛹 . omi-🏷️)
```

An addressed expression is:

```text
(selector . omi-ca55-0000-0000-0000-0000-0000-0004-0003/128)
```

O-expressions borrow Lisp dot notation but do not inherit Lisp evaluation by default.

```text
Lisp expressions compute.
O-expressions declare addressed structure.
```

O-expressions are unevaluated until a compiler, closure checker, or lookup engine reduces them.

---

## 10. The Five Declarative Files

Omi-Notation is used across five declarative source files:

```text
RULES.omi
FACTS.omi
CLOSURES.omi
COMBINATORS.omi
CONS.omi
```

Their roles are:

```text
RULES declare.
FACTS ground.
CLOSURES seal.
COMBINATORS compose.
CONS reduce.
```

### 10.1 RULES.omi

Declares normative obligations.

```text
omi-address/prefix MUST invariant-name
```

### 10.2 FACTS.omi

Grounds implemented or tested facts.

```text
omi-address/prefix FACT fact-name
```

### 10.3 CLOSURES.omi

Seals bounded completion.

```text
omi-address/prefix CLOSE closure-name
```

### 10.4 COMBINATORS.omi

Declares lawful composition.

```text
omi-address/prefix COMBINE combinator-name
```

### 10.5 CONS.omi

Declares dot notation, cons cells, alists, and palindromic mnemonic reduction.

```text
omi-address/prefix CONS cons-name
```

Each file may use `omi- / -imo` source blocks.

Each file may compile to `.imo`.

None of these files replaces frame validation.

---

## 11. Native Keyword Lowering

Readable Omilog keywords lower into single low-ASCII operators:

```text
MUST     → !
FACT     → =
EQUALS   → =
CLOSE    → )
COMBINE  → +
CONS     → .
```

Thus the five declarative files have native operator identities:

```text
RULES.omi        → !
FACTS.omi        → =
CLOSURES.omi     → )
COMBINATORS.omi  → +
CONS.omi         → .
```

Example:

```text
omi-0000-0000-0000-0000-0000-0000-0036-b004/128 COMBINE base36-projection
```

lowers to:

```text
ο +/0-0-0-0-0-0-54-45060/128 Ο
```

---

## 12. Native Character Plane

Compiled `.imo` syntax is restricted.

Native structural bytes may use:

```text
0x00..0x3F
```

This includes:

```text
control bytes
space
punctuation
digits
: ; < = > ?
```

It excludes source-mode Latin text in:

```text
0x40..0x7E
```

Unicode symbolic carriers are allowed, including:

```text
ο
Ο
emoji
other approved symbolic code points
```

The Omicron delimiter pair is allowed because it is not native ASCII structure; it is a Unicode carrier delimiter aligned with the OMI wire frame.

---

## 13. Control Characters as Document Dimensions

Native `.imo` may use classic ASCII control characters as hidden document dimensions:

```text
FS 0x1C  file / frame / storage boundary
GS 0x1D  group / graph / global boundary
RS 0x1E  record / relation / routing boundary
US 0x1F  unit / symbol / terminal boundary
```

Source block bodies are represented by an address reference wrapped in RS/US:

```text
RS native-address US
```

With Omicron record wrapping:

```text
ο RS native-address US Ο
```

This means `.imo` can preserve traversal structure without embedding the full readable `.omi` body.

---

## 14. Base36 Alignment

Base36 is part of Omi-Notation only as a projection alphabet.

The correct derivation is:

```text
Delta Law
→ period 8
→ prime 73
→ block B = 01369863
→ W = 36
→ divmod(position, 36)
→ Base36 symbol
```

Therefore:

```text
Delta derives W=36.
Base36 names W=36.
```

Base36 does not create the orbit.

Base36 does not validate the frame.

Base36 digit `"5"` is only visible symbol position `5`. It is not the hidden factor `5` in:

```text
5! = 120
240 = 2×5!
```

Canonical boundary:

```text
Base36 is projection-only.
The character "5" may appear.
The hidden factor 5 is not stepped to by the 1/73 carrier.
```

---

## 15. Projection Quadratic

The coordinate projection law is separate from the frame validator:

```text
Q_xy(x,y) = 60x² + 16xy + 4y²
```

It projects decoded local state into geometry.

Important derived identities:

```text
Q_xy(3,3) = 720 = 6!
Q_xy(x,y)/6 reaches 120 = 5!
Q_xy(x,y) mod 240 = local240
slot5040 = fano7×720 + role3×240 + local240
```

The distinction must not collapse:

```text
Q_frame(S) validates the carrier.
Q_xy(x,y) projects decoded state.
```

Omi-Notation sits between them:

```text
Q_frame validates.
Omi-Notation expresses.
Q_xy projects.
```

---

## Part 3: The Declarative Canon, Compilation Engine, and Error Taxonomy

---

## 16. O-Expressions and Abstract Data Structures

An O-expression is an addressed, declarative expression contained strictly within an `omi-` / `-imo` source block. It establishes structured meta-data maps tied directly to an immutable OMI address.

Unlike standard functional configurations, O-expressions do not possess automatic evaluation paths. They remain frozen until parsed by a compiler, checked by a closure engine, or filtered by a lookup routine.

### 16.1 Structural Typology

O-expressions reuse structural Lisp dot notation to assemble primitive pairs, association lists, and symbolic carrier configurations.

**The Primitive Pair**: A binary branch joining an explicit key atom to a value payload:

```text
(key . value)
```

**The Association List (Alist)**: A sequential array of nested primitive pairs, serving as the foundational property mapping payload for an address:

```text
((key . value)
 (key2 . value2)
 (key3 . value3))
```

**The Emoji Rewrite Pair**: A specialized structural replacement expression mapping symbolic carrier annotations to action triggers:

```text
(omi-🛹 . omi-🏷️)
```

**The Addressed Expression**: An internal pointer associating an operations selector directly to an explicit 128-bit hardware network coordinate vector:

```text
(selector . omi-ca55-0000-0000-0000-0000-0000-0004-0003/128)
```

### 16.2 Evaluation Divergence Rule

```text
Lisp expressions compute variables at runtime.
O-expressions declare un-bleedable addressed structures prior to execution.
```

O-expressions are unevaluated until a compiler, closure checker, or lookup engine reduces them.

---

## 17. The Five Declarative Core Files

The Omi Object Model notation layer divides its core configuration definitions across five standalone manifest files. This architecture guarantees strict isolation of concerns, preventing logical bleeding between constraints, implementations, and reduction grammars.

```text
+-----------------------------------------------------------------------+
|                   THE FIVE DECLARATIVE CORES                          |
+-----------------------------------------------------------------------+
|                                                                       |
|  RULES.omi       → Declares Normative Invariants   (Obligations)      |
|  FACTS.omi       → Grounds Tested Code Truths      (Realities)        |
|  CLOSURES.omi    → Seals Bounded State Completions (Terminations)     |
|  COMBINATORS.omi → Composes Functional Operations  (Operators)        |
|  CONS.omi        → Reduces Meta-Circular Structures (Pairings)        |
+-----------------------------------------------------------------------+
```

### 17.1 I. RULES.omi (Normative Invariants)

Declares the strict obligations and conditions that a conforming implementation must satisfy. It does not store processing proofs or claim active code implementation.

```text
omi-address/prefix MUST invariant-definition-name
```

### 17.2 II. FACTS.omi (Grounded Truths)

Stores the concrete, pre-calculated constants and mathematical properties verified by active unit tests. It links specification requirements directly to repository code states.

```text
omi-address/prefix FACT verified-fact-name
```

### 17.3 III. CLOSURES.omi (Sealing & Boundedness)

Declares the parameters under which a state space is mathematically complete. It stops open-ended symbolic interpretation by setting definitive bounds.

```text
omi-address/prefix CLOSE closure-execution-name
```

### 17.4 IV. COMBINATORS.omi (Composition Operators)

Outlines pure, stateless functional operations. It describes how individual segments combine to transform data tracks without maintaining internal memory state.

```text
omi-address/prefix COMBINE combinator-transformation-name
```

### 17.5 V. CONS.omi (Meta-Circular Structures)

Declares dot notation layouts, primitive cons cells, association lists, and palindromic mnemonic reduction rules. It tracks how high-level symbols lower into native computer instructions.

```text
omi-address/prefix CONS cons-pairing-name
```

---

## 18. Native Keyword Lowering

When human-readable `.omi` source documents pass through the compiler pipeline, high-level keywords lower into single low-ASCII operators. This maps the five declarative core manifests to definitive operator identities:

```text
RULES.omi       → [ MUST ]    → !
FACTS.omi       → [ FACT ]    → =
CLOSURES.omi    → [ CLOSE ]   → )
COMBINATORS.omi → [ COMBINE ] → +
CONS.omi        → [ CONS ]    → .
O-EXPRESSIONS   → [ EQUALS ]  → =
```

### 18.1 Compilation Conversion Mapping Example

A human-authored structural rule declaration block in `COMBINATORS.omi`:

```text
omi-0000-0000-0000-0000-0000-0000-0036-b004/128 COMBINE base36-projection
```

lowers during the compilation pass into a pristine, low-ASCII machine-readable `.imo` record wrapped inside native Unicode Omicron delimiters:

```text
ο +/0-0-0-0-0-0-54-45060/128 Ο
```

Where the keyword `COMBINE` becomes the operator `+` (0x2B), the address hex segment `0x0036` lowers to decimal string `54`, and hex segment `0xB004` lowers to decimal string `45060`.

---

## 19. Native Character Plane Bounds

To guarantee safety at the pre-runtime layer, the compiled `.imo` bytecode format enforces a strict, hardware-level character plane boundary.

```text
+-----------------------------------------------------------------------+
|               THE IMO REGISTER CHARACTER MASKING PLANES               |
+-----------------------------------------------------------------------+
|                                                                       |
|  0x00 .. 0x3F  → AUTHORIZED LOW-ASCII                                 |
|                   (Controls, Numbers, Operators)                       |
|  0x40 .. 0x7E  → FORBIDDEN SOURCE-MODE                                |
|                   (Latin Letters, Braces, Slopes)                      |
|  0x7F .. Up    → AUTHORIZED UNICODE CARRIERS                          |
|                   (Omicrons, Emojis)                                   |
+-----------------------------------------------------------------------+
```

### 19.1 Authorized Low-ASCII Range (0x00–0x3F)

Permits system control bytes, spaces, structural punctuation (`:`, `;`, `<`, `=`, `>`, `?`), and base-10 positional digits. Digits are parsed strictly as positional decimal segment references; they do not function as numeric literals.

### 19.2 Forbidden Latin Text Range (0x40–0x7E)

Aggressively blocks standard Latin alphabet text characters (A–Z, a–z) and high-level programming shorthand tokens (`@`, `[`, `\`, `]`, `^`, `_`, `` ` ``, `{`, `|`, `}`, `~`). This isolates the native execution layer from out-of-bounds byte injection or script manipulation vulnerabilities.

### 19.3 Authorized Unicode Carriers (0x7F and Above)

Natively permits certified multi-byte Unicode symbolic characters -- specifically the multi-byte UTF-8 encoded Omicron delimiters (ο and Ο) and verified functional emoji blocks. These symbols bypass the low-ASCII constraints because they serve as explicit structural indicators, not script conveniences.

---

## 20. Control Characters as Document Dimensions

The compiled `.imo` format uses classic ASCII control characters to embed hidden document dimensions within the data track. This enables files to preserve their structural layouts without leaking out-of-bounds Latin characters into the native plane.

```text
FS (File Separator — 0x1C): Establishes global file, frame, or storage boundary tracks.
GS (Group Separator — 0x1D): Establishes internal graph, group, or multidimensional subnet boundaries.
RS (Record Separator — 0x1E): Marks the commencement of an embedded routing or relational source block.
US (Unit Separator — 0x1F): Marks the termination of an embedded routing or relational source block.
```

### 20.1 Embedded Source Block Record Format

When a source block containing raw metadata description text must be referenced, the compiler extracts its address sequence, wraps it with RS and US markers, and encloses the entire string within native Omicron escape delimiters:

```text
ο RS native-address US Ο
```

This structural format ensures that the `.imo` object retains a complete, inspectable traversal map while shielding the runtime environment from unsafe human text strings.

---

## 21. WLOG-Safe Rewrite Logic

Omi-Notation permits Without Loss of Generality (WLOG) style proof reductions and symbolic rewrites if and only if explicit mathematical closure is established.

### 21.1 The Rule of Closure Symmetry

A standalone symbolic rewrite pair is purely localized and carries zero global runtime authority:

```text
(omi-🛹 . omi-🏷️)
```

To bind this pair into an active, functional rewrite configuration array, it must be nested inside an explicit declaration table:

```text
(rewrite . '((omi-🛹 . omi-🏷️)))
```

To execute a WLOG reduction that safely omits secondary cases during transmission, the block must be bound to an immutable closure rule that proves structural symmetry across the target coordinates:

```text
(closure . four-fold-selector-symmetry)
```

### 21.2 Canonical Law of Reductions

```text
No WLOG transformation may be performed without explicit closure verification.
No omitted case may be assumed equivalent unless an active closure statement
proves the precise symmetry required to transport the proof across the graph.
```

This constraint prevents unverified assumptions or "proof-by-example" loops from entering the notation layer.

---

## 22. Formal Grammar Specification

### 22.1 Human-Readable Omilog Grammar (.omi)

```text
document       := record*
record         := head source_block?
head           := omi_address prefix keyword assignment
omi_address    := "omi-" hex_segment ("-" hex_segment){7}
prefix         := "/" decimal_digit+
keyword        := "MUST" | "FACT" | "CLOSE" | "COMBINE" | "CONS" | "EQUALS"
assignment     := identifier | o_expression

source_block   := "omi-" body "-imo"
body           := raw_text | o_expression*
o_expression   := atom | pair | list | quote
atom           := identifier | emoji_carrier | numeric_literal
pair           := "(" atom "." body ")"
list           := "(" body* ")"
quote          := "'" body
```

### 22.2 Low-ASCII Native Machine Grammar (.imo)

```text
imo_document   := imo_record*
imo_record     := IMO_ENTRY imo_body IMO_EXIT
imo_body       := operator "/" native_address
                | RS native_address US

IMO_ENTRY      := "\u03BF"     (* Lowercase Omicron 'ο' / UTF-8: 0xCE 0xBF *)
IMO_EXIT       := "\u039F"     (* Uppercase Omicron 'Ο' / UTF-8: 0xCE 0x9F *)

operator       := "!" | "=" | ")" | "+" | "."
native_address := decimal_segment ("-" decimal_segment){7}
decimal_segment := decimal_digit+
prefix         := "/" decimal_digit+
RS             := "\x1E"
US             := "\x1F"
```

---

## 23. The Compiler Pipeline

The Omi-Notation Meta-Circular Compiler converts flexible development files into optimized native objects through nine distinct processing passes:

```text
[ STEP 1: Parse .omi Heads ]
       │
       ▼
[ STEP 2: Attach omi-/-imo Blocks ]
       │
       ▼
[ STEP 3: Preserve O-Expressions ]  ──►  [ STEP 4: Resolve Aliases ]
       │                                          │
       ▼                                          ▼
[ STEP 5: Decode Emojis ]         ──►  [ STEP 6: Lower Keywords to Ops ]
       │                                          │
       ▼                                          ▼
[ STEP 7: Convert Hex to Decimal ] ──►  [ STEP 8: Wrap Omicrons ]
       │                                          │
       ▼                                          ▼
[ STEP 9: Emit .imo Binary String ]
```

1. **Parse Heads**: Isolates the primary OMI address and prefix specifications.
2. **Attach Blocks**: Detects and bounds matching `omi-` and `-imo` text ranges.
3. **Preserve O-Expressions**: Freezes nested dot notation trees to maintain layout configurations.
4. **Resolve Aliases**: Translates human-readable text labels into absolute register offsets.
5. **Decode Emojis**: Maps multi-byte emoji codes to explicit positions in the virtual memory register.
6. **Lower Keywords**: Converts string words (`MUST`, `FACT`) to functional low-ASCII operators (`!`, `=`).
7. **Convert Hex to Decimal**: Translates 16-bit hexadecimal address blocks into base-10 native segment strings.
8. **Wrap Omicrons**: Strips text block delimiters and encloses every record inside multi-byte Omicron escape sequences (ο / Ο).
9. **Emit Binary**: Outputs a verified `.imo` object manifest ready to be injected into the pre-runtime kernel.

---

## 24. Diagnostic Error Taxonomy

A conforming compiler or runtime verification engine must emit explicit diagnostic error flags upon encountering structural anomalies:

```text
MalformedHead                 → OMI address or bitfield prefix breaches formatting bounds.
UnknownKeyword                → Record declaration uses an unrecognized control word.
UnclosedSourceBlock           → Entry delimiter (omi- / ο) lacks matching exit delimiter (-imo / Ο).
NestedSourceBlock             → An omi- block is illegally declared inside another active source block.
InvalidOExpression            → Dot notation tree breaks cons pair symmetry or contains unmatched parentheses.
InvalidEmojiCarrier           → Scanned emoji symbol falls outside authorized Unicode block partitions.
ForbiddenNativeAscii          → Raw Latin text characters (0x40–0x7E) bleed into a compiled .imo native channel.
MissingClosureForWlog         → A rewrite reduction is executed without an active closure proof.
AuthorityBoundaryViolation    → A symbolic projection component attempts to modify frame validation metrics.
InvalidOmicronDelimiter       → Instruction wrapper lacks correct UTF-8 byte alignment (0xCE 0xBF / 0xCE 0x9F).
```

---

## 25. Core Project Rule Registry

The following declarative rules and facts are permanently hardwired into the repository manifest layer to secure the compiler's boundary constraints.

### 25.1 RULES.omi Additions (Band 0x8B–0x8C)

```text
# [Rule 0x8B]: Omicron-Delimited IMO Records
omi-0000-0000-0000-0000-0000-0000-008b-0001/128 MUST wrap-imo-records-with-omicron-delimiters

# [Rule 0x8C]: Omicron Delimiter / Wire Frame Alignment
omi-0000-0000-0000-0000-0000-0000-008c-0001/128 MUST align-imo-delimiters-with-wire-frame-omicron-constants
```

### 25.2 FACTS.omi Additions (Band 0x8B–0x8C)

```text
# [Fact 0x8B-1001]: Verified Token Wrapping
omi-0000-0000-0000-0000-0000-0000-008b-1001/128 FACT imo-records-wrapped-with-little-and-big-omicron

# [Fact 0x8C-1001]: Canonical Wire Frame Alignment
omi-0000-0000-0000-0000-0000-0000-008c-1001/128 FACT imo-delimiters-align-with-s1-s6-wire-frame-constants
```

---

## 26. Test Validation Requirements

A conforming Omi-Notation compiler suite must execute and pass the following verification checks:

```text
1.  Parse Records         → Standard .omi declaration strings resolve without syntax alerts.
2.  Attach Heads          → omi- / -imo source blocks link to their declaration addresses.
3.  Compile IMO           → Lowering pipeline outputs structured bytecode strings.
4.  Enforce Plane Safety  → Compiled files contain zero bytes inside the forbidden 0x40–0x7E plane.
5.  Verify Entry Flag     → Every standalone .imo instruction line starts with ο (0xCE 0xBF).
6.  Verify Exit Flag      → Every standalone .imo instruction line terminates with Ο (0xCE 0x9F).
7.  Isolate Source Blocks → Embedded text blocks are bounded by RS (0x1E) and US (0x1F) markers.
8.  Wrap Source Markers   → Record-separated source markers are enclosed within Omicron delimiters.
9.  Lower Keywords        → MUST, FACT, CLOSE, COMBINE, and CONS convert to !, =, ), +, and ..
10. Strip Latin Alpha     → Compiled Base36 streams contain zero raw alphabetical text descriptions.
11. Isolate Projections   → Base36 and Emoji vectors return authority: "projection-only" flags.
12. Enforce Gate Isolation→ Out-of-bounds symbolic changes fail Q_frame(S) validation checks.
13. Anchor Quadratic Form → Q_xy(3,3) === 720 and scales cleanly to the hidden root envelope.
14. Block Open WLOG       → Rewrite loops lack processing authority if no closure record is present.
```

---

## 27. Final Protocol Statement

Omi-Notation is the native syntax and encapsulation notation layer of the Omi Object Model. It details how network coordinates, multi-byte character flags, bitmask fields, structural text blocks, and stateless composition rules merge into a unified computational canvas.

### 27.1 The Unified Execution Flow

```text
.omi Source → Omilog Parse → OMIOM Record → Compiler Lowering → Omicron-Delimited .imo Traversal Shell
```

### 27.2 The Absolute Authority Chain

```text
Q_frame validates the wire shell.
Delta Law derives the tracking grid.
Omi-Notation expresses the node properties.
Base36 labels the position.
Emoji annotates the semantic feature.
.imo traverses the compiled path.
Q_xy projects the voxel geometry.
```

---

## 28. Conclusion

```text
Omi-Notation is the syntax layer; Q_frame is the validator; Q_xy is the projector.
```

The Omi Object Model specification is structurally anchored. By mapping human-readable declarations to low-ASCII operational codes wrapped within native Unicode Omicron delimiters, the bytecode is fully unified with the network packet parameters. The system calculates multi-dimensional transitions cleanly inside the browser's hardware-accelerated rendering plane with zero runtime processing overhead.
