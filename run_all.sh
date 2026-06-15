#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICES="$SCRIPT_DIR/services"
NOTIFICATION="$SERVICES/notification-service"

PIDS=()

cleanup() {
  echo ""
  echo "Stopping all services..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  exit 0
}

trap cleanup SIGINT SIGTERM

echo "[infra] starting redis + rabbitmq..."
docker compose -f "$SCRIPT_DIR/docker-compose.infra.yml" up -d redis rabbitmq

run_uvicorn() {
  local name="$1"
  local port="$2"
  local dir="$SERVICES/$name"

  if [ ! -f "$dir/app/main.py" ]; then
    echo "[$name] skipping — no app/main.py"
    return
  fi

  local python
  if [ -f "$dir/.venv/Scripts/python" ]; then
    python="$dir/.venv/Scripts/python"
  elif [ -f "$dir/.venv/bin/python" ]; then
    python="$dir/.venv/bin/python"
  else
    echo "[$name] skipping — no python in .venv"
    return
  fi

  if [ -f "$dir/requirements.txt" ]; then
    echo "[$name] installing requirements..."
    (cd "$dir" && "$python" -m pip install -r requirements.txt -q)
  fi

  echo "[$name] -> http://localhost:$port"
  (cd "$dir" && "$python" -m uvicorn app.main:app --port "$port" --reload) &
  PIDS+=($!)
}

run_flask() {
  local name="$1"
  local port="$2"
  local dir="$SERVICES/$name"

  if [ ! -f "$dir/app/main.py" ]; then
    echo "[$name] skipping — no app/main.py"
    return
  fi

  local python
  if [ -f "$dir/.venv/Scripts/python" ]; then
    python="$dir/.venv/Scripts/python"
  elif [ -f "$dir/.venv/bin/python" ]; then
    python="$dir/.venv/bin/python"
  else
    echo "[$name] skipping — no python in .venv"
    return
  fi

  if [ -f "$dir/requirements.txt" ]; then
    echo "[$name] installing requirements..."
    (cd "$dir" && "$python" -m pip install -r requirements.txt -q)
  fi

  echo "[$name] -> http://localhost:$port"
  (cd "$dir" && "$python" -m flask --app app.main run --port "$port") &
  PIDS+=($!)
}

run_uvicorn "gateway"           8000
run_uvicorn "user-service"      8001
run_uvicorn "game-service"      8002
run_uvicorn "activity-service"  8003
run_uvicorn "auth-service"      8005

run_flask   "logging-service"   8006

if [ -f "$NOTIFICATION/package.json" ]; then
  echo "[notification-service] -> http://localhost:8004"
  (cd "$NOTIFICATION" && nvm use 20.20.2 && npm install && npm run dev) &
  PIDS+=($!)
else
  echo "[notification-service] skipping — no package.json"
fi

echo ""
echo "Press Ctrl+C to stop all services."
wait "${PIDS[@]}"