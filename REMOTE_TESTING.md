# Remote Portal Testing

Use this process when someone is helping test the OMI Portal over the internet.
The goal is to share a browser projection of the portal while keeping OMI
authority local to the validated runtime.

## Ground Rule

```text
Remote testers inspect projected state.
They do not accept or validate OMI state.
```

Run the production-style Docker portal for internet testing. Do not expose the
Vite dev server directly to the public internet.

## Host Preflight

From the repo root, verify the local state before sharing a URL:

```bash
npm ci
npm test
npm run build
make verify-safe
```

For the container runtime:

```bash
OMI_PORT=18081 ./scripts/smoke.sh
```

The smoke script starts the compose runtime, checks container health, verifies
COOP/COEP browser isolation headers, and tears the runtime down.

## Start A Shareable Runtime

Start the production-style portal on a non-default local port:

```bash
OMI_PORT=18081 docker compose up --build -d omi-portal
```

Confirm it answers locally:

```bash
curl -I http://localhost:18081/
```

The response should include:

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Expose `http://localhost:18081` through your chosen temporary tunnel, reverse
proxy, VPS, or firewall rule. Share only the resulting public URL with the
tester.

When the test is complete:

```bash
docker compose down
```

## Tester Walkthrough

Ask the tester to open the shared URL and check these paths:

- `/` loads the main portal index.
- `/portal.html` loads the interactive portal surface.
- `/document.html` loads the document view.
- `/bidi.html` loads the BiDi/CodeMirror view.

Ask them to record:

- Browser and version.
- Device and operating system.
- Network type, for example home Wi-Fi, mobile hotspot, corporate VPN.
- Which pages loaded cleanly.
- Any blank screens, broken links, layout overlap, or console errors.
- Whether the first screen made it obvious what to click next.

## Message To Send The Tester

```text
Please open this OMI Portal test URL:

<public-url>

Then check these pages:
- /
- /portal.html
- /document.html
- /bidi.html

Please send back:
- Browser and version
- Device and operating system
- Whether each page loaded
- Anything confusing on the first screen
- Any blank screens, broken links, overlapping text, or console errors
- Screenshots or a short screen recording if something looks wrong
```

## UX Checklist

Use this checklist while watching the tester or reading their report:

- The shared URL opens without install steps for the tester.
- The first page gives a clear next action.
- Navigation between `/`, `/portal.html`, `/document.html`, and `/bidi.html`
  works from the tester's browser.
- Text is readable on desktop and mobile widths.
- No UI element visibly overlaps another.
- The portal remains responsive after a refresh.
- Browser isolation headers are present on the shared URL.

## A-Frame Demo Boundary

`/aframe.html` is demo-only visualization. It is not part of the default
production Docker bundle.

For A-Frame-specific testing, use a separate local demo pass after a full dev
install:

```bash
npm run dev:aframe
```

Do not treat A-Frame output as OMI authority.

## Feedback Template

```text
Tester:
Date:
Public URL:
Browser / version:
Device / OS:
Network:

Pages checked:
- /:
- /portal.html:
- /document.html:
- /bidi.html:

What worked:
What was confusing:
Visual/layout issues:
Console errors:
Screenshots or screen recording:
```
