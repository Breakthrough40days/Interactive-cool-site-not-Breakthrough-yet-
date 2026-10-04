# Breakthrough Interactive Lab

A browser-native experimental experience where touch, hands, voice, motion, time and memory alter a living digital object.

## Experiences
- **Body + Matter** — camera hand tracking, pinch/fist/open-palm gestures, CPU fallback matter and optional WebGPU matter.
- **Memory + Touch** — a deformable field with persistent local scars and inherited object history.
- **Voice + Matter** — microphone energy/frequency data grows throwable visual objects. Raw audio is not intentionally stored.
- **Device + Space** — pointer/device-orientation controlled spatial portal.
- **Action + Time** — one real calendar-day mark at a time across forty days.
- **Body + Time** — a live temporal mirror that accumulates recent selves.

## Pass It
The Pass It surface creates a URL containing a compact non-media summary of the object's lineage: experiment journey, trace count, voice-object count, Future-day count, generation and visual seed. Camera frames and microphone recordings are not placed in the shared URL.

## Development
```bash
npm install
npm run dev
npm run validate
```

`npm run validate` runs JavaScript syntax checks and the production Vite build.

Add `?debug=1` to show FPS, rendering mode and tracked-hand diagnostics.

## Progressive enhancement
The experience adapts particle/render density on lower-core devices. WebGPU is optional. Camera, microphone and motion permissions are requested only when the related experience is activated, and experiences retain non-permission interaction where practical.

## Discovery
The repository includes crawler rules, sitemap, structured WebApplication data, semantic explanatory HTML, social metadata and `llms.txt`.
