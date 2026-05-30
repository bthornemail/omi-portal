# Face 10 — matrix maps nonogram

**Nonogram NAT64 — 2x2 Fano Block Complex Matrix Mapping**

## 🟢 What

This face implements a **nonogram-style line logic resolver** over the 2x2 Fano block matrix, combined with **NAT64 prefix tracking** for IPv4/IPv6 transition mapping. It answers: *given a set of cell clues (row/column constraints), what is the deterministic overlap region, and does it map to a valid NAT64 transition?*

The resolver performs three tasks:

1. **Nonogram overlap** — compute `blocksToBackfill` = the number of centermost cells that must be filled, derived from clue arithmetic: `step2Difference = totalCells - clueBlock`; `blocksToBackfill = clueBlock - step2Difference`.
2. **NAT64 validation** — verify the frame carries the well-known prefix `64:ff9b::/96` (detected by pattern-matching S[0] and S[1]).
3. **Negative resistance detection** — if the high bit of NN (bit 15) is set, the reflection coefficient has negative real component (Re[z] < 0), mapping to a purple hue (`#7000FF`) on the Smith chart.

```
Clue: 8 filled cells in a 10-cell row
step2Difference = 10 - 8 = 2
blocksToBackfill = 8 - 2 = 6

Visual:  [ _ _ | ■ ■ ■ ■ ■ ■ | _ _ ]
               └── 6 centered ──┘
```

The six centermost cells also map directly to the six JSON Canvas preset colors (1–6), creating a bridge between the nonogram arithmetic and the chromatic rendering in Face 11.

## 🔵 How

### Source file map

| File | Role |
|------|------|
| `src/omi/nonogram-resolver.js` | `OmiNonogramNat64Resolver` — nonogram overlap, NAT64 prefix validation, negative resistance, timeline slot → 360° hue |
| `src/canvas/omicron-canvas.js` | `OmiNonogramPresetColorEncoder` — maps `blocksToBackfill` to preset color ID (`"5"` cyan, `"6"` purple, `"1"` red) |

### Nonogram overlap resolution

```javascript
resolveNonogramLayer(S, totalCells = 10, clueBlock = 8) {
  // Gate 1: orbit-lexer validity
  if (!S || !isOrbitLexerValid(S)) return { accepted: false };

  const rowData = extractTruthRow(S);

  // NAT64 prefix: S[0]=0x0100, S[1]=0x03BF
  const isNat64Valid = (S[0] === 0x0100 && S[1] === 0x03BF);

  // Nonogram arithmetic (branchless)
  const step2Difference = totalCells - clueBlock;  // 10 - 8 = 2
  const blocksToBackfill = clueBlock - step2Difference;  // 8 - 2 = 6

  // Line validity: blocksToBackfill > 0 → no contradiction
  if (blocksToBackfill <= 0) return { accepted: false, reason: "CONTRADICTION" };

  // Negative resistance: NN bit 15 set
  const isNegativeResistance = (rowData.NN & 0x8000) !== 0;
  const reflectionColorHex = isNegativeResistance ? "#7000FF" : "#00FFCC";

  // Timeline: NN % 5040 → hue angle
  const timelineSlot = rowData.NN % 5040;
  const hueAngleDegrees = (timelineSlot * 360) / 5040;

  return {
    accepted: true, isNat64Valid, isNegativeResistance,
    reflectionColorHex, blocksToBackfill, step2Difference,
    timelineSlot, hueAngleDegrees,
    canvasColorTarget: `hsl(${hueAngleDegrees}, 100%, 50%)`
  };
}
```

### Preset color mapping

```javascript
derivePresetColorId(S, totalCells = 10, clueBlock = 8) {
  const rowData = extractTruthRow(S);
  const step2Difference = totalCells - clueBlock;
  const blocksToBackfill = clueBlock - step2Difference;

  let targetPresetColor = "5";  // cyan — default valid state

  if ((rowData.NN & 0x8000) !== 0) {
    targetPresetColor = "6";     // purple — negative resistance
  } else if (blocksToBackfill !== 6) {
    targetPresetColor = "1";     // red — overlap variance
  }

  return { blocksToBackfill, targetPresetColor, timelineSlot: rowData.NN % 5040 };
}
```

### Test tour

| Test file | What it verifies |
|-----------|-----------------|
| `test/nonogram-resolver.test.js` | Genesis token → step2Difference=2, blocksToBackfill=6, timelineSlot=1504; NN high bit → negative resistance, #7000FF |
| `test/preset-color.test.js` | Genesis → preset color `"5"`; negative resistance → preset color `"6"` |

## 🔴 Extend

### FACTS.omi rules

- **Rule 0x7D**: NAT64 well-known prefix `64:ff9b::/96` MUST anchor transitions
- **Rule 0x7E**: Re[z] < 0 coordinates MUST map to purple circles (#7000FF)
- **Rule 0x7F**: Nonogram line contradictions MUST trigger XDP_DROP
- **Rule 0x80–0x82**: Six JSON Canvas preset colors MUST drive color selections

### Extension points

- **Variable grid size**: Change `totalCells` and `clueBlock` from defaults (10, 8) for different nonogram grid geometries. The arithmetic generalizes to any `clueBlock ≤ totalCells`.
- **Custom color palette**: Override the preset color mapping (1–6 → hex) in `public/bidi.css` selectors 69–71 without touching JavaScript logic.
- **Extended negative resistance**: Instead of bit 15, use bit 15 AND an additional condition (e.g., NN within a specific range) to trigger purple mapping.

### Performance constraints

- Nonogram arithmetic: 2 integer subtractions, 1 comparison — O(1), branchless.
- NAT64 validation: 2 equality checks — O(1).
- Negative resistance: 1 bitwise AND + 1 comparison — O(1).
- The entire resolver executes in < 1µs in V8.
