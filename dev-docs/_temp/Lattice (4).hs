-- | A15 — Lattice Projection Law
--
-- Aztec is geometry only. Encoding is owned by A13 (ESC depth) + A2/A3
-- (mixed radix). This module adds only the placement step:
--
--   Artifact
--     -> canonicalBits          (Layer 3, AtomicKernel)
--     -> escEncode / A13        (Layer 9, AtomicKernel)
--     -> mixedEncode coords     (Layer 2, AtomicKernel)
--     -> latticePlace           (THIS MODULE — geometry only)
--     -> optional PNG render    (external, not in this module)
--
-- Every function in this module is pure. Nothing here encodes, hashes,
-- or interprets content. It only answers the question:
--   "given a (channel, lane) identity, what grid position does it occupy?"
--
-- Spec authority: AZTEC_ARTIFACT_SPEC.md, AZTEC_COORD_TABLE.md
-- Depends on: AtomicKernel (Plane, Word8, escEncode, mixedEncode,
--             canonicalBits, Artifact)

module AtomicKernel.Lattice where

import Data.List   (find, sortOn)
import Data.Word   (Word8)

import AtomicKernel
  ( Plane(..)
  , Artifact
  , canonicalBits
  , escEncode
  , mixedEncode
  , radicesForDepth
  )

-- ============================================================================
-- TYPES
-- ============================================================================

-- | A position in the 27x27 module grid.
-- Origin is top-left. X increases right, Y increases down.
-- Spec: AZTEC_COORD_TABLE §2
type GridPos = (Int, Int)

-- | Chebyshev distance from center (13,13).
-- Spec: AZTEC_COORD_TABLE §1
chebyshev :: GridPos -> Int
chebyshev (x, y) = max (abs (x - 13)) (abs (y - 13))

-- | Quadrant of a grid position relative to center.
-- Spec: AZTEC_COORD_TABLE §4
data Quadrant = TR | BR | BL | TL deriving (Eq, Show)

quadrantOf :: GridPos -> Quadrant
quadrantOf (x, y)
  | x >= 13 && y <  13 = TR
  | x >  13 && y >= 13 = BR
  | x <= 13 && y >  13 = BL
  | otherwise           = TL

-- | A lane number 0..15. Lane 0 is the null lane (no data).
type Lane = Word8

-- | One entry in the normative coordinate table.
data LatticeEntry = LatticeEntry
  { leChannel  :: Int       -- 0=US, 1=RS, 2=GS, 3=FS
  , lePlane    :: Plane     -- US | RS | GS | FS
  , leLane     :: Lane      -- 1..15 (non-null)
  , lePos      :: GridPos   -- normative (x, y)
  , leR        :: Int       -- Chebyshev radius (verification)
  , leQuadrant :: Quadrant  -- (verification)
  } deriving (Eq, Show)

-- ============================================================================
-- CHANNEL MAPPING
-- Spec: AZTEC_COORD_TABLE §3
-- US (innermost) -> CH 0, r in {4,5}
-- RS             -> CH 1, r in {6,7}
-- GS             -> CH 2, r in {8,9}
-- FS (outermost) -> CH 3, r in {10,11}
-- ============================================================================

planeToChannel :: Plane -> Int
planeToChannel US = 0
planeToChannel RS = 1
planeToChannel GS = 2
planeToChannel FS = 3

channelToPlane :: Int -> Plane
channelToPlane 0 = US
channelToPlane 1 = RS
channelToPlane 2 = GS
channelToPlane 3 = FS
channelToPlane n = error $ "channelToPlane: invalid channel " ++ show n

-- | Inner ring radius for a channel.
-- Spec: r_base = 4 + 2 * CH  (AZTEC_COORD_TABLE §9)
channelInnerR :: Int -> Int
channelInnerR ch = 4 + 2 * ch

-- ============================================================================
-- NORMATIVE COORDINATE TABLE
-- Source: AZTEC_COORD_TABLE.md §6 + §10 (JSON).
-- 60 entries: 4 channels * 15 non-null lanes.
-- Lane 0 is the null lane — positions in §7, not included here.
-- ============================================================================

