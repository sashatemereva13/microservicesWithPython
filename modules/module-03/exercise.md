# Module 3 — Synchronous Communication

**Duration**: 2h in class
**Branch to submit**: `module-03/<team-name>`

---

## Objective

Services need to talk to each other. In this module you wire up the `activity-service` to call `user-service` and `game-service`, and you build the gateway that became the entry point on your Module 1 service map.

By the end of this module, all client requests go through port 8000. No client ever calls a service on its own port again.

---

## What's provided

The `activity-service` skeleton is already in place — models, schemas, and repository are done. Your job is to add the inter-service calls.

The gateway boilerplate (project structure, `config.py`, catch-all route skeleton) is in `modules/module-03/gateway-starter/`. Copy it to `gateway/` and fill in the missing logic.

---

## Part A — Build the gateway _(~40 min)_

The gateway has one job: read the URL path and forward the request to the right service. No auth, no business logic — just routing.

It uses a `ROUTES` dictionary:

```python
ROUTES = {
    "users":      "http://localhost:8001",
    "games":      "http://localhost:8002",
    "activities": "http://localhost:8003",
}
```

When a request arrives at `/v1/users/123`, the gateway splits the path, finds `users` in the dictionary, and forwards the full request to `http://localhost:8001/v1/users/123` — method, headers, and body preserved exactly.

**RESULT**

```bash

13xsasha@Sashas-MacBook-Pro microservicesWithPython % curl -i http://localhost:8000/v1/activities/
HTTP/1.1 503 Service Unavailable
date: Wed, 20 May 2026 15:19:32 GMT
server: uvicorn
content-length: 19

Service unavailable%
13xsasha@Sashas-MacBook-Pro microservicesWithPython % curl -i http://localhost:8000/v1/games/
HTTP/1.1 200 OK
date: Wed, 20 May 2026 15:19:36 GMT
server: uvicorn
date: Wed, 20 May 2026 15:19:37 GMT
server: uvicorn
content-length: 1181
content-type: application/json
```

```json
{"items":[{"id":"e84a8729-524f-4b27-b4a2-e7fc9221da34","title":"The Legend of Zelda: Breath of the Wild","genre":"Action-adventure","platform":"Nintendo Switch","release_year":2017,"cover_url":"https://example.com/zelda-botw.jpg","created_at":"2026-05-18T17:21:06.821243"},{"id":"eb7dec05-eadc-466c-8e30-5cb56d976fcb","title":"Elden Ring","genre":"Action RPG","platform":"PC","release_year":2022,"cover_url":"https://example.com/elden-ring.jpg","created_at":"2026-05-18T17:21:06.821253"},{"id":"70e7c29a-10cf-4cac-91d2-374be67ae7a4","title":"Minecraft","genre":"Sandbox","platform":"PC","release_year":2011,"cover_url":"https://example.com/minecraft.jpg","created_at":"2026-05-18T17:21:06.821258"},{"id":"af0ba171-bce5-4b27-96eb-e4bddde56674","title":"Hollow Knight","genre":"Metroidvania","platform":"PC","release_year":2017,"cover_url":"https://example.com/hollow-knight.jpg","created_at":"2026-05-18T17:21:06.821261"},{"id":"71553335-bb63-46bd-bbe8-d3b03b3c6490","title":"Stardew Valley","genre":"Simulation RPG","platform":"PC","release_year":2016,"cover_url":"https://example.com/stardew-valley.jpg","created_at":"2026-05-18T17:21:06.821264"}],"total":5,"limit":20,"offset":0}%
```

```bash
13xsasha@Sashas-MacBook-Pro microservicesWithPython % curl -i http://localhost:8000/v1/games/
HTTP/1.1 200 OK
date: Wed, 20 May 2026 15:20:03 GMT
server: uvicorn
date: Wed, 20 May 2026 15:20:02 GMT
server: uvicorn
content-length: 1181
content-type: application/json
```

