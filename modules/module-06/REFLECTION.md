# Module 6 — Reflection

**Team name**: **\*\***\_\_\_**\*\***
**Branch**: `module-06/<team-name>`
**Submitted**: before Module 7 lesson

---

Answer the three questions below. There are no right or wrong answers — we are looking for your reasoning, not a textbook definition. A few honest sentences are worth more than a long generic paragraph.

---

## 1. The "why"

The gateway now validates every JWT before forwarding a request. Individual services no longer need to check identity themselves.

**What does centralising authentication at the gateway buy you?** What would the alternative look like — if every service validated tokens on its own?

Think about what happens when you need to rotate the secret key, or add a new service to the system.

> _Your answer:_
> to centralise authentication at the gateway is to give the system one main entry point, where identity is verified before a request reaches any service. this adds control. if a request has no token or it's invalid, it is rejected immediately and the internal services stay protected.

the alternative - for every service to validate separately. that creates duplicate and unnecessarily lenthy therefore logic in every other service. to change one thing might lead to needing to change it 5-6 times. adding a gateway as a guardian-orchesteator guy makes life simpler because it handles the identity itself before forwarding the request.

that said, some services might still need to checka auth-n, to verify what the user is allowed to do exactly - some users like admins would have more control.

---

## 2. Your choice

When activity-service calls user-service internally, it uses a Machine-to-Machine (M2M) token — not a user's token.

**Why can't it just reuse the user's token that arrived in the original request?**

What would break, or what door would you accidentally leave open, if services passed user tokens between themselves?

> _Your answer:_
> a machine to machine token makes the request explicit: the caller is activity-service with the role service. it is the trusted service.

if services instead passed user tokens between themselves, it would blur the boundary between use actions and service actions. a service could accidentally gain the ability to perform any action the user can perform, even if it's unnecessary - and this would be a violation of the least proveledge principle.

## using M2M is cleaner because it limits the identity of the internal caller. user tokens represent users. service tokens represent services. keeping those separate makes the system easier to reason about and safer to extend.

## 3. The tradeoff

The gateway and the auth-service share the same `SECRET_KEY` to verify tokens without making a network call on every request.

**What is the security risk of sharing this key?** What happens if it leaks?

And what would the alternative look like — verifying tokens by calling auth-service on every request instead? What does that cost you?

> _Your answer:_
> gateway and auth-service share secret key which is efficient because token verification is fast and does not require a network call. + the gateway can keep working even if auth-service is temporarily unavailable, as long as the user already has a valid token.

the risk is that the shared secret becomes sensitive. if it leaks, an attacker could potentilly create fake valid tokens and pretend to be any user or role, including admin. this would break the trust model of the whole system. as such, the key must be stored securely and all that.

the alternative would be for the gateway to call auth-service on every request to verify the token. that would reduce the need to share the secret key widely, but it would also make every request slower and create a dependency on auth-service availability.

---

_Keep this file. You will refer back to it during the oral presentation._
