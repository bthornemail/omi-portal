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

---

## Part 4: Sequencing, Fano Lottery, and the Sexagesimal Logic Clock

---

## 29. Sequencing, Fano Lottery, and the Sexagesimal Logic Clock

Omi-Notation does not merely describe static records. It also describes the lawful order in which records are replayed, selected, folded, and projected.

The missing sequencing doctrine is:

```text
Delta Law gives replay.
Chirality gives order.
Fano gives selection.
Sexagesimal looping gives clock cadence.
7! gives the replay ring.
```

The full period ladder is:

```text
7      = Fano orbit
60     = sexagesimal logic-clock orbit
240    = local frame / Light Garden frame bridge
360    = orientation sweep
5040   = 7! Fano replay lottery / master reset
```

These are not independent numerology layers. They form one sequencing stack:

```text
atomic kernel
→ chirality bit
→ Fano selection
→ sexagesimal incidence clock
→ 240 local frame bridge
→ 360 orientation sweep
→ 5040 replay ring
```

The Omi-Notation authority boundary remains unchanged:

```text
Q_frame validates the carrier.
Sequencing orders replay.
Q_xy projects decoded state.
```

Sequencing does not validate a frame. It orders lawful frames after validation.

---

## 30. Chirality of Omicron Delimiters

The compiled `.imo` object form is wrapped by the Omicron delimiter pair:

```text
ο ... Ο
```

Where:

```text
ο = U+03BF = lowercase omicron = chiral entry / inbound data flow
Ο = U+039F = uppercase Omicron = cardinal exit / outbound closure
```

This pair is not decorative. It reflects the direction of data flow in the notation.

Readable source aliases:

```text
omi-  → ο
-imo  → Ο
```

Wire-frame constants:

```text
S1 = 0x03BF  → ο  → chiral entry delimiter
S6 = 0x039F  → Ο  → cardinal exit delimiter
```

Therefore, every compiled `.imo` record is a directional descriptor:

```text
ο OPERATOR / NATIVE_ADDRESS Ο
```

The lowercase omicron opens the instruction as an entering, chiral, selectable path.

The uppercase Omicron closes the instruction as a cardinal, replayable, stabilized boundary.

Canonical interpretation:

```text
ο = enter / select / orient / chirality
Ο = close / seal / cardinality / replay boundary
```

This mirrors the OMI frame:

```text
S1 opens the chiral interior.
S6 closes the cardinal boundary.
```

The delimiter pair therefore encodes direction:

```text
ο → data enters the descriptor
Ο → data exits as a closed record
```

---

## 31. Chirality Selection Law in Omi-Notation

Partition alone does not define order.

A candidate space may be split into two subsets:

```text
partition(S) → (S0, S1)
```

But the order of traversal is derived from the kernel chirality bit:

```text
bit := kernel_bit(state, tick)
```

Then:

```text
if bit = 0:
  ordered := (S0, S1)
else:
  ordered := (S1, S0)
```

This means:

```text
partition defines structure.
chirality defines order.
order defines schedule.
schedule defines replay.
```

Omi-Notation must reject any rule that chooses by representation order alone:

```text
always choose first-listed
always choose low
always choose left
always choose S0
```

Those are invalid because they derive order from representation instead of canonical kernel state.

The correct law is:

```text
firstness is derived.
```

There is no intrinsic first branch. Firstness is produced by canonical chirality.

---

## 32. The 7! Fano Lottery Replay Ring

The Fano lottery is the replay-selection ring produced by combining:

```text
7 Fano points
3 semantic roles
240 local bridge states
```

The canonical slot equation is:

```text
slot5040 = fano7 × 720 + role3 × 240 + local240
```

And:

```text
5040 = 7 × 3 × 240 = 7!
```

This gives OMI a replay ledger with 5040 possible stabilized slots.

Interpretation:

```text
fano7    = which Fano selector point is active
role3    = subject / predicate / object lane
local240 = local bridge position
slot5040 = full replay receipt
```

The Fano lottery is called a "lottery" because selection is not arbitrary, random, or UI-driven. It is a canonical draw from the replayable kernel state.

```text
kernel state + tick → chirality bit
chirality bit → ordered partition
ordered partition → Fano selector
Fano selector + role + local240 → slot5040
```

Thus, the Fano lottery is deterministic.

It is lottery-like only in the sense that it selects one active incidence from a lawful candidate space.

---

## 33. Atomic Kernel as Sexagesimal Logic Clock

The atomic kernel is not a wall clock.

It is a logic clock.

The kernel law is:

```text
Δ(x) = rotl(x,1) ⊕ rotl(x,3) ⊕ rotr(x,2) ⊕ C
```

For fixed width, fixed constant, and fixed initial state, replay is deterministic:

```text
xₖ = Δ⁽ᵏ⁾(x₀)
```

