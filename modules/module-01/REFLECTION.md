## YOU NEED TO COMMIT THIS FILE BEFORE MOVING ON TO THE NEXT MODULE ! 🚨

**feel free to delete this comment**

# Module 1 — Reflection

**Team name**: **\*\***\_\_\_**\*\***
**Branch**: `module-01/<team-name>`
**Submitted**: before Module 2 lesson

---

Answer the three questions below. There are no right or wrong answers — we are looking for your reasoning, not a textbook definition. A few honest sentences are worth more than a long generic paragraph.

---

## 1. The "why"

You started from a painful monolith. Now you're splitting it into separate services.

**What concrete problem does that split solve: and for whom?**

Think about it from three angles: the developer who has to change code, the team that has to deploy it, and the user who has to live with its failures. You don't need to cover all three, pick the one that felt most real to you today.

> _***Your answer:_***
as the monolith structure mixes everything together, it's fragile. i intend to change one thing, but lots of other things could get affected.
the more the system is split, the easier it is to find out parts, to work with parts, to follow the overall logic, the less time it takes to understand the project if it's not yours for example and you see it for the first time. but more than that, the split also affects the user by makign some errors/failures/bugs less prominent. like the issue with deleting an activity from the painful-monolith, i imagine, would be eliminated by using microservises structure.

---

## 2. Your choice

Look at your service map. Every arrow between two services is a decision someone made.

**Pick one boundary, one place where you decided service A should not be part of service B. Explain why that line exists.**

What would break, slow down, or become harder to manage if you merged those two services back together?

> ***_Your answer:_***
let's zoom in on the boundary between activity-s and logging-s:
the activity-s handles business activity - what the user does inside the GameHub.
the logging-s is responsible for the tech/audit logging rules, consent checks, etc.
 activity and logging have different purposes, but need to communicate to achieve something together, too.
 if the product experience was to be merged with observability, user actions would be too tightly connected with consent checks and storage decisions, which in turn makes failure more prominent, when logging is broken, for ex.

---

## 3. The tradeoff

Microservices solve the monolith's problems. But they create new ones.

**Name one thing that was simpler in the monolith and is now harder in your distributed design.**

No need to solve it: just name it honestly. This is exactly the tension the rest of the course is about.

> ***_Your answer:_***
certainly, with microservices, the communication between components becomes more nuanced. if you don't know how components should talk to each other, you are prone to fail.

---

_Keep this file. You will refer back to it during the oral presentation._
