# Self-hosting & integration

Guides for **running, configuring and integrating** QuizDock on your own
infrastructure — for operators and integrators (not contributors).

> Working **on** the code (architecture, contributing)? That's developer
> documentation: see [`../README.md`](../README.md), the
> [ADRs](../adr), and the [`specifications/`](../../specifications/README.md).

## Guides

- **[Configuration, branding & OIDC](configuration.md)** — every environment
  variable, white-labeling (name, language, logo, CSS), and wiring your own
  OIDC identity provider.

## Run it

- **One container (easiest)** and **production (compose)** quick starts —
  see the main [README → Quick start](../../README.md#-quick-start-self-host).
- Published images on Docker Hub: [`fchaussin/quizdock`](https://hub.docker.com/r/fchaussin/quizdock)
  (`:latest` app image · `:standalone` all-in-one).

## Upgrading

Migrations are part of the image and run **automatically** before the app starts:
the `migrate` one-shot service in `docker-compose.prod.yml`, or the entrypoint of the
`:standalone` image. Upgrading is therefore:

```bash
# 1. back up the database (compose: service `postgres`; standalone: inside the container)
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U live quizdock > quizdock-$(date +%F).sql
# 2. pull and restart on the new tag
QUIZDOCK_TAG=0.4.0 docker compose -f docker-compose.prod.yml pull
QUIZDOCK_TAG=0.4.0 docker compose -f docker-compose.prod.yml up -d
# 3. check the migration ran
docker compose -f docker-compose.prod.yml logs migrate
```

Rules:

- **Back up first.** Some migrations convert data (e.g. 0.4.0 turns slides into blocks), not just the schema.
- **No rollback.** Once a newer image's migrations ran, an older image will refuse to start on that database (and columns may be gone). To go back, restore the backup.
- **Read the release notes.** Every release lists its schema changes and anything to do by hand under *Upgrading* — if the section is absent, nothing is required.
- Media (`MEDIA_DIR`) is untouched by upgrades; keep it on its volume.