The period-8 behavior derives the prime-73 carrier:

```text
1/73 = 0.(01369863)
B = [0,1,3,6,9,8,6,3]
W = sum(B) = 36
```

This creates the Base36 orbit tracker:

```text
position → divmod(position, 36)
```

The sexagesimal clock layer then stabilizes incidence scheduling:

```text
60 = sexagesimal loop
360 = six sexagesimal loops / orientation sweep
5040 = fourteen 360-loops / 7! master replay
```

Canonical sequencing ladder:

```text
Δ period         → 8
decimal carrier  → 1/73
tracker width    → 36
logic clock      → 60
orientation      → 360
master replay    → 5040
```

This is why the atomic kernel functions as a sexagesimal logic clock:

```text
it does not measure external time;
it orders internal replay.
```

---

## 34. Light Garden Frame Bridge

The Light Garden layer explains the role of `240`.

It does not split time into intervals. It splits observation into frames of reference.

```text
traditional encoding:
  split time into intervals

Light Garden:
  split observation into complete frames
```

The local bridge is:

```text
240 = 15 × 16
240 = 2 × 5!
240 = 6! / 3
```

In OMI, `240` is the complete local bridge for one semantic role.

Since:

```text
720 = 3 × 240
```

the full semantic sweep divides into:

```text
subject   → 240
predicate → 240
object    → 240
```

The Light Garden interpretation is:

```text
each local240 is a complete frame of reference.
```

This is why `local240` is not just a number. It is a local observation frame.

The shared invariant is the centroid or canonical root state.

```text
frame changes;
centroid remains.
```

In OMI terms:

```text
projection changes;
validated carrier remains.
```

---

## 35. Sequencing Rule for Omi-Notation

The complete sequencing rule is:

```text
1. Validate the frame with Q_frame.
2. Read the kernel tick.
3. Derive the chirality bit from canonical state.
4. Partition the candidate incidence space.
5. Use chirality to order the partition.
6. Select the Fano point.
7. Resolve role3.
8. Resolve local240.
9. Compute slot5040.
10. Project with Q_xy.
```

As a pipeline:

```text
Q_frame(S)
→ Δ kernel tick
→ chirality bit
→ Fano selector
→ role3
→ local240
→ slot5040
→ Q_xy projection
```

This prevents projection-first interpretation.

The forbidden order is:

```text
symbol → projection → validity
```

The lawful order is:

```text
validity → sequencing → projection
```

---

## 36. Canonical Sequencing Rules

The following rules should be added to `RULES.omi` after the Omicron delimiter band:

```text
# [Rule 0x8D]: Fano Lottery Replay Sequencing
omi-0000-0000-0000-0000-0000-0000-008d-0001/128 MUST derive-fano-lottery-from-canonical-kernel-state

# [Rule 0x8E]: Sexagesimal Logic Clock
omi-0000-0000-0000-0000-0000-0000-008e-0001/128 MUST derive-sexagesimal-logic-clock-from-delta-replay

# [Rule 0x8F]: Omicron Chirality Dataflow
omi-0000-0000-0000-0000-0000-0000-008f-0001/128 MUST preserve-lower-and-upper-omicron-dataflow-chirality

# [Rule 0x90]: Sequencing Before Projection
omi-0000-0000-0000-0000-0000-0000-0090-0001/128 MUST sequence-before-qxy-projection
```

Matching facts should only be added after implementation and tests exist:

```text
omi-0000-0000-0000-0000-0000-0000-008d-1001/128 FACT fano-lottery-replay-sequencing-documented
omi-0000-0000-0000-0000-0000-0000-008e-1001/128 FACT sexagesimal-logic-clock-documented
omi-0000-0000-0000-0000-0000-0000-008f-1001/128 FACT omicron-chirality-dataflow-documented
omi-0000-0000-0000-0000-0000-0000-0090-1001/128 FACT sequencing-before-projection-tested
```

---

## 37. Test Requirements for Sequencing

A conforming implementation should prove:

```text
chirality selection is deterministic
chirality selection is replay-stable
UI/list order does not affect selection
one tick produces one orientation decision
slot5040 = fano7×720 + role3×240 + local240
slot5040 stays in 0..5039
lowercase ο opens a chiral record
uppercase Ο closes a cardinal record
sexagesimal tick loops at 60
orientation sweep loops at 360
master replay loops at 5040
sequencing occurs after Q_frame validation
Q_xy projection occurs after sequencing
```

---

## 38. Final Sequencing Doctrine

The missing sentence is:

```text
Omi-Notation is not only an encapsulation notation; it is a replay-sequencing notation.
```

Full doctrine:

```text
Q_frame validates the shell.
Δ advances the logic clock.
Chirality orients the partition.
Fano selects the incidence.
local240 frames the observation.
slot5040 records the replay.
Q_xy projects the result.
```

