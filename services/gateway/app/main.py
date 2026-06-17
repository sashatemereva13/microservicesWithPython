import httpx
from fastapi import FastAPI, Request, Response
from jose import JWTError, jwt

from app.config import settings

app = FastAPI(title="gateway", version="1.0.0")

# Routing table — maps the resource name in the URL path to the target service base URL.
# Path structure: /{version}/{resource}/...
#   e.g. GET /v1/users/123  →  resource = "users"  →  forward to user_service_url
#
# Add new entries here as each module introduces a new service.
# Module 4 will add: "notifications"
# Module 5 will add: "consent", "logs"
# Module 6 will add: "auth"
ROUTES: dict[str, str] = {
    "users":      settings.user_service_url,
    "games":      settings.game_service_url,
    "activities": settings.activity_service_url,
    "notifications": settings.notification_service_url,
    "consent": settings.logging_service_url,
    "logs": settings.logging_service_url,
    "auth": settings.auth_service_url,

}


@app.get("/health")
async def health():
    """
    Gateway liveness check. Handled here — never forwarded to a service.
    In Module 10 this endpoint will be upgraded to fan out to all services
    and return their individual status.
    """
    return {"status": "ok", "service": "gateway"}


@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy(request: Request, path: str):
    """
    Catch-all reverse proxy — forwards every request to the correct downstream service.

    Your job: implement the forwarding logic described below.

    ---
    Step 1 — Parse the path to find the resource name.

        The path arrives without the leading slash, e.g. "v1/users/123".
        Split it on "/" to get a list of segments:
            segments = path.split("/")
            # ["v1", "users", "123"]

        Index 0 is the version ("v1").
        Index 1 is the resource ("users", "games", "activities", ...).

        If the path has fewer than 2 segments, return a 404.

    ---
    Step 2 — Look up the resource in ROUTES.

        resource = segments[1]
        target_base = ROUTES.get(resource)

        If `resource` is not in ROUTES, return:
            Response(status_code=404, content=f"Unknown resource: {resource}")

    ---
    Step 3 — Build the target URL and forward the request.

        The full path must be forwarded as-is — no stripping, no rewriting.
        Reconstruct it with the leading slash:
            target_url = f"{target_base}/{path}"

        Forward using httpx, preserving method, headers, and body:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.request(
                    method=request.method,
                    url=target_url,
                    headers=request.headers.raw,   # forward all original headers
                    content=await request.body(),   # forward the body as-is
                    params=request.query_params,    # forward query string
                )

        Return a FastAPI Response with the downstream status, headers, and body:
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.headers.get("content-type"),
            )

    ---
    Step 4 — Handle an unreachable downstream service.

        Wrap the httpx call in a try/except for httpx.RequestError.
        If the service cannot be reached, return:
            Response(status_code=503, content="Service unavailable")

    ---
    Verify your implementation:
        curl http://localhost:8000/health
        curl http://localhost:8000/v1/users
        curl http://localhost:8000/v1/games
        curl http://localhost:8000/v1/activities
        curl http://localhost:8000/v1/unknown   # should return 404
    """
    # step 1 - parse the path
    segments = path.split("/")

    if len(segments) < 2:
        return Response(
            status_code=404,
            content="Not found"
        )
    
    # for ex in /v1/users/123 - find the users
    resource = segments[1]

    # step 2 - find the target service
    target_base = ROUTES.get(resource)

    if target_base is None:
        return Response(
            status_code=404,
            content=f"Unknown resource: {resource}"
        )
    
    # step 2.5 - JWT validation
    is_public_auth_token = (
        len(segments) >= 3
        and segments[0] == "v1"
        and segments[1] == "auth"
        and segments[2] == "token"
    )

    if not is_public_auth_token:
        authorization = request.headers.get("authorization")

        if not authorization or not authorization.startswith("Bearer "):
            return Response(
                status_code=401,
                content="Missing or invalid Authorization header"
            )
        
        token = authorization.removeprefix("Bearer ").strip()

        try:
            jwt.decode(
                token,
                settings.secret_key,
                algorithms=[settings.algorithm],
            )
        except JWTError:
            return Response(
                status_code=401,
                content="Invalid or expired token"
            )
    
    # step 3 - build the full target URL
    target_url = f"{target_base}/{path}"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            downstream_response = await client.request(
                method=request.method,
                url=target_url,
                headers=request.headers.raw,
                content=await request.body(),
                params=request.query_params,
            )
        
        return Response(
            content=downstream_response.content,
            status_code=downstream_response.status_code,
            headers=dict(downstream_response.headers),
            media_type=downstream_response.headers.get("content-type")
        )
    
    # step 4 - service unreachable
    except httpx.RequestError:
        return Response(
            status_code=503,
            content="Service unavailable"
        )
    
