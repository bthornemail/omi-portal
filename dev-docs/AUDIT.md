# OMI Portal Audit - 2026-06-12

## Executive Summary

Current local repository state is coherent and verified. The active branch contains a committed OMI Pipe milestone that adds RS replay proof, GF(256) RS proof, rewrite-register doctrine, and build compatibility fixes for the GVFS/SFTP workspace.

The main operational blocker is publication: the local commit exists, but the branch has not been pushed because GitHub credentials are not usable in this environment.

## Current Git State

```text
branch: omi-pipe-rs-proof
HEAD:   829d3ce add gf256 rs proof and rewrite register doctrine
remote: git@github.com:bthornemail/omi-portal.git
```

Branch relationship at audit time:

```text
origin/main...HEAD                  0 behind / 5 ahead
origin/omi-pipe-causal-proof...HEAD 0 behind / 1 ahead
```

The local working tree was clean before this audit file was added.

## Publication Status

Local commit is ready:

```text
829d3ce add gf256 rs proof and rewrite register doctrine
```

Push attempts failed for environment credentials, not code:

```text
gh auth status -> token invalid
git push over SSH -> Permission denied (publickey)
```

Required next action to publish:

```bash
gh auth login -h github.com
# or install/configure a GitHub SSH key accepted by bthornemail/omi-portal
git push -u origin omi-pipe-rs-proof
```

## Implemented Milestone

The local commit contains four connected bodies of work:

1. OMI Pipe RS proof replay with `rs=xor`.
2. GF(256) RS proof replay with `rs=gf256`.
3. Rewrite-register doctrine canon.
4. Build/test compatibility fixes for the mounted workspace.

## Pipe Proof Stack

The current accepted-candidate path is:

```text
valid frame
-> valid 0x3F scale and pipe scope
-> candidate shape validation
-> sorted subset validation
-> candidate-root presence
-> RS proof replay
-> causal closure proof
-> CAR/CDR/CID witness
-> accepted receipt
```

Supported RS proof modes:

```text
rs=xor
rs=gf256
```

`rs=xor` remains a deterministic placeholder mode.

`rs=gf256` validates:

```text
gf=0x11d
layout=root16
first k sorted subset indices as replay basis
Lagrange interpolation at x=0 over two root16 byte lanes
```

The accepted GF256 receipt includes:

```text
rs=gf256;gf=0x11d;layout=root16;rs-proof=replayed
```

## Doctrine State

The rewrite-register doctrine is now canonicalized in:

```text
DOCTRINE.md
```

Core canon:

```text
OMI is not a database. It is a versioned rewrite register.
```

The doctrine page explicitly separates OMI from database semantics:

```text
source of truth -> rewrite table -> routed interpretation -> receipt
```

It also states the central inversion from conventional computing:

```text
Traditional computing stores values and computes transformations.
OMI stores transformations and computes values.
```

## Build And Filesystem Compatibility

Two filesystem-specific build issues were found and stabilized:

1. `ld` could not write linked binaries directly under the GVFS/SFTP mount.
   - `build-omi-pipe` now links to `/tmp/omi-pipe`, then copies into `bin/omi-pipe`.

2. Vite's post-build HTML hoist used `copyFileSync`, which failed on the mount with `ENOTSUP`.
   - `vite.config.js` now hoists via `readFileSync` + `writeFileSync`.

These changes are pragmatic workspace compatibility fixes, not protocol changes.

## Verification Status

The following checks passed in this workspace after the current milestone:

```bash
npm run build
make verify-safe
npm test
node --test test/docs-manifest.test.js test/research-assimilation.test.js
make test-omi-pipe test-omi-pipe-network-stdin test-omi-pipe-mcrsgsp \
  test-omi-pipe-mcrsgsp-reconstruction test-omi-pipe-omi-acceptance \
  test-omi-pipe-causal-proof test-omi-pipe-rs-proof \
  test-omi-pipe-gf256-rs-proof
```

Not run in this audit pass:

```bash
make verify-ebpf
make docker-build
make qemu-test
make release-dry-run patch
```

Those remain heavier environment-dependent gates.

## Findings

### High - Remote publication is blocked

The code is locally committed, but not pushed. GitHub CLI has an invalid token and SSH authentication is rejected. Until credentials are repaired, remote CI/PR review cannot happen.

### Medium - Branch name no longer fully describes scope

The current branch is named:

```text
omi-pipe-rs-proof
```

It now contains:

```text
rs=xor proof
gf256 proof
rewrite-register doctrine
build compatibility fixes
```

This is acceptable for a milestone branch, but a remote PR title should make the broadened scope clear.

### Medium - GF256 extra-fragment consistency is intentionally deferred

When `subset_count > k`, GF256 replay uses the first `k` sorted subset indices. Extra selected fragments are required to have roots, but all k-combinations are not cross-checked for consistency.

This matches the branch plan, but the next proof-hardening branch should check consistency across extra points or define explicit basis metadata in receipts.

### Medium - Full Reed-Solomon decoding is still not implemented

The GF256 proof validates reconstruction sufficiency at the root-witness layer. It does not reconstruct arbitrary payload bytes or blobs.

This is by design, but downstream readers should not treat `rs=gf256` as full object reconstruction.

### Low - `build-omi-pipe` uses a fixed `/tmp/omi-pipe` output path

This fixed path solves the GVFS linker issue but could collide under parallel `make` runs. If parallelism becomes important, use a PID-scoped temp binary and then copy into `bin/omi-pipe`.

### Low - `bin/omi-pipe` remains tracked

The repository already tracks `bin/omi-pipe`, and the current commit updates it. If the project eventually prefers source-only build artifacts, this should be revisited separately.

### Low - Candidate-root parsing still deserves a malformed-root fixture

The acceptance parser has historical permissive hex parsing behavior. Current tests cover missing roots and proof mismatches, but a future fixture should explicitly reject malformed `candidate-root` syntax.

## Current Strengths

- Pipe authority ladder is now explicit and tested.
- RS proof is layered above causal proof without replacing existing graph semantics.
- `rs=xor` remains available for deterministic simple fixtures.
- `rs=gf256` adds finite-field replay with portable C99 arithmetic.
- Documentation now captures the deeper doctrine: OMI is a rewrite register, not a database.
- `verify-safe` passes end to end in this workspace.

## Recommended Next Actions

1. Repair GitHub authentication and push:

   ```bash
   git push -u origin omi-pipe-rs-proof
   ```

2. Open a draft PR with a title that reflects the full scope:

   ```text
   Add OMI Pipe RS/GF256 proof replay and rewrite-register doctrine
   ```

3. Add a follow-up branch for stream-native fragment storage:

   ```text
   omi-pipe-fragment-store
   ```

4. Add future hardening fixtures:

   ```text
   malformed candidate-root
   gf256 subset > k consistency failure
   unsupported rs mode with valid frags
   duplicate gf256 fragment index
   ```

5. Consider making `/tmp/omi-pipe` PID-scoped for parallel build safety.

## Audit Conclusion

The current local state is internally consistent, tested, and ready to publish once credentials are repaired.

The most important architectural stabilization is epistemic rather than mechanical:

```text
OMI does not store data.
OMI preserves versioned binary sources of truth as rewrite tables.
Meaning is produced by declared routing, nomogram scale interpretation, proof replay, and receipt authority.
```