Short form:

```text
Validate.
Tick.
Orient.
Select.
Frame.
Replay.
Project.
```

The most important update is this line:

```text
ο is chiral entry; Ο is cardinal closure.
```

That gives the delimiter pair an actual data-flow meaning, not just a visual wrapper.

---

## Part 5: Factorial Branching and the 32-Ion Operator Analogy

---

## 39. Factorial Branching and 32-State Operator Basis

Omi-Notation uses two factorial branches and one upper operator shell.

```text
Even branch:          8! → 6! → 4! → 2!
Odd branch:           7! → 5! → 3! → 1!
Upper operator shell: 12! → 11! → 10! → 9!
```

The even branch governs carrier flow, projection, selector surfaces, and chirality gates.

The odd branch governs selection, replay, hidden root state, role permutation, and identity.

The upper operator shell acts over both branches as a meta-operator and boundary layer.

The short doctrine is:

```text
Odd factorials select.
Even factorials project.
Upper factorials operate.
```

---

### 1. Even Branch: Carrier and Projection

The even branch is:

```text
8! → 6! → 4! → 2!
```

It describes the visible projection path.

| Factorial | Role             | OMI Function                        |
| --------- | ---------------- | ----------------------------------- |
| `8!`      | carrier envelope | outer permutation / carrier space   |
| `6!`      | semantic sweep   | `720 = 3 × 240`                     |
| `4!`      | selector surface | `24`-state selector / 4-bit surface |
| `2!`      | chirality pair   | binary fold / orientation gate      |

This branch handles:

```text
carrier
projection
surface
selector state
chirality
visible frame motion
```

The even branch is where a validated record enters a projectable, oriented carrier path.

---

### 2. Odd Branch: Selection and Replay

The odd branch is:

```text
7! → 5! → 3! → 1!
```

It describes the hidden selection and replay path.

| Factorial | Role                   | OMI Function                          |
| --------- | ---------------------- | ------------------------------------- |
| `7!`      | Fano replay ring       | `5040`-slot replay cycle              |
| `5!`      | hidden packet root     | `120 = 240 / 2`                       |
| `3!`      | S-P-O role permutation | subject / predicate / object ordering |
| `1!`      | unit identity          | root anchor / fixed point             |

This branch handles:

```text
Fano selection
hidden root
S-P-O ordering
identity
replay receipt
```

The odd branch is where a projected local frame closes into replay-stable selection.

---

### 3. The 240-State Bridge

The two branches interlock through the 240-state bridge:

```text
240 = 2 × 5!
240 = 15 × 16
240 = 6! / 3
```

This means:

```text
5!  = hidden root
240 = visible local bridge
6!  = semantic sweep
7!  = Fano replay ring
```

The bridge connects the hidden odd-root branch to the visible even-projection branch.

```text
5! hidden root
    ↓
240 local bridge
    ↓
6! semantic sweep
    ↓
7! replay ring
```

So `240` is not just a count. It is the local frame where selection and projection meet.

---

### 4. Upper Operator Shell

The upper shell is:

```text
12! → 11! → 10! → 9!
```

This shell does not replace the even or odd branches. It operates over them.

| Factorial | Role                     | OMI Function                           |
| --------- | ------------------------ | -------------------------------------- |
| `12!`     | full meta-operator shell | global namespace / maximum envelope    |
| `11!`     | complement shell         | exclusion / missing-face boundary      |
| `10!`     | symbolic bridge          | decimal / bijective / Base36 interface |
| `9!`      | incidence shell          | 3×3 incidence / boundary gate          |

The upper shell governs boundary scaling, symbolic transition, and meta-operator behavior.

It should be described as:

```text
The upper factorial shell operates on the two branches.
It does not validate frames.
It does not replace sequencing.
It does not create projection authority.
```

---

### 5. Branch Interleaving

The factorial tower interleaves numerically:

```text
1! identity
2! chirality pair
3! S-P-O role permutation
4! selector surface
5! hidden packet root
6! semantic sweep
7! Fano replay ring
8! carrier envelope
```

But operationally, the system separates them:

```text
odd  = selection / root / role / replay
even = chirality / selector / sweep / projection
```

This gives the core branch doctrine:

```text
1!, 3!, 5!, 7! form the hidden selection branch.
2!, 4!, 6!, 8! form the visible projection branch.
9!, 10!, 11!, 12! form the upper operator shell.
```

---

### 6. 32-State Operator Basis

The 32-ion / trigintaduonion model is useful because it gives a structural analogy for a 32-state basis.

In OMI, this maps to:

```text
32 = 2^5
0x00..0x1F = 32 hidden/control operator positions
0x20..0x3F = 32 visible structural positions
0x00..0x3F = 64-position compiled native character plane
```

The important boundary is:

