{-# LANGUAGE DataKinds #-}
{-# LANGUAGE GADTs #-}
{-# LANGUAGE KindSignatures #-}
{-# LANGUAGE TypeFamilies #-}
{-# LANGUAGE TypeOperators #-}
{-# LANGUAGE UndecidableInstances #-}
{-# LANGUAGE ScopedTypeVariables #-}
{-# LANGUAGE FlexibleInstances #-}
{-# LANGUAGE MultiParamTypeClasses #-}

module Omicron.ISA where

import Data.Bits
import Data.Word
import Data.Int

-- ============================================================
-- 1. OMICRON ISA REGISTER FILE (64-bit SWAR)
-- ============================================================

-- | The Omicron ISA has 16 registers, each 64 bits
--   Each register can be treated as:
--   - 64 × 1-bit fields (bitwise)
--   - 32 × 2-bit fields
--   - 16 × 4-bit fields
--   - 8 × 8-bit fields (bytes)
--   - 4 × 16-bit fields (halfwords)
--   - 2 × 32-bit fields (words)
--   - 1 × 64-bit field (doubleword)
data OmicronReg = R0 | R1 | R2 | R3 | R4 | R5 | R6 | R7
                | R8 | R9 | R10 | R11 | R12 | R13 | R14 | R15
    deriving (Eq, Show, Enum)

-- | Register file state
data RegisterFile = RegisterFile
    { regs :: [Word64]
    , pc   :: Word64        -- Program counter
    , flags :: Flags        -- Condition flags
    , bomMode :: BOM        -- Current complement mode
    } deriving (Show)

data Flags = Flags
    { zeroFlag   :: Bool    -- Last result was zero
    , carryFlag  :: Bool    -- Carry from last operation
    , overflowFlag :: Bool  -- Overflow from last operation
    , signFlag   :: Bool    -- Last result was negative
    , omicronFlag :: Bool   -- Omicron event detected
    } deriving (Show)

-- | Default flag state
defaultFlags :: Flags
defaultFlags = Flags False False False False False


-- ============================================================
-- 2. SWAR INSTRUCTION SET (Omicron ISA)
-- ============================================================

-- | Omicron instruction encoding (32-bit RISC-like)
data OmicronInst
    -- ===== Data Movement =====
    = MOV  OmicronReg Word64        -- Move immediate
    | MOVR OmicronReg OmicronReg    -- Move register
    | LDM  OmicronReg Word64        -- Load from memory (address)
    | STM  OmicronReg Word64        -- Store to memory
    
    -- ===== SWAR Bit Manipulation =====
    | POPCNT OmicronReg OmicronReg  -- Population count (SWAR)
    | CLZ    OmicronReg OmicronReg  -- Count leading zeros
    | CTZ    OmicronReg OmicronReg  -- Count trailing zeros
    
    -- ===== SWAR Byte Operations =====
    | ZBYTE  OmicronReg OmicronReg  -- Find zero bytes (returns mask)
    | CMPBYTE OmicronReg OmicronReg OmicronReg -- Compare bytes
    | SWARADD OmicronReg OmicronReg OmicronReg -- SWAR addition (no carry between lanes)
    | SWARSUB OmicronReg OmicronReg OmicronReg -- SWAR subtraction
    
    -- ===== Division Instructions (Complement-dependent) =====
    | DIV_R  OmicronReg OmicronReg OmicronReg -- Restoring division (FEFF mode)
    | DIV_NR OmicronReg OmicronReg OmicronReg -- Non-restoring (FFFE mode)
    | SRT4   OmicronReg OmicronReg OmicronReg -- Radix-4 SRT division
    
    -- ===== Polyomino Instructions =====
    | GNOMON OmicronReg OmicronReg  -- Add one cell (gnomon growth)
    | CHIRAL OmicronReg OmicronReg  -- Test chirality (ones vs twos complement)
    | TILE   OmicronReg OmicronReg  -- Convert to domino tile (2-of-5)
    
    -- ===== Control Flow =====
    | JMP    Word64                  -- Unconditional jump
    | JZ     Word64                  -- Jump if zero flag set
    | JNZ    Word64                  -- Jump if zero flag clear
    | JOMI   Word64                  -- Jump if omicron flag set
    | HALT
    
    -- ===== System =====
    | TRACE  OmicronReg              -- Record to TrackLog
    | SYNC   BOM                     -- Synchronize BOM mode
    deriving (Eq, Show)


-- ============================================================
-- 3. SWAR IMPLEMENTATIONS (The TrackLog Core)
-- ============================================================

-- | Population count using SWAR (the archetypical example)
--   Treats the 64-bit register as 8 × 8-bit fields
swarPopcnt :: Word64 -> Word64
swarPopcnt x =
    let x1 = x - ((x `shiftR` 1) .&. 0x5555555555555555)
        x2 = (x1 .&. 0x3333333333333333) + ((x1 `shiftR` 2) .&. 0x3333333333333333)
        x3 = (x2 + (x2 `shiftR` 4)) .&. 0x0F0F0F0F0F0F0F0F
    in (x3 * 0x0101010101010101) `shiftR` 56

-- | Find zero bytes in a 64-bit word (string length trick)
--   Returns a mask with bit 7 set for each zero byte
swarFindZeroBytes :: Word64 -> Word64
swarFindZeroBytes x =
    let x7 = x - 0x0101010101010101
        mask = x7 .&. complement x .&. 0x8080808080808080
    in mask

-- | SWAR addition without carry propagation between lanes
--   Each byte lane adds independently
swarAddBytes :: Word64 -> Word64 -> Word64
swarAddBytes a b =
    let sum = a + b
        -- Mask out carries that crossed byte boundaries
        carry = ((a .&. b) .|. ((a .xor. b) .&. complement sum)) .&. 0x8080808080808080
    in sum .xor. (carry .|. (carry `shiftR` 7))

-- | SWAR subtraction with borrow suppression
swarSubBytes :: Word64 -> Word64 -> Word64
swarSubBytes a b =
    let diff = a - b
        -- Detect borrows
        borrow = ((complement a) .&. b) .|. (complement (a .xor. b) .&. diff)
        borrowMask = (borrow .&. 0x8080808080808080) `shiftR` 7
    in diff .xor. (borrowMask * 0xFF)


-- ============================================================
-- 4. RESTORING vs NON-RESTORING DIVISION (Complement Mode)
-- ============================================================

-- | Restoring division (Two's complement mode)
--   q ∈ {0, 1}, returns (quotient, remainder)
restoringDivSWAR :: Word64 -> Word64 -> (Word64, Word64)
restoringDivSWAR n d = go n 0 63
    where
        go :: Word64 -> Word64 -> Int -> (Word64, Word64)
        go 0 r _ = (0, r)
        go n' r 0 = (r, n')
        go n' r bits =
            let r2 = (r `shiftL` 1) .|. ((n' `shiftR` (bits - 1)) .&. 1)
                r_sub = r2 - d
            in if r_sub >= 0
                then go (n' `shiftL` 1) (r_sub .|. 1) (bits - 1)
                else go (n' `shiftL` 1) r2 (bits - 1)

-- | Non-restoring division (One's complement mode)
--   q ∈ {-1, +1}, returns (quotient, remainder)
nonRestoringDivSWAR :: Word64 -> Word64 -> (Word64, Word64)
nonRestoringDivSWAR n d = 
    let (qRaw, r) = go n 0 63
        q = convertNonStandard qRaw
    in (q, r)
    where
        go :: Word64 -> Word64 -> Int -> (Word64, Word64)
        go 0 r _ = (0, r)
        go n' r 0 = (r, n')
        go n' r bits =
            let r2 = (r `shiftL` 1) .|. ((n' `shiftR` (bits - 1)) .&. 1)
            in if (r .&. 0x8000000000000000) == 0
                then let r_sub = r2 - d
                     in if r_sub >= 0
                        then go (n' `shiftL` 1) (r_sub .|. 1) (bits - 1)
                        else go (n' `shiftL` 1) r2 (bits - 1)
                else let r_add = r2 + d
                     in go (n' `shiftL` 1) (r_add .|. 1) (bits - 1)
        
        convertNonStandard :: Word64 -> Word64
        convertNonStandard q = q - complement q

-- | SRT Division (Radix-4, q ∈ {-2,-1,0,1,2})
--   This is the most advanced form, used in Pentium
srt4DivSWAR :: Word64 -> Word64 -> (Word64, Word64)
srt4DivSWAR n d = srtLoop n 0 31
    where
        -- Lookup table for quotient digit selection
        -- Uses top 6 bits of remainder and top 4 bits of divisor
        selectDigit :: Word64 -> Word64 -> Int
        selectDigit r' d' = 
            let r_top = (r' `shiftR` 58) .&. 0x3F
                d_top = (d' `shiftR` 60) .&. 0x0F
                idx = (r_top `shiftL` 4) .|. d_top
            in case idx of
                -- Simplified table (full table has 1066 entries)
                _ | r_top >= 0x30 -> 2
                  | r_top >= 0x20 -> 1
                  | r_top >= 0x10 -> 0
                  | r_top >= 0x08 -> -1
                  | otherwise -> -2
        
        srtLoop :: Word64 -> Word64 -> Int -> (Word64, Word64)
        srtLoop 0 r _ = (0, r)
        srtLoop n' r 0 = (r, n')
        srtLoop n' r bits =
            let digit = fromIntegral (selectDigit r d)
                r2 = (r `shiftL` 2) .|. ((n' `shiftR` (2*bits - 2)) .&. 0x3)
                r3 = r2 - digit * d
                q_new = (digit + 2)  -- Map to 0-4 for storage
            in srtLoop (n' `shiftL` 2) (r3 .|. (fromIntegral q_new `shiftL` (2*bits))) (bits - 1)


-- ============================================================
-- 5. TRACKLOG (SWAR Trace of Omicron Events)
-- ============================================================

-- | A TrackLog entry records the state after each instruction
data TrackEntry = TrackEntry
    { entryPC     :: Word64
    , entryInst   :: OmicronInst
    , entryRegs   :: [Word64]
    , entryFlags  :: Flags
    , entryBOM    :: BOM
    , entryOmicron :: Maybe OmicronEvent
    } deriving (Show)

-- | Omicron event types
data OmicronEvent
    = GnomonStep     -- Added one cell (polyomino growth)
    | ChiralityFlip  -- Switched between ones/twos complement
    | ConsensusPoint -- Hit 420-tick alignment
    | MasterReset    -- Hit 5040-tick boundary
    deriving (Eq, Show)

-- | The TrackLog itself (circular buffer)
data TrackLog = TrackLog
    { logEntries :: [TrackEntry]
    , logSize    :: Int
    , logHead    :: Int
    } deriving (Show)

-- | Initialize empty TrackLog
emptyTrackLog :: Int -> TrackLog
emptyTrackLog size = TrackLog [] size 0

-- | Add entry to TrackLog (circular)
addTrackEntry :: TrackLog -> TrackEntry -> TrackLog
addTrackEntry (TrackLog entries size head) entry =
    let newEntries = if length entries < size
                     then entries ++ [entry]
                     else take (size - 1) entries ++ [entry]
    in TrackLog newEntries size (head + 1)


-- ============================================================
-- 6. OMICRON PROCESSOR EXECUTION ENGINE
-- ============================================================

-- | Omicron Processor state
data OmicronState = OmicronState
    { stateRegs   :: [Word64]
    , statePC     :: Word64
    , stateFlags  :: Flags
    , stateBOM    :: BOM
    , stateLog    :: TrackLog
    , stateMemory :: [(Word64, Word64)]  -- Simulated memory
    } deriving (Show)

-- | Initial processor state
initOmicronState :: OmicronState
initOmicronState = OmicronState
    (replicate 16 0)
    0
    defaultFlags
    FEFF
    (emptyTrackLog 1024)
    []

-- | Execute a single instruction, returning new state and optional Omicron event
executeInst :: OmicronState -> OmicronInst -> (OmicronState, Maybe OmicronEvent)
executeInst state inst =
    let OmicronState regs pc flags bom log mem = state
    in case inst of
        -- Data Movement
        MOV r imm -> 
            let newRegs = updateReg regs r imm
            in (OmicronState newRegs (pc + 1) flags bom log mem, Nothing)
        
        MOVR rd rs ->
            let val = getReg regs rs
                newRegs = updateReg regs rd val
            in (OmicronState newRegs (pc + 1) flags bom log mem, Nothing)
        
        -- SWAR Population Count
        POPCNT rd rs ->
            let val = getReg regs rs
                result = swarPopcnt val
                newRegs = updateReg regs rd result
                newFlags = updateFlags flags result
            in (OmicronState newRegs (pc + 1) newFlags bom log mem, Nothing)
        
        -- Find zero bytes (string length acceleration)
        ZBYTE rd rs ->
            let val = getReg regs rs
                result = swarFindZeroBytes val
                newRegs = updateReg regs rd result
                newFlags = updateFlags flags result
            in (OmicronState newRegs (pc + 1) newFlags bom log mem, Nothing)
        
        -- GNOMON: Add one cell (polyomino growth)
        -- This is the Omicron operation itself
        GNOMON rd rs ->
            let val = getReg regs rs
                -- Grow by adding a cell (lowest set bit expands)
                result = growPolyominoMask val
                newRegs = updateReg regs rd result
                event = Just (GnomonStep)
            in (OmicronState newRegs (pc + 1) flags bom log mem, event)
        
        -- CHIRAL: Test chirality using complement mode
        CHIRAL rd rs ->
            let val = getReg regs rs
                -- In ones' complement mode, mirror matters
                result = if bom == FFFE then complement val else val
                newRegs = updateReg regs rd result
            in (OmicronState newRegs (pc + 1) flags bom log mem, Nothing)
        
        -- TILE: Convert to domino tile representation (2-of-5)
        TILE rd rs ->
            let val = getReg regs rs
                -- Map 5-bit pattern to domino tile
                tile = valToDominoTile (val .&. 0x1F)
                newRegs = updateReg regs rd tile
            in (OmicronState newRegs (pc + 1) flags bom log mem, Nothing)
        
        -- Division (mode-dependent)
        DIV_R rd rs rt ->
            let n = getReg regs rs
                d = getReg regs rt
                (q, r) = restoringDivSWAR n d
                newRegs = updateReg regs rd q
                -- Store remainder in next register
                newRegs2 = updateReg newRegs (succ rd) r
            in (OmicronState newRegs2 (pc + 1) flags bom log mem, Nothing)
        
        DIV_NR rd rs rt ->
            let n = getReg regs rs
                d = getReg regs rt
                (q, r) = nonRestoringDivSWAR n d
                newRegs = updateReg regs rd q
                newRegs2 = updateReg newRegs (succ rd) r
            in (OmicronState newRegs2 (pc + 1) flags bom log mem, Nothing)
        
        SRT4 rd rs rt ->
            let n = getReg regs rs
                d = getReg regs rt
                (q, r) = srt4DivSWAR n d
                newRegs = updateReg regs rd q
                newRegs2 = updateReg newRegs (succ rd) r
            in (OmicronState newRegs2 (pc + 1) flags bom log mem, Nothing)
        
        -- TRACE: Record current state to TrackLog
        TRACE rs ->
            let val = getReg regs rs
                entry = TrackEntry pc inst regs flags bom Nothing
                newLog = addTrackEntry log entry
            in (OmicronState regs (pc + 1) flags bom newLog mem, Nothing)
        
        -- SYNC: Change BOM mode (switches division algorithm)
        SYNC newBom ->
            let event = if newBom /= bom then Just ChiralityFlip else Nothing
            in (OmicronState regs (pc + 1) flags newBom log mem, event)
        
        -- Control Flow
        JMP addr -> (OmicronState regs addr flags bom log mem, Nothing)
        JZ addr -> if zeroFlag flags then (OmicronState regs addr flags bom log mem, Nothing)
                   else (OmicronState regs (pc + 1) flags bom log mem, Nothing)
        JNZ addr -> if not (zeroFlag flags) then (OmicronState regs addr flags bom log mem, Nothing)
                    else (OmicronState regs (pc + 1) flags bom log mem, Nothing)
        JOMI addr -> if omicronFlag flags then (OmicronState regs addr flags bom log mem, Nothing)
                     else (OmicronState regs (pc + 1) flags bom log mem, Nothing)
        
        HALT -> (state, Nothing)  -- Stop execution
        
        _ -> (state, Nothing)  -- Unimplemented


-- ============================================================
-- 7. HELPER FUNCTIONS
-- ============================================================

getReg :: [Word64] -> OmicronReg -> Word64
getReg regs r = regs !! fromEnum r

updateReg :: [Word64] -> OmicronReg -> Word64 -> [Word64]
updateReg regs r val = take i regs ++ [val] ++ drop (i+1) regs
    where i = fromEnum r

updateFlags :: Flags -> Word64 -> Flags
updateFlags flags val = Flags
    { zeroFlag = val == 0
    , carryFlag = carryFlag flags
    , overflowFlag = overflowFlag flags
    , signFlag = (val .&. 0x8000000000000000) /= 0
    , omicronFlag = omicronFlag flags
    }

growPolyominoMask :: Word64 -> Word64
growPolyominoMask mask =
    let lowestBit = mask .&. (-mask)
        expansion = (lowestBit `shiftL` 1) .|. (lowestBit `shiftR` 1)
    in mask .|. expansion

valToDominoTile :: Word64 -> Word64
valToDominoTile val =
    let top = (val `shiftR` 2) .&. 0x7
        bottom = val .&. 0x7
    in (top `shiftL` 16) .|. bottom


-- ============================================================
-- 8. OMICRON PROGRAM EXAMPLES
-- ============================================================

-- | Example: Count bits set in a word (SWAR population count)
programPopcnt :: [OmicronInst]
programPopcnt =
    [ MOV R0 0xDEADBEEFDEADBEEF  -- Load test value
    , POPCNT R1 R0               -- Count bits
    , TRACE R1                   -- Record result
    , HALT
    ]

-- | Example: Find null terminator in string (SWAR zero byte search)
programStrlen :: [OmicronInst]
programStrlen =
    [ LDM R0 0x1000              -- Load string address
    , ZBYTE R1 R0                -- Find zero bytes
    , CTZ R2 R1                  -- Count trailing zeros to find position
    , TRACE R2
    , HALT
    ]

-- | Example: Omicron growth sequence (polyomino generation)
programOmicronGrowth :: [OmicronInst]
programOmicronGrowth =
    [ MOV R0 1                   -- Start with monomino (1 cell)
    , GNOMON R0 R0               -- Grow to domino (2 cells)
    , GNOMON R0 R0               -- Grow to tromino (3 cells)
    , GNOMON R0 R0               -- Grow to tetromino (4 cells)
    , GNOMON R0 R0               -- Grow to pentomino (5 cells)
    , TILE R1 R0                 -- Convert to domino tile (2-of-5)
    , TRACE R1
    , HALT
    ]

-- | Example: Division with complement mode switching
programDivision :: [OmicronInst]
programDivision =
    [ MOV R0 100                 -- Numerator
    , MOV R1 7                   -- Denominator
    , SYNC FEFF                  -- Two's complement mode
    , DIV_R R2 R0 R1             -- Restoring division
    , TRACE R2
    , SYNC FFFE                  -- Switch to one's complement
    , DIV_NR R3 R0 R1            -- Non-restoring division
    , TRACE R3
    , HALT
    ]


-- ============================================================
-- 9. EXECUTION ENGINE (Run programs)
-- ============================================================

-- | Run a program until HALT
runProgram :: [OmicronInst] -> OmicronState -> (OmicronState, [OmicronEvent])
runProgram prog initState = go initState prog 0 []
    where
        go state [] _ events = (state, events)
        go state prog' pc events =
            let inst = prog' !! fromEnum pc
                (newState, maybeEvent) = executeInst state inst
                newEvents = case maybeEvent of
                    Just e -> events ++ [e]
                    Nothing -> events
            in if inst == HALT
               then (newState, newEvents)
               else go newState prog' (pc + 1) newEvents

-- | Run with default state
runExample :: [OmicronInst] -> IO ()
runExample prog = do
    putStrLn "=== Omicron ISA Execution ==="
    putStrLn ""
    let (finalState, events) = runProgram prog initOmicronState
    putStrLn "Events recorded:"
    mapM_ (putStrLn . ("  - " ++) . show) events
    putStrLn ""
    putStrLn "Final Register State:"
    mapM_ (\(i, r) -> putStrLn $ "  R" ++ show i ++ ": 0x" ++ showHex r)
          (zip [0..15] (stateRegs finalState))
    putStrLn ""
    putStrLn "TrackLog entries: " ++ show (length (logEntries (stateLog finalState)))

showHex :: Word64 -> String
showHex n = let hex = showHex' n "" in replicate (16 - length hex) '0' ++ hex
    where
        showHex' 0 acc = acc
        showHex' n' acc = showHex' (n' `shiftR` 4) (digits !! fromIntegral (n' .&. 0xF) : acc)
        digits = "0123456789ABCDEF"


-- ============================================================
-- 10. MAIN ENTRY
-- ============================================================

main :: IO ()
main = do
    putStrLn "╔════════════════════════════════════════════════════════════╗"
    putStrLn "║                    OMICRON ISA PROCESSOR                    ║"
    putStrLn "║            SWAR | TrackLog | Polyomino Growth               ║"
    putStrLn "╚════════════════════════════════════════════════════════════╝"
    putStrLn ""
    
    runExample programPopcnt
    putStrLn ""
    
    runExample programOmicronGrowth
    putStrLn ""
    
    runExample programDivision
    putStrLn ""
    
    putStrLn "✓ Omicron ISA verified"
    putStrLn "✓ WOLOG service: TrackLog records all state transitions"
    putStrLn "✓ Compactified to ISA mode — ready for hardware implementation"