-- | The normative 60-entry coordinate table.
-- Spec: AZTEC_COORD_TABLE §6 — "any compliant implementation must place and
-- read the 60 canonical state modules at exactly these positions."
normativeTable :: [LatticeEntry]
normativeTable = map mkEntry rawTable
  where
    mkEntry (ch, ln, x, y) = LatticeEntry
      { leChannel  = ch
      , lePlane    = channelToPlane ch
      , leLane     = ln
      , lePos      = (x, y)
      , leR        = chebyshev (x, y)
      , leQuadrant = quadrantOf (x, y)
      }

-- Raw table: (channel, lane, x, y)
-- Transcribed verbatim from AZTEC_COORD_TABLE §6.
rawTable :: [(Int, Lane, Int, Int)]
rawTable =
  -- CH 0 — US — r in {4,5}
  [ (0,  1, 17, 13), (0,  2, 16, 17), (0,  3, 11, 17)
  , (0,  4,  9, 15), (0,  5,  9, 11), (0,  6, 12,  9)
  , (0,  7, 18,  8), (0,  8, 18, 12), (0,  9, 18, 16)
  , (0, 10, 15, 18), (0, 11, 10, 18), (0, 12,  8, 16)
  , (0, 13,  8, 12), (0, 14,  9,  8), (0, 15, 14,  8)
  -- CH 1 — RS — r in {6,7}
  , (1,  1, 19, 13), (1,  2, 18, 19), (1,  3, 11, 19)
  , (1,  4,  7, 17), (1,  5,  7, 11), (1,  6, 10,  7)
  , (1,  7, 17,  7), (1,  8, 20, 10), (1,  9, 20, 16)
  , (1, 10, 17, 20), (1, 11, 10, 20), (1, 12,  6, 18)
  , (1, 13,  6, 12), (1, 14,  7,  6), (1, 15, 14,  6)
  -- CH 2 — GS — r in {8,9}
  , (2,  1, 21, 13), (2,  2, 20, 21), (2,  3, 11, 21)
  , (2,  4,  5, 19), (2,  5,  5, 11), (2,  6,  8,  5)
  , (2,  7, 17,  5), (2,  8, 22,  8), (2,  9, 22, 16)
  , (2, 10, 19, 22), (2, 11, 10, 22), (2, 12,  4, 20)
  , (2, 13,  4, 12), (2, 14,  5,  4), (2, 15, 14,  4)
  -- CH 3 — FS — r in {10,11}
  , (3,  1, 23, 13), (3,  2, 22, 23), (3,  3, 11, 23)
  , (3,  4,  3, 21), (3,  5,  3, 11), (3,  6,  6,  3)
  , (3,  7, 17,  3), (3,  8, 24,  6), (3,  9, 24, 16)
  , (3, 10, 21, 24), (3, 11, 10, 24), (3, 12,  2, 22)
  , (3, 13,  2, 12), (3, 14,  3,  2), (3, 15, 14,  2)
  ]

-- ============================================================================
-- LOOKUP FUNCTIONS
-- ============================================================================

-- | Look up the grid position for a (Plane, Lane) pair.
-- Returns Nothing for lane 0 (null lane) — no data position.
-- Returns Nothing if the pair is not in the normative table.
lookupPos :: Plane -> Lane -> Maybe GridPos
lookupPos _  0    = Nothing   -- null lane has no data position
lookupPos pl lane =
  fmap lePos $
  find (\e -> lePlane e == pl && leLane e == lane) normativeTable

-- | Look up the (Plane, Lane) identity at a grid position.
-- Returns Nothing if the position is not a canonical state module.
lookupState :: GridPos -> Maybe (Plane, Lane)
lookupState pos =
  fmap (\e -> (lePlane e, leLane e)) $
  find (\e -> lePos e == pos) normativeTable