```text
The 32-ion model is a structural analogy.
It is not runtime arithmetic authority unless the multiplication table is implemented and tested.
```

So OMI should not claim to perform trigintaduonion multiplication merely because it uses a 32-state basis.

The accurate claim is:

```text
Omi-Notation uses the 32-ion idea as a model for noncommutative,
nonassociative orientation tables over a 5-bit native operator basis.
```

---

### 7. Omicron Delimiter Branch Meaning

The Omicron delimiters now have branch meaning:

```text
ο = little omicron = chiral entry into the even projection branch
Ο = big Omicron    = cardinal closure into the odd selection branch
```

Expanded:

```text
ο enters:
  2! → 4! → 6! → 8!
  chirality → selector → semantic sweep → carrier envelope

Ο closes into:
  1! → 3! → 5! → 7!
  identity → S-P-O role → hidden root → Fano replay ring
```

So a compiled `.imo` record:

```text
ο +/native-address Ο
```

means:

```text
enter through chiral carrier orientation
apply the native operator/address
close into replay-stable selection
```

The delimiter pair is not decorative. It encodes data-flow direction.

---

### 8. Updated Authority Chain

The correct authority chain is:

```text
Q_frame(S) validates the 128-bit wire frame.
Δ advances the logic clock.
2! chirality orients the partition.
ο enters the even projection branch.
4! selector surface resolves the local selector.
6! semantic sweep organizes S-P-O projection.
8! carrier envelope carries the visible state.
240 bridges visible projection with hidden root.
Ο closes into the odd selection branch.
1! identity anchors the unit.
3! role permutation orders S-P-O.
5! hidden root preserves packet root.
7! Fano replay ring records the replay slot.
Q_xy(x,y) projects decoded state into geometry.
```

Short form:

```text
Validate.
Tick.
Orient.
Enter.
Project.
Bridge.
Close.
Select.
Replay.
Project.
```

---

### 9. Canonical Rules

```text
# ============================================================================
# FACTORIAL BRANCHING AND 32-STATE OPERATOR BASIS (Rules 0x91–0x94)
# ============================================================================
# Core Doctrine: Odd factorials select; even factorials project; upper operate.
# ============================================================================

# [Rule 0x91]: Factorial Branch Split
#   OMI separates factorial operations into two branches:
#     Even: 8! → 6! → 4! → 2! (carrier/projection/frame)
#     Odd:  7! → 5! → 3! → 1! (selection/root/replay)
omi-0000-0000-0000-0000-0000-0000-0091-0001/128 MUST preserve-even-and-odd-factorial-branches

# [Rule 0x92]: Upper Factorial Operator Shell
#   The upper shell (12! → 11! → 10! → 9!) operates over both
#   factorial branches as a meta-operator and boundary layer.
omi-0000-0000-0000-0000-0000-0000-0092-0001/128 MUST apply-9-through-12-factorials-as-meta-operator-shell

# [Rule 0x93]: Thirty-Two-State Native Operator Basis
#   The native OMI hidden/control basis is 32 states (2^5 = 32),
#   corresponding to the 0x00..0x1F range in the compiled .imo plane.
omi-0000-0000-0000-0000-0000-0000-0093-0001/128 MUST preserve-32-state-native-operator-basis

# [Rule 0x94]: Hypercomplex Analogy Boundary
#   The trigintaduonion / 32-ion model is a structural analogy for
#   noncommutative, nonassociative orientation tables over a 32-state basis.
#   It is not runtime arithmetic authority unless multiplication tables
#   and tests are implemented.
omi-0000-0000-0000-0000-0000-0000-0094-0001/128 MUST treat-32-ion-model-as-analogy-until-tested
```

### 10. Canonical Facts

```text
# ============================================================================
# FACTORIAL BRANCHING FACTS (0x91–0x94)
# ============================================================================

omi-0000-0000-0000-0000-0000-0000-0091-1001/128 FACT even-odd-factorial-branch-split-documented
omi-0000-0000-0000-0000-0000-0000-0092-1001/128 FACT upper-factorial-operator-shell-documented
omi-0000-0000-0000-0000-0000-0000-0093-1001/128 FACT native-32-state-operator-basis-documented
omi-0000-0000-0000-0000-0000-0000-0094-1001/128 FACT hypercomplex-analogy-boundary-documented
```

### 11. Final Doctrine Summary

```text
ODD factorials select:
  7! → 5! → 3! → 1!

EVEN factorials project:
  8! → 6! → 4! → 2!

UPPER factorials operate:
  12! → 11! → 10! → 9!

ο opens the even carrier/projection branch.
Ο closes into the odd selection/replay branch.

2! chirality acts on 3! role permutation to produce oriented S-P-O scheduling.

240 = 2 × 5! = 15 × 16 = 6! / 3 bridges the branches.

5040 = 7 × 3 × 240 = 7! is the complete replay ring.

The 32-ion model is a structural analogy for the 5-bit native operator basis.
It does not become arithmetic authority until a multiplication table and tests exist.
```

