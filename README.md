<p align="center">
  <img src="https://quizdock.github.io/logo.svg" width="220" alt="QuizDock" />
</p>

<h1 align="center">QuizDock</h1>

<p align="center">
  <strong>Open-source, self-hosted live quiz platform.</strong><br />
  Real-time multiplayer · projector-ready · your data stays on your servers.
</p>

<p align="center">
  <a href="https://github.com/quizdock/quiz-dock/releases"><img alt="Release" src="https://img.shields.io/github/v/release/quizdock/quiz-dock?logo=github&color=6f42c1" /></a>
  <a href="https://github.com/quizdock/quiz-dock/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/github/license/quizdock/quiz-dock?color=blue" /></a>
  <a href="https://github.com/quizdock/quiz-dock/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/quizdock/quiz-dock/ci.yml?branch=main&logo=github&label=CI" /></a>
  <a href="https://github.com/quizdock/quiz-dock/actions/workflows/security.yml"><img alt="Security" src="https://img.shields.io/github/actions/workflow/status/quizdock/quiz-dock/security.yml?branch=main&logo=github&label=security" /></a>
  <a href="https://github.com/quizdock/quiz-dock/stargazers"><img alt="Stars" src="https://img.shields.io/github/stars/quizdock/quiz-dock?logo=github" /></a>
  <a href="https://github.com/quizdock/quiz-dock/issues"><img alt="Issues" src="https://img.shields.io/github/issues/quizdock/quiz-dock?logo=github" /></a>
  <img alt="Last commit" src="https://img.shields.io/github/last-commit/quizdock/quiz-dock?logo=git&logoColor=white&color=informational" />
</p>

<p align="center">
  <a href="https://hub.docker.com/r/fchaussin/quizdock"><img alt="Docker pulls" src="https://img.shields.io/docker/pulls/fchaussin/quizdock?logo=docker&logoColor=white&label=pulls" /></a>
  <a href="https://hub.docker.com/r/fchaussin/quizdock/tags"><img alt="Image version" src="https://img.shields.io/docker/v/fchaussin/quizdock?sort=semver&logo=docker&logoColor=white&label=image" /></a>
  <a href="https://hub.docker.com/r/fchaussin/quizdock/tags"><img alt="Image size" src="https://img.shields.io/docker/image-size/fchaussin/quizdock/latest?logo=docker&logoColor=white&label=size" /></a>
  <img alt="Architectures" src="https://img.shields.io/badge/arch-amd64%20·%20arm64-2496ED?logo=docker&logoColor=white" />
</p>

<p align="center">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" />
  <img alt="NestJS" src="https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white" />
  <img alt="Socket.IO" src="https://img.shields.io/badge/Socket.IO-010101?logo=socketdotio&logoColor=white" />
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white" />
  <img alt="Redis" src="https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white" />
</p>

<p align="center">
  <img alt="Self-hosted" src="https://img.shields.io/badge/self--hosted-✓-success" />
  <img alt="No tracking" src="https://img.shields.io/badge/tracking-none-success" />
  <a href="docs/security/"><img alt="Scanned by Trivy" src="https://img.shields.io/badge/scanned%20by-Trivy-1904DA?logo=aqua&logoColor=white" /></a>
  <img alt="i18n" src="https://img.shields.io/badge/i18n-en%20·%20fr%20·%20es%20·%20zh%20·%20zh--TW-6f42c1" />
  <a href="https://quizdock.github.io"><img alt="Website" src="https://img.shields.io/badge/website-quizdock.github.io-22d3ee" /></a>
  <img alt="PRs welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen" />
</p>

---

QuizDock is a Kahoot-style live quiz you run yourself. A host presents a quiz, players
join from any device with a **PIN or QR code** (no account), and answers — weighted by
speed and correctness — feed a live leaderboard projected on the big screen. Everything
runs on **your** infrastructure as a single Docker image; the questions, the answers and
the results never leave your servers.

🌐 **Website:** https://quizdock.github.io

## ✨ Features

