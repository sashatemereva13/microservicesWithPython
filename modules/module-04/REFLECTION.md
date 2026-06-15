# Module 4 — Reflection

**Team name**: ******\_\_\_******
**Branch**: `module-04/<team-name>`
**Submitted**: before Module 5 lesson

---

Answer the three questions below. There are no right or wrong answers — we are looking for your reasoning, not a textbook definition. A few honest sentences are worth more than a long generic paragraph.

---

## 1. The "why"

In Module 3, services called each other directly over HTTP. Now activity-service drops a message into a broker and moves on — it never waits for a reply.

**What does the activity-service gain by not waiting? And what does the notification-service gain by consuming at its own pace?**

Think about what happens under load, or when notification-service is temporarily down.

> _Your answer:_
> the user wouldn't need to wait those extra 3 seconds while notification loads, for example.

the activity-service gains speed and independence - the user doesnt need to wait for the notification service to finish its work.

the notification-service gains flexibility - it can consume messages at its own pace. messages can wait in the queue , it's like there a load balancer situation.

---

## 2. Your choice

In Module 3 you already knew how to call another service directly over HTTP — you did it for user validation and game enrichment.

**Why not use the same approach for notifications? What does introducing a broker give you that a direct HTTP call doesn't?**

Think about what happens if notification-service is slow, or crashes mid-message.

> _Your answer:_
> technically, activity creation doesn't require notifications to exist at all. the important part is saving the activity. and if act-serv were to call notif-serv over HTTP, activity creation would need to slow down and wait for the notif-serv to be online. those precious 3 seconds.

a broker like a rabbitMQ creates decoupling of actions- activ-serv and notif-serv are independent. and so the systen becomes more resilient beacuse a temporaru problem in notif-serv wouldn't block act-serv.

---

## 3. The tradeoff

With synchronous REST, you get an immediate answer: success or failure. With async messaging, the activity is saved and the message is sent — but you have no idea if the notification was ever delivered.

**How would a user know if their notification was never sent? How would you know as a developer?**

What visibility do you lose when you go async?

> _Your answer:_
> so technically it is possible for the act-serv to send the info to notif-serv, but maybe broker and notif-serv are overloaded and the act-serv message gets lost.

my ai friend is saying that, as a developer, thet would need extra visibility via loads, rabbitMQ queue monitoring, consumer logs, retries, or maybe a dead-letter queue for failed messages. with synchronous REST, the caller immediately gets a success or error response from the downstream service. with async, we lose that immediate confirmation. we know the activity was saved and that the messsage was published, but we do not automatically know whether the notif-serv consumed it and processed it successfully.

the tradeoff is thatb async messaguing makes the system faster and more resilient, but it als makes debugging and confirmation harder. we need monitoring and logging to understand what happens after the message is published.

---

_Keep this file. You will refer back to it during the oral presentation._