One sentence:

```text
Odd factorials select; even factorials project; upper factorials operate; ο opens the even carrier branch; Ο closes into the odd replay branch; and the 32-ion analogy models the 5-bit native operator basis without replacing Q_frame validation.

---

## 40. Trigintaduonion Process Model for OMI Operator Routing

OMI uses the Cayley–Dickson process pattern as an architectural scaffold:

```text
Cayley–Dickson gives the process pattern.
Trigintaduonion gives the 32-state operator basis.
64-ion gives the expanded native .imo plane.
CIDR gives containment and scope.
OMI gives validation, replay, notation, and projection.
```

The trigintaduonion source provides: 32 basis units `e0..e31`, Cayley–Dickson doubling from sedenions, next doubling into 64-ions, a 32×32 multiplication table, PG(4,2) representation, and 155 distinguished triads.

### The Cayley–Dickson Process as Architectural Pattern

```text
source pair
→ mirrored object
→ doubled basis
→ ordered multiplication/interaction table
→ projective incidence
→ triad routing
```

OMI translation:

```text
.omi source
→ .imo object
→ 32 hidden/control operators
→ 64 native character positions
→ ordered operator interaction table
→ Fano / PG-style incidence routing
→ S-P-O triad router
```

### Module: trigintaduonion-model.js

Provides the 32-state operator basis mapping:

```text
e0..e31  ↔  0x00..0x1F  hidden/control operator positions
64-ion   ↔  0x00..0x3F  full .imo native compiled plane
```

Exports: `BASIS32`, `HIDDEN_OPERATOR_PLANE`, `VISIBLE_OPERATOR_PLANE`, `NATIVE_PLANE64`, `basis32()`, `native64()`, `splitBasis32()`, `branchForBasis()`.

### Module: cayley-dickson-process.js

Models the doubling process without requiring full arithmetic:

```text
(a, b) process pair  →  readable/source side and mirrored/object side
.omi                 →  .imo
0x00..0x1F           →  hidden/control half
0x20..0x3F           →  visible/structural half
0x00..0x3F           →  full native compiled .imo plane
```

Exports: `doublePlane()`, `mirrorOmiToImo()`, `conjugateDescriptor()`, `splitNativePlane64()`.

### Module: operator-table32.js

A 32×32 operator interaction table (1024 cells) modeled after the trigintaduonion multiplication table shape:

```text
32 basis positions × 32 basis positions = 1024 interaction cells
```

Not a full hypercomplex multiplication table. An OMI operator composition table. Exports: `operatorProduct32()`, `operatorSign32()`, `operatorResult32()`, `isOperatorOrderSensitive()`.

### Module: triad-router155.js

155 distinguished triads partitioned into five OMI categories:

```text
45  → RULES
20  → FACTS
15  → CLOSURES
60  → COMBINATORS
15  → CONS
```

Each triad provides an S-P-O incidence route. Exports: `resolveTriad()`, `triadCategory()`, `routeTriadToOmiFile()`, `triadToSpoRoute()`.

### How every OMI feature fits the process model

| OMI feature       | Trig / Cayley–Dickson process role      |
| ----------------- | --------------------------------------- |
| `.omi`            | source half of process pair             |
| `.imo`            | mirrored object half                    |
| `omi → imo`       | source/object conjugation pattern       |
| `0x00..0x1F`      | 32-ion basis model `e0..e31`            |
| `0x00..0x3F`      | 64-ion doubled native plane             |
| `ο`               | entry into chiral/operator process      |
| `Ο`               | closure into stable replay/result       |
| `LL`              | basis/lane selector                     |
| `NN`              | node-body payload coordinate            |
| `MM`              | carrier/projection payload coordinate   |
| CIDR prefix       | scope of process application            |
| `Q_frame`         | validates process shell                 |
| Delta Law         | advances process tick                   |
| Base36            | names derived orbit position            |
| `Q_xy`            | projects process result                 |
| `slot5040`        | records replay receipt                  |
| 155 triads        | S-P-O incidence routing table           |
| five `.omi` files | triad categories and declaration planes |

### Process flow

```text
1. Read .omi source declaration.
2. Validate OMI address with Q_frame.
3. Lower .omi into .imo.
4. Wrap .imo record with ο / Ο.
5. Map native byte into 32-state operator basis.
6. Expand through 64-position native plane when needed.
7. Use operator-table32 for ordered composition.
8. Use triad-router155 for S-P-O incidence.
9. Apply CIDR prefix specificity.
10. Project result through Q_xy.
11. Record replay through slot5040.
```

Short form:

```text
Source.
Validate.
Mirror.
Enter.
Compose.
Route.
Scope.
Project.
Replay.
```

### Canonical Rules

```text
# ============================================================================
# TRIGINTADUONION PROCESS MODEL FOR OPERATOR ROUTING (Rules 0x95–0x98)
# ============================================================================
# Core: OMI uses the Cayley–Dickson process pattern and trigintaduonion
#       32-state operator scaffold for operator composition and routing.
# ============================================================================

