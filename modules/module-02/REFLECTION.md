# Module 2 — Reflection

**Team name**: ******\_\_\_******
**Branch**: `module-02/<team-name>`
**Submitted**: before Module 3 lesson

---

Answer the three questions below. There are no right or wrong answers — we are looking for your reasoning, not a textbook definition. A few honest sentences are worth more than a long generic paragraph.

---

## 1. The "why"

You built a service with distinct layers: models, schemas, repository, service, and routes — each with a single responsibility.

**Why not just put everything in one file and call it done?**

Think about what happens six months later when someone new joins the team, or when you need to swap SQLite for PostgreSQL. What does the layered structure protect you from?

> _Your answer:_
> so, i see it often with my own projects, even with simplier frontend structure, things get lost, if not organised. things could be defined twice accidentally just because they don't have their own place. it could be a strategic move, if you'd like to prevent anybody working with you , maybe you prefer it. however, my own memory isn't suited for remembering the complex strutcure of every one of my projects. plus, i assume i will be working with others, soon. what we've been doing in module02 is putting every little detail in its right place. and when everything has its place, it's not going to be duplicated. it becomes a strucutre that's easy to update and improve in the future, which gives it a long life. makes sense to microservice if you'd like to grow.

---

## 2. Your choice

Each service owns its data exclusively — no other service is allowed to touch its database directly.

**Pick one entity your service owns (e.g. `User`, `Game`). What would go wrong if another service could write to that table directly?**

Give a concrete scenario, not a general principle.

> _Your answer:_
> ok so it's like for example if a user service would be importing from the game repository file to create a game ? then perhaps creating a game must fulfill a particular rule like a game must be for all ages or only 18+ or only RPG... then the user service doesn't know about this rule and that's it, the rule is wasted. in other words, if user-service were to write to the Game db directly, it could potentially create an invalid game.

---

## 3. The tradeoff

You now have models, schemas, a repository, a service, and routes — five layers for what is essentially a CRUD service.

**For a system this small, what is the cost of all this structure?**

And at what point does the complexity start to pay off? Where is the tipping point?

> _Your answer:_
> i would very honestly say that it any point this complexity pays off. while doing the exercise, i was thinking that i should always structure my files like this, when it's appropriate, because it makes logical sense and i don't forget anything. and i am a 1 man team atp. me and ais, that's the team.
> however, of course, one could argue that for a little app with 2-3 models, of well, just use monolith and get it done with, quick and simple. why spend time on a personalised environemnt and such a lenghty folder structure? just remember a simple strcuture once and don't overcomplicate. to that, i have an answer - you never know how far each of your projects will go.
> the question is of course, at what point do the models start to form a forest?
> i dont know, but i would argue that the complexity pays off let's say after we reached our 3rd model - that's when models start to interact more and more, adding new and new routes to a point that potentially we'll be creating a separate folder for them, thematically, too.

---

_Keep this file. You will refer back to it during the oral presentation._
