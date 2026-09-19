# Live session

What a running session guarantees (`apps/backend/src/game/`).

## Snapshot, substance and form

A session is created from a **snapshot** of the quiz. The **substance** — the
questions, their order, type, prompt, media, options, right answers, scoring
and timing — stays as launched, so statistics remain consistent. The **form**
follows the editor at every step change: backgrounds, text contrast, answer
explanations, reveal delays, the quiz's feedback flag, and the slides in full
(blocks, backgrounds, timing, insertions, removals). A question deleted
meanwhile keeps its frozen version.

## States

`LOBBY → (SLIDE_SHOW | ANSWERING → REVEAL)* → PODIUM → ENDED`, plus
`HOST_DISCONNECTED` (chrono frozen, 2 min to come back). The host paces by
hand or in automatic mode (per-slide display time, per-question reveal delay,
engine defaults `GAME_AUTO_ADVANCE_MS` / `GAME_READ_DELAY_MS`), and can pause.

## Looking back

From a reveal, a slide or the podium, the host can show any **played step**
again (`host:review`): a question comes back with its archived reveal and each
participant's own result, a slide as it was. Nothing is replayed or rescored;
answers are refused; `host:next` (*Back to live*) returns every screen to the
live position. `game:state.nav` carries what is reachable.

## Restarts and reconnections

Timers live in the server process: at boot the engine re-arms them from Redis
(question deadlines, automatic pace). A socket that reconnects on its own
re-attaches (host, projection, participant) and catches up on the current
state — including the question when attaching at a reveal.

## Invitation address

The QR code and join link point at the base URL the host picked in the lobby
(`host:join-url`): the instance's public URL, a LAN address of the machine,
the page's own origin, or anything typed. It is stored on the session, sent to
every screen, frozen once the session starts, and remembered by the host's
browser. See the self-hosting guide for what each setup offers.