# [Rule 0x95]: Trigintaduonion Process Model
#   OMI maps the trigintaduonion 32-state operator basis (e0..e31) to the
#   hidden/control operator plane (0x00..0x1F) as a process scaffold.
omi-0000-0000-0000-0000-0000-0000-0095-0001/128 MUST map-trigintaduonion-process-to-omi-operator-basis

# [Rule 0x96]: Thirty-Two Operator Interaction Table
#   OMI derives operator composition from a 32×32 interaction table
#   (1024 cells) modeled after the trigintaduonion multiplication table shape.
omi-0000-0000-0000-0000-0000-0000-0096-0001/128 MUST derive-omi-operator-interactions-from-32-by-32-process-table

# [Rule 0x97]: Distinguished Triad Incidence Router
#   OMI routes S-P-O incidence through the 155 distinguished triads of the
#   trigintaduonion, partitioned into five OMI file categories.
omi-0000-0000-0000-0000-0000-0000-0097-0001/128 MUST route-spo-incidence-through-155-distinguished-triads

# [Rule 0x98]: Sixty-Four Native Plane Expansion
#   OMI maps the 64-ion doubling pattern to the full 0x00..0x3F native
#   compiled .imo plane.
omi-0000-0000-0000-0000-0000-0000-0098-0001/128 MUST map-64-ion-doubling-to-full-imo-native-plane
```

### Canonical Facts

```text
# ============================================================================
# TRIGINTADUONION PROCESS MODEL FACTS (0x95–0x98)
# ============================================================================

omi-0000-0000-0000-0000-0000-0000-0095-1001/128 FACT trigintaduonion-process-model-documented
omi-0000-0000-0000-0000-0000-0000-0096-1001/128 FACT operator-table32-module-implemented
omi-0000-0000-0000-0000-0000-0000-0097-1001/128 FACT triad-router155-module-implemented
omi-0000-0000-0000-0000-0000-0000-0098-1001/128 FACT native-plane64-expansion-implemented
```

### Final formulation

```text
OMI uses CIDR for scope, Cayley–Dickson for process doubling,
trigintaduonions for the 32-state operator scaffold,
64-ions for the full native plane scaffold,
Base36 for orbit naming,
Q_frame for validation,
and Q_xy for projection.
```

---

## 41. Omicron Prime Principle Ideal Domain (OPPID)

OMI models the PID (principal ideal domain) process as a generator discipline:

```text
Principal Ideal Domain
→ every ideal is generated by one element

Omicron Prime Principle Ideal Domain (OPPID)
→ every lawful derivation region is generated by one canonical OMI pointer
```

The key translation:

```text
PID: every ideal has one generator.

OMI: every lawful derivation region has one principal OMI pointer.
```

### Boundary note

OMI uses the PID **generator discipline**, not PID ring theory. Commutativity, addition, and fraction fields do not apply. OMI is explicitly noncommutative (ο/Ο chirality, operator-table32). The term "ideal" in OMI means "closed derivation region," not a ring-theoretic ideal.

### PID concept → OMI process model

| PID concept       | OMI process model                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------- |
| Domain            | validated OMI address space after `Q_frame(S)=0`                                            |
| Ideal             | closure region of rules/facts/replay/projection generated by an OMI pointer                 |
| Principal ideal   | all records in a region generated from one canonical OMI address                            |
| Generator         | principal OMI pointer / source address                                                      |
| GCD               | common prefix / shared replay root / common closure pointer                                 |
| Bézout relation   | combined witness path proving two OMI pointers share one closure                            |
| UFD               | canonical decomposition of OMI state into frame, prefix, lane, payload, rule, fact, closure |
| Noetherian        | no infinite unresolved derivation chain; every path must close                              |
| Integrally closed | no missing elements from the ambient fraction field                                          | no hidden implicit state outside a declared OMI closure; every derived state must be addressed, tested, replayable, and projectable |
| Euclidean domain  | optional stronger OMI domain with computable reduction metric                               |

### What is an "ideal" in OMI?

A closed derivation region generated by one OMI pointer:

```text
I(a) = all records lawfully derived from address a
```

For `a = omi-0400-03bf-0003-2b04-2f04-0002-039f-04ff/128`:

```text
RULES generated by a
FACTS grounded by a
CLOSURES sealing a
COMBINATORS composing from a
CONS reductions rooted at a
tests proving a
replay receipts from a
visible projections from a
```

### Principal means one canonical pointer

Every region must answer: *What is your generator pointer?*

If a region needs two unrelated generators and cannot reduce to one:

```text
missing closure
missing combinator
missing common prefix
missing replay witness
```

Engineering rule:

```text
No multi-generator region without a closure that explains the shared generator.
```

### GCD as shared OMI root

Given two OMI pointers A and B, their gcd is the smallest shared canonical generator that explains both:

```text
common CIDR prefix
common LL lane
common replay slot family
common closure pointer
common rule-family pointer
common source/object generator
```

### Bézout identity as OMI witness composition

If A and B share a closure generator G, there must be witness combinators X and Y such that:

```text
G = witnessed-composition(A via X, B via Y)
```

This turns "these two ideas relate" into a required witness structure.

### UFD as canonical OMI decomposition

Every valid OMI pointer decomposes uniquely into:

```text
frame shell
lane generator
body payload
carrier payload
delimiter pair
prefix scope
replay/projection path
```

Q_frame validates the factorization shell. Q_xy projects the decoded factors.

### Noetherian as no infinite unresolved derivation

```text
No infinite chain of increasingly specific unresolved derivations.
```

Directly connects to the collaboration doctrine:

```text
intuition → boundary → rule → test → replay → voxel
```

### PID module theorem as OMI component decomposition

Finite OMI modules decompose into cyclic replay components generated by principal pointers:

```text
finite OMI component
= direct sum of cyclic replay regions
= generated by principal OMI pointers
```

Maps to: slot5040 replay cycles, Base36 orbit labels, LL lane generators, triad-router155 incidence regions, operator-table32 composition cells.

### OPPID doctrine

```text
An OMI domain is principal when every derivation region has one canonical
generator pointer.

