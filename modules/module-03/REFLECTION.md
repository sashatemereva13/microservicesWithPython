# Module 3 — Reflection

**Team name**: _______________
**Branch**: `module-03/<team-name>`
**Submitted**: before Module 4 lesson

---

Answer the three questions below. There are no right or wrong answers — we are looking for your reasoning, not a textbook definition. A few honest sentences are worth more than a long generic paragraph.

---

## 1. The "why"

All client requests now go through the gateway. No client ever calls a service directly.

**Why does that single entry point exist? What would the client's life look like without it?**

Think about what the client would need to know and manage if it talked to each service on its own port.

> *Your answer:*
several reasons.
first of all, gateway created a safety guard to protect the services. it keeps the internal structure hidden from the outside
secondly, with gateway handling the routing, the client only talks to port 8000 - the system is easier to change.

---

## 2. Your choice

The activity-service makes two outbound calls: one to validate the user (with retry logic), one to fetch game data (with a null fallback if it fails).

**Why are these two calls treated differently? Why does one retry and the other just give up gracefully?**

What is the consequence for the user in each case if the downstream service is unavailable?

> *Your answer:*
to begin with, an activity should only really be created for an existing user, otherwise is impossible in practice, so it shall be impossible in code.
when it comes to games, if the whole game-service is off, the activity request still works, returning game:null. that's because an activity could still be valid, even without the game-service on - i imagine, some activities like 'viewed the game', could still work.

---

## 3. The tradeoff

Every time a client creates an activity, three services are involved synchronously. They all have to be running, healthy, and fast.

**What is the systemic risk of chaining synchronous calls like this?**

What happens to the user experience if the slowest service in the chain takes 3 seconds to respond?

> *Your answer:*
so, the activity-service being dependent on user and game services means that it would need to wait for the user and game to be on/return a response. talking about those 3seconds, it would definitely add 3 seconds to the total time, and, maaybe more seconds, depending on what exactly took time.

---

*Keep this file. You will refer back to it during the oral presentation.*
