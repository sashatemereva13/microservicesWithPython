#!/usr/bin/env bash

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICES="$SCRIPT_DIR/services"

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

get_python() {
  local dir="$1"

  if [ -f "$dir/.venv/Scripts/python" ]; then
    echo "$dir/.venv/Scripts/python"
  elif [ -f "$dir/.venv/bin/python" ]; then
    echo "$dir/.venv/bin/python"
  else
    echo ""
  fi
}

ensure_venv() {
  local name="$1"
  local dir="$2"

  local python
  python="$(get_python "$dir")"

  if [ -z "$python" ]; then
    echo "[$name] no .venv found — creating one..." >&2
    (cd "$dir" && python3 -m venv .venv)
    python="$(get_python "$dir")"
  fi

  echo "$python"
}

install_requirements() {
  local name="$1"
  local dir="$2"
  local python="$3"

  if [ -f "$dir/requirements.txt" ]; then
    echo "[$name] installing requirements..."
    (cd "$dir" && "$python" -m pip install -r requirements.txt -q)

    if [ "$name" = "auth-service" ]; then
      echo "[$name] pinning bcrypt==4.0.1..."
      (cd "$dir" && "$python" -m pip install --force-reinstall "bcrypt==4.0.1" -q)
    fi

    if [ "$name" = "gateway" ]; then
      echo "[$name] ensuring python-jose is installed..."
      (cd "$dir" && "$python" -m pip install "python-jose[cryptography]==3.3.0" -q)
    fi
  fi
}

run_uvicorn() {
  local name="$1"
  local port="$2"
  local dir="$SERVICES/$name"

  if [ ! -d "$dir" ]; then
    echo "[$name] skipping — directory not found: $dir"
    return
  fi

  if [ ! -f "$dir/app/main.py" ]; then
    echo "[$name] skipping — no app/main.py"
    return
  fi

  local python
  python="$(ensure_venv "$name" "$dir")"

  if [ -z "$python" ] || [ ! -f "$python" ]; then
    echo "[$name] skipping — could not find or create Python venv"
    return
  fi

  install_requirements "$name" "$dir" "$python"

  echo "[$name] -> http://localhost:$port"
  (cd "$dir" && "$python" -m uvicorn app.main:app --host 127.0.0.1 --port "$port" --reload) &
  PIDS+=($!)
}

run_flask() {
  local name="$1"
  local port="$2"
  local dir="$SERVICES/$name"

  if [ ! -d "$dir" ]; then
    echo "[$name] skipping — directory not found: $dir"
    return
  fi

  if [ ! -f "$dir/app/main.py" ]; then
    echo "[$name] skipping — no app/main.py"
    return
  fi

  local python
  python="$(ensure_venv "$name" "$dir")"

  if [ -z "$python" ] || [ ! -f "$python" ]; then
    echo "[$name] skipping — could not find or create Python venv"
    return
  fi

  install_requirements "$name" "$dir" "$python"

  echo "[$name] -> http://localhost:$port"
  (cd "$dir" && "$python" -m flask --app app.main run --host 127.0.0.1 --port "$port") &
  PIDS+=($!)
}

run_node() {
  local name="$1"
  local port="$2"
  local dir="$SERVICES/$name"

  if [ ! -d "$dir" ]; then
    echo "[$name] skipping — directory not found: $dir"
    return
  fi

  if [ ! -f "$dir/package.json" ]; then
    echo "[$name] skipping — no package.json"
    return
  fi

  echo "[$name] -> http://localhost:$port"

  (
    cd "$dir"

    if [ -s "$HOME/.nvm/nvm.sh" ]; then
      . "$HOME/.nvm/nvm.sh"
      nvm use 20.20.2 || true
    else
      echo "[$name] nvm not found — using current node/npm"
    fi

    npm install
    npm run dev
  ) &

  PIDS+=($!)
}

echo ""
echo "Starting Python / FastAPI services..."
run_uvicorn "gateway"           8000
run_uvicorn "user-service"      8001
run_uvicorn "game-service"      8002
run_uvicorn "activity-service"  8003
run_uvicorn "auth-service"      8005

echo ""
echo "Starting Flask service..."
run_flask "logging-service"     8006

echo ""
echo "Starting Node service..."
run_node "notification-service" 8004

echo ""
echo "All services requested:"
echo "gateway              http://localhost:8000"
echo "user-service         http://localhost:8001"
echo "game-service         http://localhost:8002"
echo "activity-service     http://localhost:8003"
echo "notification-service http://localhost:8004"
echo "auth-service         http://localhost:8005"
echo "logging-service      http://localhost:8006"
echo ""
echo "Press Ctrl+C to stop all services."

wait "${PIDS[@]}"