- ⚡ **Real-time multiplayer** — Socket.IO engine with authoritative server timing; players join by 6-digit PIN or QR code.
- 🦄 **Player avatars** — every player gets a unique, generated [Multiavatar](https://multiavatar.com) avatar — no upload, no account.
- 🖥️ **Projector-ready** — bright, high-contrast light screens built for the big screen, with separate projection and control windows.
- 🧩 **Quiz builder** — seven question types (single/multi choice, true-false, text, numeric, reorder, poll), up to 8 answers with distinct colour/shape pairs, image & audio media, drag-and-drop ordering.
- 📝 **Rich text** — prompts, options and descriptions in Markdown with a visual editor (bold, lists, code, inline images).
- 💡 **Answer explanations** — an optional explanation shown at the reveal, with a per-question reveal delay in automatic mode.
- 🎞️ **Content slides** — interleave slides (headings, text, images, 2–3 columns) between questions; backgrounds (image or gradient) for slides and questions, with a faithful 16:9 preview.
- 🏆 **Live scoring & podium** — time-weighted points with streak bonuses, leaderboard between questions, final podium; manual or auto pacing.
- 🎯 **Scoring rules per question** — *closest answer wins* for numeric questions, *partial credit* for multiple choice and ordering, *typo-tolerant* text answers, double or fixed points.
- 🎛️ **Host in control** — one console with Console / Projection / Participant views, look back over played questions without replaying anything, layout edits reach a running session at its next step, sessions survive a server restart.
- 📡 **Invitation address** — the QR code and join link point where participants can actually reach the instance (public URL, LAN IP, or any address), chosen from the console.
- ⭐ **Player feedback** — players rate the quiz (stars + optional comment) at the end; hosts see the distribution and browse the reviews. Can be switched off per quiz.
- 💾 **Answer capture** — optionally record every player's individual answers for audit, certification or individual follow-up.
- 🔎 **History & exploration** — browse archived sessions: per-question success rates, average times, and per-player answer sheets.
- 📤 **CSV export** — export overall results and per-player answer sheets.
- 📦 **Quiz import / export** — a quiz travels as a [portable bundle](docs/quiz-bundle.md) (`quiz.json` + `media/`, zipped): back it up, move it between instances, share it.
- 🌍 **Multilingual** — interface in English, French, Spanish, Simplified Chinese and Traditional Chinese (one language per instance); a [glossary](apps/frontend/src/i18n/GLOSSARY.md) keeps the wording consistent.
- 🏠 **Self-hosted & private** — runs on your own infra with Docker; no SaaS, no tracking, no ads; players need no account, hosts can plug in any OpenID Connect provider.
- 🎨 **White-label** — rebrand name, logo and CSS via env + a mounted folder, no rebuild.

## 📸 Screenshots

<table>
  <tr>
    <td width="50%"><img src="https://raw.githubusercontent.com/quizdock/quiz-dock/main/docs/screenshots/my-quizzes.png" alt="My quizzes" /><br /><sub><b>My quizzes</b> — your bank, import / export, one click to present</sub></td>
    <td width="50%"><img src="https://raw.githubusercontent.com/quizdock/quiz-dock/main/docs/screenshots/editor.png" alt="Quiz builder" /><br /><sub><b>Quiz builder</b> — 7 question types, slides, backgrounds, scoring rules</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="https://raw.githubusercontent.com/quizdock/quiz-dock/main/docs/screenshots/console-lobby.png" alt="Host console — lobby" /><br /><sub><b>Host console</b> — lobby: PIN, QR code, invitation address, players</sub></td>
    <td width="50%"><img src="https://raw.githubusercontent.com/quizdock/quiz-dock/main/docs/screenshots/projection-lobby.png" alt="Projection — lobby" /><br /><sub><b>Projection</b> — the big screen while players join</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="https://raw.githubusercontent.com/quizdock/quiz-dock/main/docs/screenshots/join-pin.png" alt="Join by PIN" /><br /><sub><b>Join</b> — by PIN code or QR, no account</sub></td>
    <td width="50%"><img src="https://raw.githubusercontent.com/quizdock/quiz-dock/main/docs/screenshots/join-nickname.png" alt="Nickname and avatar" /><br /><sub><b>Nickname</b> &amp; Multiavatar avatar</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="https://raw.githubusercontent.com/quizdock/quiz-dock/main/docs/screenshots/projection-slide.png" alt="Content slide" /><br /><sub><b>Content slide</b> — headings, text, images, backgrounds</sub></td>
    <td width="50%"><img src="https://raw.githubusercontent.com/quizdock/quiz-dock/main/docs/screenshots/projection-question.png" alt="Projection — question" /><br /><sub><b>Projection</b> — live question, Kahoot-style</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="https://raw.githubusercontent.com/quizdock/quiz-dock/main/docs/screenshots/player-question.png" alt="Player — question" /><br /><sub><b>Player</b> — answers listed, colour tiles to tap</sub></td>
    <td width="50%"><img src="https://raw.githubusercontent.com/quizdock/quiz-dock/main/docs/screenshots/console-question.png" alt="Host console — question" /><br /><sub><b>Host console</b> — chrono, answers received, reveal now</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="https://raw.githubusercontent.com/quizdock/quiz-dock/main/docs/screenshots/projection-reveal.png" alt="Projection — reveal" /><br /><sub><b>Reveal</b> — distribution, explanation, live leaderboard</sub></td>
    <td width="50%"><img src="https://raw.githubusercontent.com/quizdock/quiz-dock/main/docs/screenshots/player-reveal.png" alt="Player — reveal" /><br /><sub><b>Player</b> — own result, answer and ranking</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="https://raw.githubusercontent.com/quizdock/quiz-dock/main/docs/screenshots/player-ordering.png" alt="Player — ordering" /><br /><sub><b>Ordering</b> — drag and drop on the phone</sub></td>
    <td width="50%"><img src="https://raw.githubusercontent.com/quizdock/quiz-dock/main/docs/screenshots/console-reveal.png" alt="Host console — reveal" /><br /><sub><b>Host console</b> — look back over played questions, next</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="https://raw.githubusercontent.com/quizdock/quiz-dock/main/docs/screenshots/projection-podium.png" alt="Podium" /><br /><sub><b>Podium</b> — final results on the big screen</sub></td>
    <td width="50%"><img src="https://raw.githubusercontent.com/quizdock/quiz-dock/main/docs/screenshots/player-review.png" alt="Player feedback" /><br /><sub><b>Player feedback</b> — rate the quiz at the end</sub></td>
  </tr>
</table>

## 🚀 Quick start (self-host)

QuizDock ships as **one image** — [`fchaussin/quizdock`](https://hub.docker.com/r/fchaussin/quizdock)
on Docker Hub (multi-arch `amd64` / `arm64`). NestJS serves the API, the WebSocket and the SPA;
PostgreSQL and Redis run alongside, and a one-shot `migrate` service applies migrations.

### Easiest — one container (great for a first try / Docker Desktop)

App **and** database in a single image — nothing else to install:

```bash
docker run -p 18080:3000 -v quizdock:/data fchaussin/quizdock:standalone
# open http://localhost:18080
```

Bundles PostgreSQL + Redis; data persists in the `quizdock` volume across restarts.
Perfect for a demo or beginners — for production, prefer the multi-service setup below
(external, dedicated database).

### Option A — the `quizdock` script (recommended)

One script, Docker only — guided setup, then start, backup, upgrade and admin commands:

```bash
curl -fsSLO https://raw.githubusercontent.com/quizdock/quiz-dock/main/quizdock && chmod +x quizdock
./quizdock init      # name, language, port, auth mode → .env + docker-compose.prod.yml
./quizdock up        # open http://localhost:18080
./quizdock doctor    # config & connectivity check; later: backup, upgrade <tag>, seat:release…
```

Every command: [`docs/self-hosting/cli.md`](docs/self-hosting/cli.md).

### Option B — Docker Hub image by hand

Pull the published image and run the stack — no build, no source checkout:

```bash
docker pull fchaussin/quizdock:latest
curl -O https://raw.githubusercontent.com/quizdock/quiz-dock/main/docker-compose.prod.yml
docker compose -f docker-compose.prod.yml up -d
# then open the app
open http://localhost:18080
```

Pin a version with `QUIZDOCK_TAG=0.4.0 docker compose -f docker-compose.prod.yml up -d`.

### Upgrading

Database migrations run **automatically** on every start (the one-shot `migrate`
service, or the `:standalone` entrypoint): pull the new tag and `up` again. Two rules:
**back up PostgreSQL first** (`pg_dump`), and **don't roll back** an image once its
migrations ran — restore the backup instead. Each release lists its schema changes
under *Upgrading* in the [release notes](https://github.com/quizdock/quiz-dock/releases).
With the script: `./quizdock upgrade 0.5.0` (backup → pull → restart → doctor).
Full procedure: https://github.com/quizdock/quiz-dock/blob/main/docs/self-hosting/README.md#upgrading

### Option C — build from source

```bash
git clone https://github.com/quizdock/quiz-dock.git
cd quiz-dock
docker compose -f docker-compose.prod.yml up -d --build
open http://localhost:18080
```

## ⚙️ Configuration

Copy `.env.example` to `.env` and adjust. Common settings:

| Variable | Default | Purpose |
|---|---|---|
| `APP_NAME` | `QuizDock` | App name shown in the UI (white-label) |
| `APP_LANG` | `en` | Instance language: `en` · `fr` · `es` · `zh` · `zh-TW` |
| `AUTH_MODE` | `none` | `none` (local mode: first host takes the seat, sample quizzes included) or `oidc` (any OpenID Connect provider) |
| `HTTP_PORT` | `18080` | Host port for the app |
| `APP_PUBLIC_URL` | — | Public address of the instance, offered first as the invitation address (QR code, join link) |
| `HOST_LAN_IPS` | — | LAN IP of the machine when Docker hides it (Docker Desktop): offered as an invitation address for local play |

Rebrand without rebuilding: set `APP_NAME` / `APP_LANG` and drop a `logo.svg` + `override.css`
into the mounted `branding/` folder. The runtime is hardened (non-root, read-only root FS,
all Linux capabilities dropped, `no-new-privileges`).

📖 **Self-hosting guide** — every variable, white-labeling and OIDC setup: [`docs/self-hosting/`](docs/self-hosting/).

## 🧱 Tech stack

**Backend** NestJS + Socket.IO · Prisma 7 / PostgreSQL · Redis (live state) ·
**Frontend** React + Vite + shadcn/ui + TanStack · i18next ·
**Packaging** single distroless image · Docker Compose. Front/back are kept in sync via an
auto-generated OpenAPI client (Orval) and a shared TypeScript WebSocket contract.

## 🛠️ Development

Dev runs backend (NestJS, hot-reload) and frontend (Vite) as separate services:

```bash
pnpm install
docker compose up -d
# Front: http://localhost:15173   ·   API: http://localhost:13000   ·   API docs: http://localhost:13000/api/docs
```

Design references live in [`specifications/`](./specifications/README.md); ongoing notes and
decisions in [`docs/`](./docs/README.md) (see the [ADRs](./docs/adr)).

## 🔒 Security

Dependencies and images are scanned on every push, every PR and weekly
([`Security` workflow](.github/workflows/security.yml)): `pnpm audit` gates app CVEs, Trivy
scans the filesystem and the published image (results in the **Security** tab). The runtime
is hardened (non-root, read-only root FS, dropped capabilities). Point-in-time audits live
in [`docs/security/`](docs/security/); report a vulnerability via [`SECURITY.md`](SECURITY.md).

## 📄 License

[MIT](https://github.com/quizdock/quiz-dock/blob/main/LICENSE) — free to use, modify and
redistribute, including for internal self-hosting, provided the copyright notice is kept.