An OMI generator is prime when it cannot be reduced to a more basic generator
without changing its replay or projection meaning.

An OMI ideal is the closed set of rules, facts, closures, combinators, cons
reductions, tests, replay receipts, and projections generated by that pointer.

An OMI Prime Principle Ideal Domain is an address space where every closed
derivation region is generated by one prime OMI pointer.
```

Short form:

```text
Every lawful OMI region must have a principal pointer.
```

Even shorter:

```text
No closure without a generator.
```

### Module: principal-domain.js

Exports: `principalGenerator()`, `generatedIdeal()`, `commonGenerator()`, `isPrincipalRegion()`, `factorOmiPointer()`.

Purpose: find the one OMI pointer that generates a rule/fact/closure region.

### Module: omi-gcd.js

Exports: `commonPrefixScope()`, `commonLaneLL()`, `commonFrameShell()`, `commonGenerator()`.

Purpose: derive a shared generator from two OMI pointers.

### Module: bezout-witness.js

Exports: `bezoutWitness()`, `verifyWitnessPath()`, `composeWitness()`.

Purpose: prove that two pointers share a generated closure.

### Module: cyclic-module.js

Exports: `cyclicReplayComponent()`, `decomposeReplayModule()`, `directSumComponents()`.

Purpose: decompose finite OMI record sets into principal cyclic replay components.

### Integration into the 12-step flow

The GENERATE step (step 3) sits between VALIDATE and MIRROR:

```text
SOURCE → VALIDATE → GENERATE → MIRROR → ENTER → COMPOSE → ROUTE → SCOPE → TIMING → NAMING → PROJECT → REPLAY
```

After frame validation, the system resolves the principal generator of the region before lowering to bytecode.

### Canonical Rules

```text
# ============================================================================
# OMICRON PRIME PRINCIPLE IDEAL DOMAIN (Rules 0x99–0x9C)
# ============================================================================
# Core: Every lawful OMI derivation region must be generated by one principal
#       OMI pointer. CIDR supplies containment, Q_frame supplies lawful
#       membership, closures supply ideal boundaries, combinators supply
#       Bézout-style witnesses, and replay modules decompose into cyclic
#       components generated by principal pointers.
# ============================================================================

# [Rule 0x99]: Omicron Prime Principle Ideal Domain
omi-0000-0000-0000-0000-0000-0000-0099-0001/128 MUST generate-every-closed-omi-region-from-one-principal-pointer

# [Rule 0x9A]: OMI GCD Common Generator
omi-0000-0000-0000-0000-0000-0000-009a-0001/128 MUST derive-common-generator-for-paired-omi-pointers

# [Rule 0x9B]: OMI Bezout Witness Composition
omi-0000-0000-0000-0000-0000-0000-009b-0001/128 SHOULD witness-shared-closures-through-combinator-composition

# [Rule 0x9C]: OMI Cyclic Replay Module Decomposition
omi-0000-0000-0000-0000-0000-0000-009c-0001/128 SHOULD decompose-finite-omi-record-sets-into-cyclic-replay-components
```

### Canonical Facts

```text
# ============================================================================
# OMICRON PRIME PRINCIPLE IDEAL DOMAIN FACTS (0x99–0x9C)
# ============================================================================

