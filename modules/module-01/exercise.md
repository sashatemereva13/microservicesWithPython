# Module 1 — Service Decomposition

**Duration**: 2h in class
**Branch to submit**: `module-01/<team-name>`

---

## Objective

Before writing a single line of code, you need to design the system on paper. Every decision you make here: where to draw service boundaries, who owns what data, how services talk to each other, is hard to reverse once you start coding.

This module is about slowing down and thinking like an architect, not a developer.

Read these two documents before doing anything else:

- `docs/domain.md` — what GameHub is and who uses it
- `docs/specs.md` — the tech stack and key architectural decisions

> The CTO has already laid out the `services/` folder structure. Use it as a starting point, but your job is to **justify** why each folder deserves to be its own service — not just accept it.

---

## Task 1 — Identify bounded contexts _(~40 min)_

A bounded context is a part of the system that has a clear responsibility and owns its data exclusively. No other service should reach into its database.

For each bounded context you identify, fill in the table:

(i assume that bounded context is a separate service, so im taking it from services folder)

| Bounded Context | Responsibilities                                      | Owned Entities        | Team          |
| --------------- | ----------------------------------------------------- | --------------------- | ------------- |
| Activity        | Records user behavior - viewing games/writing reviews | Activity, UserAction  | Engagement    |
| Authentication  | Handles login, registration, JWT/session              | Token, Session        | Platform      |
| Game            | Manages the games list, details, genres, metadata     | Game, Genre           | Catalog       |
| Logging         | Stores tech logs, audit logs, compliance records      | LogEntry, AuditRecord | Infr-re       |
| Notification    | Sends user notificaitions/manages delivery status     | Notification, Deliery | Communication |
| User            | Manages user profiles info, account metadata          | UserProfile, Consent  | Platform      |

There is no single correct answer: what matters is that you can justify each row.

---

## Task 2 — Define service contracts _(~30 min)_

For each pair of services that need to communicate, define:

- **Direction**: A → B
- **Trigger**: what causes the call
- **Protocol**: REST or event (async)
- **Payload**: key fields exchanged

Example:

```
activity-service → logging-service
Trigger: an activity is logged
Protocol: RabbitMQ message (async — why not REST here?)
Payload: { activity_id, user_id, action, game_id, timestamp }
```

Focus on the flows that feel non-obvious. You do not need to document every possible pair.

**Answer:**

**_List of services:_**
activity
auth
game
logging
notification
user

**_Service contracts:_**

1. activity -> logging
   Trigger: some from of user activity is recorded (starting a game, for ex)
   Protocol: RabbitMQ mwssage, async event (logging shouldn't block the main user action - even if the logging is unavailable the activity should be saved)
   Payload:

```json
{
  "activity_id": "activity_111",
  "user_id": "user_222",
  "action": "started_game",
  "game_id": "game_9",
  "timestamp": "2032-05-12"
}
```

2. activity -> notifications
   Trigger: a particular user activity creates a notification
   Protofol: RabbitMQ messgae, async event (sending notifications isn't the core activity)
   Payload:

```json
{
  "user_id": "user_282",
  "notification_type": "activity_event",
  "message": "your friend has started a game",
  "action": "started_game",
  "game_id": "game_9",
  "timestamp": "2032-05-12"
}
```

3. logging -> user
   Trigger: login service checks for the GDPR consent before storing logs
   Protocol: REST, synchtonous (needs an immediate boolean answer)
   Payload:

```json
{
  "user_id": "user_282",
  "purpose": "tracking"
}
```

Res:

```json
{
  "user_id": "user_282",
  "consent": false
}
```

4. auth -> user
   Trigger: registering a new user
   Protocol: REST / async event. RabbitMQ. (auth owns credentials, user owns profile data)
   Payload:

```json
{
  "user_id": "user_888",
  "email": "lalala@mail.ru",
  "timestamp": "3032-35-13"
}
```

5. activity -> game
   Trigger: a user records an activity like adding a game to fav
   Protocol: REST, synchronous (activity verifies the game exists before saving)
   Payload:

```json
{
  "game_id": "game_33"
}
```

Res:

```json
{
  "game_id": "game_33",
  "exsts": false
}
```


5. notification -> user
Trigger: the notification service reuiqres user details & notification optin before sending any notifications
Protocol: REST, synchronous (motification service needs the most current preferences possible)
Payload:
```json
{
  "user_id": "user_888",
  "timestamp": "1032-15-13"
}
```

Res:
```json
{
  "user_id": "user_888",
  "email": "lalala@mail.ru",
  "notifications": true,
  "timestamp": "1032-15-13"
}
```

8. Auth -> logging
Trigger: any login attempt
Protocol: RabbitMQ message, synchronous (need the current time authentication limits/rules/permissions)
Payload:
```json
{
  "event": "login",
  "user_id": "user_1111111111",
  "email": "one@hotmail.ru",
  "timestamp": "1222-55-33",
  "success": true
}
```
---

## Task 3 — Draw the service map _(~20 min)_

Draw the full GameHub service map:

- One box per service
- Arrows between services (solid line = synchronous REST, dashed line = async event)
- Label each arrow with its protocol
- One box at the top labelled **gateway** — all client requests enter here, no client ever calls a service directly

This can be a sketch on paper, a whiteboard photo, or ASCII art committed to your branch.


**Answer:**

                         +------------------------+
                         |         CLIENT         |
                         +------------------------+
                                      |
                                      | REST
                                      |
                                      V
                         +------------------------+
                         |        GATEWAY         |
                         +------------------------+
                          /          |            \
                   REST  /           |             \
                        /       REST |              \   REST
                       /             |               \
                      V              V                V
              +--------+          +--------+         +--------+     
              | auth-s |          | user-s |         | game-s |
              +--------+          +--------+         +--------+
                |                    ^  ^                ^
                | async event        |  |                |
                |  userRegister      |  |  REST          |  REST
                |                    |  |  consent       |  validate game
                V                    |  |                |
        +---------------------------------------------------------------+
        |                          activity-s                           |
        +---------------------------------------------------------------+
                                       |
        +---------------------------------------------------------------+
        |                                                               |
        |  async event                                                  |  async event
        |                                                               |
        V                                                               V
  +-----------+                                                   +----------------+ 
  | logging-s |                                                   | notification-s |
  +-----------+                                                   +----------------+ 
        |  REST                                                          |   REST
        |  GDPR check                                                    |   get user preferences
        +----------------------------------+-----------------------------+
                                           |
                                           |
                                           V
                                   +---------------+
                                   |    user-s     |
                                   +---------------+






---

## Discussion _(~15 min)_

Three questions to discuss as a team before you leave:

1. Why does `notification-service` use Node.js instead of Python like the rest? What does that tell you about microservices and technology choices?
2. What is the risk of `activity-service` calling `logging-service` synchronously — why might you prefer an async event instead?
3. Why does `logging-service` need a GDPR consent check before recording any activity?

You do not need to write these answers down — they are warm-up for your REFLECTION.md.

---

## Minimum to submit this branch

- [ ] Bounded context table filled in (at least 4 services justified)
- [ ] At least 3 service contracts defined
- [ ] Service map committed (sketch, photo, or ASCII)
- [ ] `REFLECTION.md` completed and committed

The map does not need to be perfect. It needs to be yours.
