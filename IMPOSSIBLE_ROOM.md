# Impossible Room — AI architecture

The Room is an embodied AI environment, not a personality diagnostic.

## Runtime loop
1. Browser vision/audio produces structured observations. Raw camera/audio are not sent to the Room AI endpoint.
2. Local episodic memory stores recent events and explicit user corrections.
3. The client sends a compact state snapshot to `/api/room-mind`.
4. The server-side OpenAI Responses API reasons over observations and returns a strict experiment plan.
5. The client compiles that plan through an allowlist. The model cannot execute arbitrary JavaScript.
6. The world changes, measures the visitor response, scores evidence, updates confidence, and asks for correction.

## AI tools / experiment vocabulary
Current safe physics rules: normal, resist, patience, reverse, opposite, novel. The plan may also trigger a bounded shockwave, speak a message, ask for feedback, and set a 4–20 second experiment duration.

## Privacy and epistemic limits
Claims must describe behavior inside the Room. Do not infer mental health, protected traits, intelligence, or stable personality from webcam behavior. Separate observation from inference and expose confidence. Corrections outrank model inference.

## Deployment
Set `OPENAI_API_KEY` only in the server environment. Optional `OPENAI_ROOM_MODEL` defaults to `gpt-6-luna`. Never expose the key in browser code.

## Implemented roadmap
- secure AI brain endpoint
- safe tool/experiment contract
- AI-selected hypotheses
- browser speech output
- natural typed conversation
- observation/inference boundary
- explicit corrections
- evolving behavioral profile
- episodic event memory
- cross-visit memory
- model-composed experiments
- safe experiment compiler
- instruction-light discovery
- rule violation/surprise
- movement prediction
- prediction challenge
- five-minute learning reveal
- shareable visitor artifact
- asynchronous inherited Room via PASS IT

## Realtime shared physics
A client protocol is intentionally not presented as live until a signaling/state relay exists. Production implementation requires an authoritative realtime backend (WebSocket/WebRTC signaling), room IDs, clock synchronization, ownership transfer, reconnect semantics, abuse controls, and tests across two devices. The current PASS IT system is asynchronous inheritance.
