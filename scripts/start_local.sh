#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ENV="${PROJECT_CONDA_ENV:-${PROJECT_ROOT}/.conda-env}"
PROJECT_CONDA="${PROJECT_CONDA_BIN:-conda}"
cd "${PROJECT_ROOT}"

if [[ ! -d "${PROJECT_ENV}/conda-meta" ]]; then
  echo "Run make install to create this project's Conda environment first." >&2
  exit 1
fi

if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

export SIMULATION_MODE="${SIMULATION_MODE:-true}"
export ALLOW_PRODUCTION_WRITE="${ALLOW_PRODUCTION_WRITE:-false}"
export AGENTTEAMS_ENABLED="${AGENTTEAMS_ENABLED:-false}"
export AGENTTEAMS_LIVE_REQUIRED="${AGENTTEAMS_LIVE_REQUIRED:-true}"
export AGENTTEAMS_RUNTIME_MODE="${AGENTTEAMS_RUNTIME_MODE:-remote_matrix}"
export POWERPILOT_HOST="${POWERPILOT_HOST:-127.0.0.1}"
export POWERPILOT_PORT="${POWERPILOT_PORT:-8000}"
export POWERPILOT_DB_PATH="${POWERPILOT_DB_PATH:-${PROJECT_ROOT}/var/powerpilot.db}"
export POWERPILOT_EVIDENCE_DIR="${POWERPILOT_EVIDENCE_DIR:-${PROJECT_ROOT}/runs}"

exec "${PROJECT_CONDA}" run --no-capture-output -p "${PROJECT_ENV}" \
  python -m uvicorn powerpilot.api:app --app-dir "${PROJECT_ROOT}/src" \
  --host "${POWERPILOT_HOST}" --port "${POWERPILOT_PORT}" "$@"
