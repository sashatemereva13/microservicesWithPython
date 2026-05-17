# Tech Stack

On the Python side for the microservices, most services use FastAPI for the API framework. The exception is the logging-service, which runs on **Flask** with SQLAlchemy and Flask-Migrate for database migrations (PostgreSQL from Module 8, SQLite for local development). 

SQLAlchemy handles the database relationship mapping, 

Pydantic handles schema validation for FastAPI services, 

and a native `auth-service` (built with FastAPI, `python-jose`, and `passlib`) handles authentication and JWT token management. 

RabbitMQ handles all async messaging — both background notifications and activity logging. The databases include PostgreSQL for relational storage (from Module 8) and Redis for caching. SQLite is used for local development in Modules 1–7.

The notification-service runs on Node.js with SQLite — always local, never containerized. GitHub Actions manages Docker deployments and the CI/CD pipeline.

A custom **API gateway** (FastAPI, `gateway/` at the project root) is the single entry point for all client requests from Module 3 onward. It handles path-based routing, JWT validation, API version enforcement, and circuit breaking — growing incrementally across modules. It is not a domain service and lives outside the `services/` folder deliberately.

## Logging Service

To demonstrate polyglot microservices architecture, logging-service uses Flask instead of FastAPI. The choice of framework is transparent to clients — all other services, the gateway, and the API contracts remain unchanged.

The logging-service is a GDPR-compliant service that gathers data with respect for user preferences. It stores opt-in status for activity tracking. If a user chooses not to opt in, their actions are not recorded, but they may lose specific features like personalized recommendations or some social elements.

On the legal side, having detailed, structured logs that tie actions to a user allows you to trace activity and respect information requests if something illegal happens. Consent state and activity records are stored in the database (SQLite for Modules 1–7, PostgreSQL from Module 8). The JSONL append-only format described in some internal docs is an alternative design — in this course, the database is the source of truth.

In Modules 1–7, the logging-service uses SQLite for consent storage. From Module 8 onward, it switches to PostgreSQL.

## Stack Overview

The stack is a combination of microservices, RabbitMQ, PostgreSQL, Redis, SQLite, Node.js, and Docker.

- Microservices: FastAPI, SQLAlchemy, Pydantic, python-jose (JWT), passlib (passwords)
- RabbitMQ: Async messaging (activity → notification, activity → logging)
- PostgreSQL: Relational storage (production, from Module 8)
- SQLite: Local development storage (Modules 1–7), notification-service (always)
- Redis: Caching
- Node.js: notification-service (local, never containerized)
- Docker: Containerization (infrastructure from Module 4, services from Module 8)
- GitHub Actions: CI/CD
