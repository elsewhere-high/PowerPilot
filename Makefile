PROJECT_ENV ?= $(CURDIR)/.conda-env
PROJECT_CONDA ?= conda
PROJECT_PYTHON = $(PROJECT_CONDA) run --no-capture-output -p "$(PROJECT_ENV)" python

.PHONY: env install format lint typecheck test build run demo prepare-data verify

env:
	@test -d "$(PROJECT_ENV)/conda-meta" || $(PROJECT_CONDA) env create --prefix "$(PROJECT_ENV)" --file environment.yml

install: env
	$(PROJECT_PYTHON) -m pip install -e ".[dev]"

format:
	$(PROJECT_PYTHON) -m ruff format src tests
	$(PROJECT_PYTHON) -m ruff check --fix src tests

lint:
	$(PROJECT_PYTHON) -m ruff format --check src tests
	$(PROJECT_PYTHON) -m ruff check src tests

typecheck:
	$(PROJECT_PYTHON) -m mypy src

test:
	$(PROJECT_PYTHON) -m pytest

build:
	$(PROJECT_PYTHON) -m pip wheel --no-deps --wheel-dir dist .

run:
	PROJECT_CONDA_ENV="$(PROJECT_ENV)" PROJECT_CONDA_BIN="$(PROJECT_CONDA)" bash scripts/start_local.sh

demo: run

prepare-data:
	$(PROJECT_PYTHON) scripts/prepare_emsx_core_fixture.py

verify: lint typecheck test