```json
{"items":[{"id":"e84a8729-524f-4b27-b4a2-e7fc9221da34","title":"The Legend of Zelda: Breath of the Wild","genre":"Action-adventure","platform":"Nintendo Switch","release_year":2017,"cover_url":"https://example.com/zelda-botw.jpg","created_at":"2026-05-18T17:21:06.821243"},{"id":"eb7dec05-eadc-466c-8e30-5cb56d976fcb","title":"Elden Ring","genre":"Action RPG","platform":"PC","release_year":2022,"cover_url":"https://example.com/elden-ring.jpg","created_at":"2026-05-18T17:21:06.821253"},{"id":"70e7c29a-10cf-4cac-91d2-374be67ae7a4","title":"Minecraft","genre":"Sandbox","platform":"PC","release_year":2011,"cover_url":"https://example.com/minecraft.jpg","created_at":"2026-05-18T17:21:06.821258"},{"id":"af0ba171-bce5-4b27-96eb-e4bddde56674","title":"Hollow Knight","genre":"Metroidvania","platform":"PC","release_year":2017,"cover_url":"https://example.com/hollow-knight.jpg","created_at":"2026-05-18T17:21:06.821261"},{"id":"71553335-bb63-46bd-bbe8-d3b03b3c6490","title":"Stardew Valley","genre":"Simulation RPG","platform":"PC","release_year":2016,"cover_url":"https://example.com/stardew-valley.jpg","created_at":"2026-05-18T17:21:06.821264"}],"total":5,"limit":20,"offset":0}%
```

---

## Part B — Wire up the activity-service _(~50 min)_

Every time an activity is created, the activity-service makes two outbound calls:

1. **Validate** that the user exists in `user-service` — if not, return `404`
2. **Enrich** the response with game data from `game-service` — if unreachable, return `"game": null`

These two calls are handled differently on purpose:

- Validation is **critical** — the request must not proceed if the user doesn't exist. It retries on transient errors.
- Enrichment is **optional** — the activity is saved regardless. It fails gracefully with a null fallback.

Open `services/activity-service/app/main.py` and implement both functions. The signatures and the expected response shape are documented in `docs/api-contracts.md`.

Start all three services before testing:

```bash
uvicorn app.main:app --reload --port 8001  # user-service
uvicorn app.main:app --reload --port 8002  # game-service
uvicorn app.main:app --reload --port 8003  # activity-service
```

Test the flow:

```bash
# Create a user first, then log an activity for that user
curl -X POST http://localhost:8003/v1/activities \
  -H "Content-Type: application/json" \
  -d '{"user_id": "<your-user-id>", "game_id": "<your-game-id>", "action": "played"}'
```

Check that the response includes the enriched `game` object. Then stop `game-service` and repeat — confirm the activity is still saved with `"game": null`.

---

Rules to implement:

- Unknown resource → `404`
- Downstream service unreachable → `503 Service Unavailable`
- `/health` → handled by the gateway itself, never forwarded

Start everything:

```bash
uvicorn app.main:app --reload --port 8000  # gateway
uvicorn app.main:app --reload --port 8001  # user-service
uvicorn app.main:app --reload --port 8002  # game-service
uvicorn app.main:app --reload --port 8003  # activity-service
```

From this point on, all calls go through port 8000:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/v1/users
curl http://localhost:8000/v1/games
curl http://localhost:8000/v1/activities
```

---

## Discussion _(~15 min)_

- The downstream services did not change at all when you added the gateway. What does that tell you about the pattern?
- Why does the validation call retry on failure but the enrichment call doesn't?
- What happens to the overall response time if `user-service` is slow?

---

## Minimum to submit this branch

- [ ] `activity-service` validates users and enriches with game data
- [ ] Graceful degradation works: activity saved even when `game-service` is down
- [ ] Gateway running on port 8000, routing to all three services
- [ ] `curl http://localhost:8000/health` returns `{"status": "ok"}`
- [ ] `REFLECTION.md` completed and committed

---

## Optional — gRPC

If you finish early, read `modules/module-03/grpc-reading.md` for an introduction to gRPC as an alternative to REST for internal service calls. No implementation required.