-- | All 60 positions occupied by canonical state modules, in
-- channel-then-lane order (US lane 1 .. FS lane 15).
allCanonicalPositions :: [(Plane, Lane, GridPos)]
allCanonicalPositions =
  [ (lePlane e, leLane e, lePos e)
  | e <- sortOn (\e -> (leChannel e, leLane e)) normativeTable
  ]

-- | Null lane positions (informational, not data-carrying).
-- Spec: AZTEC_COORD_TABLE §7
nullLanePos :: Plane -> GridPos
nullLanePos US = (13,  9)
nullLanePos RS = (13,  6)
nullLanePos GS = (13,  4)
nullLanePos FS = (13,  2)

-- ============================================================================
-- LATTICE PIPELINE
-- Spec: document §2 unified encoding pipeline
-- ============================================================================

-- | Depth rule: map a byte value to an A13 ESC depth.
-- Values 0–127 fit at depth 1 (direct byte).
-- Values 128–255 require depth 2 (radix [128]).
-- Larger integers (from coordinate fields) scale accordingly.
-- This is the only caller-visible policy decision in the pipeline.
depthRule :: Integer -> Int
depthRule v
  | v < 128   = 1
  | v < 16384 = 2  -- 128^2
  | v < 65536 = 3  -- within [36,8] extended
  | otherwise = 4

-- | Step 1: canonical bytes from artifact.
artifactBytes :: Artifact -> [Word8]
artifactBytes = canonicalBits

-- | Step 2: interpret bytes as integer stream.
bytesToIntegers :: [Word8] -> [Integer]
bytesToIntegers = map fromIntegral

-- | Step 3: apply A13 ESC-depth encoding to produce a self-delimiting stream.
applyA13 :: [Integer] -> [Word8]
applyA13 = concatMap (\v -> escEncode v (depthRule v))

-- | Step 4: produce a coordinate field via mixed-radix projection.
-- Each integer is encoded with radices appropriate to its depth.
-- The coordinate field is a [Integer] — not a byte stream.
toCoordField :: [Integer] -> [Integer]
toCoordField vs = concatMap encodeOne vs
  where
    encodeOne v = mixedEncode v (radicesForDepth (depthRule v))

-- | Step 5: place coordinates onto the Aztec lattice.
-- Returns (coord_index, GridPos) pairs.
-- Each coordinate index maps to a canonical (Plane, Lane) slot in order.
-- Coordinates that exceed the 60-slot capacity are returned as overflow.
latticePlace :: [Integer] -> ([(Integer, GridPos)], [Integer])
latticePlace coords =
  let slots    = map (\(_, _, p) -> p) allCanonicalPositions
      paired   = zip coords slots
      overflow = drop (length slots) coords
  in (paired, overflow)

-- | Full pipeline: Artifact -> placed coordinates + overflow.
-- Overflow occurs when the artifact's coordinate field exceeds 60 slots.
-- Multi-symbol artifacts (semantic graph) handle overflow via structural
-- edges (FS/GS/RS/US typed boundaries) per AZTEC_ARTIFACT_SPEC §7.
artifactToLattice :: Artifact -> ([(Integer, GridPos)], [Integer])
artifactToLattice =
  latticePlace . toCoordField . bytesToIntegers . artifactBytes

-- ============================================================================
-- INVARIANT VERIFICATION
-- ============================================================================

-- | INV-L1: all 60 table entries are within the 27x27 grid bounds.
invL1_boundsCheck :: Bool
invL1_boundsCheck =
  all (\e -> let (x, y) = lePos e
             in x >= 0 && x <= 26 && y >= 0 && y <= 26)
      normativeTable

-- | INV-L2: no two entries share the same grid position.
invL2_noCollisions :: Bool
invL2_noCollisions =
  let positions = map lePos normativeTable
  in length positions == length (nubBy (==) positions)
  where
    nubBy _ [] = []
    nubBy eq (x:xs) = x : nubBy eq (filter (not . eq x) xs)

