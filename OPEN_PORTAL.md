# Open The Portal

This is the shortest path from a fresh checkout to seeing the OMI Portal in a
browser.

Testing with someone over the internet? Use
[REMOTE_TESTING.md](REMOTE_TESTING.md) after this local walkthrough.

## Prerequisites

- Node.js and npm
- Docker, optional, for the production-style container path

## Local Dev Path

Install dependencies:

```bash
npm ci
```

Start the Vite dev server:

```bash
npm run dev
```

Open:

```text
http://localhost:5173/
```

## Useful Portal Pages

- `/` main portal index
- `/portal.html` interactive portal surface
- `/document.html` document view
- `/bidi.html` BiDi/CodeMirror view
- `/aframe.html` demo-only 3D visualization via `npm run dev:aframe`

## Production-Style Docker Path

Build and start the nginx runtime container:

```bash
OMI_PORT=8080 docker compose up --build -d omi-portal
```

Open:

```text
http://localhost:8080/
```

When finished:

```bash
docker compose down
```

## Smoke Check

Run the container smoke check:

```bash
OMI_PORT=8080 ./scripts/smoke.sh
```

The smoke script starts the compose runtime, waits for the container health
check, validates the COOP/COEP browser isolation headers, and then tears the
compose runtime down.

## Troubleshooting

- If port `5173` is busy, run `npm run dev -- --port 5174`.
- If port `8080` is busy, set `OMI_PORT=18081`.
- If dependencies look stale, rerun `npm ci`.
- If Docker fails health, inspect `docker compose logs omi-portal`.
