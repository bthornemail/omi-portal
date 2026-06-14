# `_temp/` — Workspace Inbox & Garbage Collection

This folder is the **GC face** of the Tetragrammatron — a scratch workspace for draft notes, exploratory diagrams, work-in-progress documents, and transient artifacts that have not yet graduated to a canonical face folder.

## Policy

- **Purpose:** Rapid prototyping of documentation, ASCII art, data-flow sketches, and integration notes.
- **Persistence:** Files here are **not** tracked in `omi-object-model.manifest.json` and are **not** considered canonical.
- **Garbage collection:** Manual only. When a draft matures, move it to the appropriate face folder and reference it from that face's `README.md`. Stale content should be deleted by the author.
- **Git:** This folder is listed in `.gitignore`. Its contents stay local unless explicitly staged with `git add -f`.
- **Naming:** Prefix drafts with your initials and date, e.g. `bt-2026-05-30-nonogram-notes.md`.

## What Belongs Here

| Appropriate | Inappropriate |
|-------------|---------------|
| Architecture sketches on napkin math | Finalized layer documentation |
| Alternative approach explorations | Production FACTS.omi rule proposals |
| Meeting/interview notes | Canonical protocol specifications |
| Scratch test vectors | Committed test fixtures |
| Performance benchmark scratch | Benchmark results (go in `docs/`) |