-- | INV-L3: every entry's stored r equals chebyshev of its position.
invL3_radiusConsistent :: Bool
invL3_radiusConsistent =
  all (\e -> leR e == chebyshev (lePos e)) normativeTable

-- | INV-L4: every entry's r is in the correct range for its channel.
-- CH 0 (US): r in {4,5}, CH 1 (RS): {6,7}, CH 2 (GS): {8,9}, CH 3 (FS): {10,11}
invL4_channelRing :: Bool
invL4_channelRing =
  all (\e ->
    let rBase = channelInnerR (leChannel e)
    in leR e == rBase || leR e == rBase + 1)
  normativeTable

-- | INV-L5: exactly 60 entries, 15 per channel.
invL5_count :: Bool
invL5_count =
  length normativeTable == 60
  && all (\ch -> length (filter ((== ch) . leChannel) normativeTable) == 15)
         [0..3]

-- | INV-L6: table entries match the pattern properties from §8.
-- Lane 1 always has Y=13 (center row), X increasing with channel.
invL6_lane1CenterRow :: Bool
invL6_lane1CenterRow =
  all (\e -> snd (lePos e) == 13)
      (filter ((== 1) . leLane) normativeTable)

-- | INV-L7: lane 15 always has Y decreasing from center (top edge).
-- Positions: (14,8), (14,6), (14,4), (14,2) for CH 0..3.
invL7_lane15TopEdge :: Bool
invL7_lane15TopEdge =
  map lePos (sortOn leChannel $ filter ((== 15) . leLane) normativeTable)
  == [(14,8),(14,6),(14,4),(14,2)]

-- | Run all lattice invariants. Returns list of (name, result).
checkLatticeInvariants :: [(String, Bool)]
checkLatticeInvariants =
  [ ("L1 bounds check",        invL1_boundsCheck)
  , ("L2 no collisions",       invL2_noCollisions)
  , ("L3 radius consistent",   invL3_radiusConsistent)
  , ("L4 channel ring",        invL4_channelRing)
  , ("L5 count 60/15 per ch",  invL5_count)
  , ("L6 lane1 center row",    invL6_lane1CenterRow)
  , ("L7 lane15 top edge",     invL7_lane15TopEdge)
  ]

-- ============================================================================
-- EXAMPLE
-- ============================================================================

runLatticeExample :: IO ()
runLatticeExample = do
  putStrLn "=== A15 Lattice Projection ===\n"

  putStrLn "--- Normative table invariants ---"
  mapM_ (\(name, ok) ->
    putStrLn $ "  " ++ (if ok then "[OK] " else "[FAIL] ") ++ name)
    checkLatticeInvariants
  putStrLn ""

  putStrLn "--- lookupPos samples ---"
  let samples = [(US,1),(RS,7),(GS,15),(FS,1),(US,0)]
  mapM_ (\(pl, ln) ->
    putStrLn $ "  " ++ show pl ++ " lane " ++ show ln
            ++ " -> " ++ show (lookupPos pl ln))
    samples
  putStrLn ""

  putStrLn "--- lookupState samples ---"
  let posSamples = [(17,13),(14,2),(0,0),(13,9)]
  mapM_ (\pos ->
    putStrLn $ "  " ++ show pos ++ " -> " ++ show (lookupState pos))
    posSamples
  putStrLn ""

  putStrLn "--- Pipeline: small artifact ---"
  let leaf = Artifact [0x48, 0x65, 0x6C, 0x6C, 0x6F] []  -- "Hello"
  let (placed, overflow) = artifactToLattice leaf
  putStrLn $ "  canonical bytes:   " ++ show (artifactBytes leaf)
  putStrLn $ "  coords produced:   " ++ show (length placed + length overflow)
  putStrLn $ "  placed in lattice: " ++ show (length placed)
  putStrLn $ "  overflow:          " ++ show (length overflow)
  putStrLn ""
  putStrLn "  First 5 placements:"
  mapM_ (\(coord, pos) ->
    putStrLn $ "    coord=" ++ show coord ++ " -> " ++ show pos)
    (take 5 placed)