omi-0000-0000-0000-0000-0000-0000-0099-1001/128 FACT principal-domain-model-implemented
omi-0000-0000-0000-0000-0000-0000-009a-1001/128 FACT omi-gcd-common-generator-implemented
omi-0000-0000-0000-0000-0000-0000-009b-1001/128 FACT bezout-witness-composition-implemented
omi-0000-0000-0000-0000-0000-0000-009c-1001/128 FACT cyclic-replay-module-decomposition-implemented
```

### Canonical Facts (0xAC–0xAD)

```text
# ============================================================================
# ADDRESS SELF-SUFFICIENCY AND CLAIM REDUCTION FACTS (0xAC–0xAD)
# ============================================================================

omi-0000-0000-0000-0000-0000-0000-00ac-1001/128 FACT omicron-address-step-encoding-implemented
omi-0000-0000-0000-0000-0000-0000-00ad-1001/128 FACT prefix-and-lens-claim-reduction-parser-implemented
```

### Final comparison sentence

```text
OMI models the PID process by requiring every closed derivation region to be
generated by one principal OMI pointer; CIDR supplies containment, Q_frame
supplies lawful membership, closures supply ideal boundaries, combinators
supply Bézout-style witnesses, and replay modules decompose into cyclic
components generated by principal pointers.
```

## Section 45: Address Self-Sufficiency and Reader Lenses

### 45.1 Core Doctrine

An OMI address is valid iff its Omicron frame encodes the step of its creation.
A prefix does not create validity — it only removes unnecessary claims.

The address is the thing. The prefix is just how much of the thing is being
claimed at that moment.

### 45.2 Syntax

```
omi-<frame>                         Canonical object (self-sufficient)
omi-<frame>/128                     CIDR claim boundary (exact-address claim)
omi-<frame>/128/@60                 CIDR + sexagesimal reader lens
omi-<frame>/128/@60/@16/@4          CIDR + sexagesimal + nibble + tetrahedral
omi-<frame>/@60                     Reader lens only, full CIDR authority
```

`/N` (N = 0..128) — CIDR-style prefix scope / claim boundary.
`/@N` — Reader lens, selects projection plane or extraction cadence.

### 45.3 Lens Registry

| Lens | Name | Domain | Purpose |
|------|------|--------|---------|
| `/@60` | Sexagesimal | 0..59 | Read through sexagesimal cadence clock |
| `/@360` | Orientation | 0..359 | Read through orientation field (6×60) |
| `/@720` | Replay | 0..719 | Read through 6! mirrored replay slot |
| `/@5040` | Fano | 0..5039 | Read through 7! master permutation cycle |
| `/@4` | Tetrahedral | 0..3 | Read through tetrahedral source/extraction plane |
| `/@5` | Five-Source | 0..4 | Read through five-source extraction plane |
| `/@16` | Nibble | 0..15 | Read through carrier nibble plane |

### 45.4 Step Encoding

The creation step is derived from the frame alone:

```
step720(A)  = Q_xy(S3, S4)                    — LL lane coordinate
slot5040(A) = fano7 × 720 + role3 × 240 + local240
```

Where `A = omi-S0-S1-S2-S3-S4-S5-S6-S7` and:
- `S3 = 0x2bLL` (LL lane in multiplex frame)
- `S4 = 0x2fLL` (LL lane repeated)
- `fano7` = Fano plane index (0..6)
- `role3` = role layer index (0..2)
- `local240` = local 240-slot frame offset

### 45.5 Backoff Notation

A claim backoff reduces the CIDR prefix without entering the lens stack:

| Syntax | Meaning | Example |
|--------|---------|---------|
| `/128` | Exact address claim | `omi-.../128` |
| `/128-4` | Backoff exact claim by 4 → `/124` | `omi-.../128-4` |
| `/128-5` | Backoff exact claim by 5 → `/123` | `omi-.../128-5` |

This is distinct from the lens stack. `/128-4` means `/124` (CIDR backoff).
`/128/@4` means tetrahedral reader lens over exact address.

### 45.6 Three-Way Distinction

| Form | Meaning | Rule |
|------|---------|------|
| `/N` | CIDR claim boundary | First slash without `@` |
| `/N-M` | Claim backoff | Reduce claim by M bits |
| `/@N` | Reader lens | Select projection/cadence/extraction |

### 45.7 Invariant

```
∀ address A, ∀ prefix p ∈ [0,128], ∀ backoff b, ∀ lenses L₁, L₂, ...:
  step(A) = step(A/p) = step(A/p-b) = step(A/p/@L₁/@L₂/...)
```

No suffix changes identity. Suffixes only select how the identity is claimed
or viewed. This is the claim-reduction doctrine (Rules 0xAD–0xAE).
```
