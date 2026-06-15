# Module 5 — Reflection

**Team name**: ******\_\_\_******
**Branch**: `module-05/<team-name>`
**Submitted**: before Module 6 lesson

---

Answer the three questions below. There are no right or wrong answers — we are looking for your reasoning, not a textbook definition. A few honest sentences are worth more than a long generic paragraph.

---

## 1. The "why"

The game-service now has two models for the same data: SQLite for writes, Redis for reads. They store the same games in two different shapes.

**Why go through the trouble of maintaining two representations of the same data?**

Think about what kind of queries each model is optimised for, and what would happen if you tried to use the write model for high-traffic read operations.

> _Your answer:_
> 2 different needs: consistency and availability.
> for the consistency - writing accurate full data into SQL.
> for the availabaility - write a summary into Redis as cache.

not every request needs the full game object - frontend might only need a tutle and genre, then cached data is sufficient.

then, there is a limitation related to redundant cached info, but that's a problem for a different day.

---

## 2. Your choice

The logging-service checks GDPR consent before recording any activity. If a user has not opted in, the log is silently dropped.

**What does this consent check force you to accept about your data?** It is incomplete by design — some activities will never be recorded.

From a system design perspective: where is the right place to enforce this rule — in the logging-service, in the activity-service, or at the gateway? Why?

> _Your answer:_
> so the issue here is that logs aren't stored if the user hasn't opted in, and therefore logs aren't complete.
> logs are merely a collection of data which was allowed to be saved.

we aren't solving the issue. instead, we are helping it.

by enforcing a rule in logging-service, we can make our system incomplete by GDPR-compliant, because logging-service is the one responsible for saving the logs.

---

## 3. The tradeoff

With CQRS, your write model and read model can drift out of sync — a game is updated in SQLite but the Redis projection still shows the old data.

**In what scenario does this inconsistency matter to the user? In what scenario is it completely acceptable?**

Is there a class of applications where eventual consistency is never acceptable? What are they?

> _Your answer:_
> to tell the truth, this issue, which i touched on while ansqwewring the first question, is not seeming to me like a big one. looking at the games names and release dates - those aren't really sensitive to often changes if they are sensitive to changes at all.

of course, activities is the thing that gets updates all the time, but that thing is solvable by constantly deleting old activities and writing new ones, IF we were to add Redis there, too.

a list of applications where eventual consistency is never acceptable is probably somehting with constantly changing data like financial markets, some legal or medical stuff.

---

_Keep this file. You will refer back to it during the oral presentation._
