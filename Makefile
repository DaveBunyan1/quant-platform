# quant-platform — developer commands
# Usage: make <target>
#
# Requires: Docker, Docker Compose v2, Node 20+, Python 3.14+, uv (optional but recommended)

.PHONY: help up down build logs ps restart clean \
        backend-shell frontend-shell db-shell redis-cli \
        migrate migrate-create \
        lint format typecheck \
        test test-unit test-integration test-frontend test-all test-cov test-watch \
        test-db-up test-db-down test-db-reset \
        ci install

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
COMPOSE          ?= docker compose
COMPOSE_TEST     ?= docker compose -f docker-compose.test.yml
BACKEND_DIR      ?= backend
FRONTEND_DIR     ?= frontend
TEST_DATABASE_URL ?= postgresql+asyncpg://test:test@localhost:5433/quant_platform_test

CYAN  := \033[36m
RESET := \033[0m

# ---------------------------------------------------------------------------
# Help
# ---------------------------------------------------------------------------
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "$(CYAN)%-22s$(RESET) %s\n", $$1, $$2}'

# ---------------------------------------------------------------------------
# Docker lifecycle
# ---------------------------------------------------------------------------
up: ## Start full stack (db, redis, backend, frontend, prometheus, grafana)
	$(COMPOSE) up -d --build
	@echo ""
	@echo "  Backend:    http://localhost:8000"
	@echo "  Frontend:   http://localhost:5173"
	@echo "  API docs:   http://localhost:8000/docs"
	@echo "  Prometheus: http://localhost:9090"
	@echo "  Grafana:    http://localhost:3000  (admin/admin)"
	@echo ""

down: ## Stop all services
	$(COMPOSE) down

build: ## Build (or rebuild) images without starting
	$(COMPOSE) build

logs: ## Tail logs (optional: SERVICE=backend)
	$(COMPOSE) logs -f $(SERVICE)

ps: ## Show running containers
	$(COMPOSE) ps

restart: ## Restart all (or SERVICE=backend)
	$(COMPOSE) restart $(SERVICE)

clean: ## Stop and remove containers, volumes, and dangling images
	$(COMPOSE) down -v --remove-orphans
	$(COMPOSE_TEST) down -v --remove-orphans 2>/dev/null || true
	@echo "Cleaned."

# ---------------------------------------------------------------------------
# Shells / introspection
# ---------------------------------------------------------------------------
backend-shell: ## Open a shell in the backend container
	$(COMPOSE) exec backend bash

frontend-shell: ## Open a shell in the frontend container
	$(COMPOSE) exec frontend sh

db-shell: ## psql into the primary database
	$(COMPOSE) exec db psql -U quant -d quant_platform

redis-cli: ## redis-cli into Redis
	$(COMPOSE) exec redis redis-cli

# ---------------------------------------------------------------------------
# Database migrations (Alembic)
# ---------------------------------------------------------------------------
migrate: ## Apply pending migrations
	$(COMPOSE) exec backend alembic -c /app/src/quant_platform/alembic.ini upgrade head

migrate-create: ## Create a new migration (MSG="description")
	@test -n "$(MSG)" || (echo 'Usage: make migrate-create MSG="add foo column"' && exit 1)
	$(COMPOSE) exec backend alembic -c /app/src/quant_platform/alembic.ini revision --autogenerate -m "$(MSG)"

# ---------------------------------------------------------------------------
# Lint / format / typecheck
# ---------------------------------------------------------------------------
lint: ## Lint backend (ruff) + frontend (eslint)
	cd $(BACKEND_DIR) && ruff check src tests
	cd $(FRONTEND_DIR) && npm run lint

format: ## Auto-format backend (ruff) + frontend (prettier)
	cd $(BACKEND_DIR) && ruff format src tests && ruff check --fix src tests
	cd $(FRONTEND_DIR) && npx prettier --write "src/**/*.{ts,tsx,css,json}"

typecheck: ## Type-check backend (mypy) + frontend (tsc)
	cd $(BACKEND_DIR) && mypy src
	cd $(FRONTEND_DIR) && npx tsc -b --noEmit

# ---------------------------------------------------------------------------
# Test database
# ---------------------------------------------------------------------------
test-db-up: ## Start the isolated test Postgres
	$(COMPOSE_TEST) up -d --wait

test-db-down: ## Stop the test Postgres
	$(COMPOSE_TEST) down

test-db-reset: ## Wipe and recreate the test database
	$(COMPOSE_TEST) down -v
	$(COMPOSE_TEST) up -d --wait

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------
test: test-db-up ## Run all backend tests
	@echo "Running backend tests..."
	cd $(BACKEND_DIR) && TEST_DATABASE_URL=$(TEST_DATABASE_URL) \
		pytest -v --tb=short tests/

test-unit: ## Run backend unit tests only (no DB)
	cd $(BACKEND_DIR) && pytest -v --tb=short -m unit tests/

test-integration: test-db-up ## Run backend integration tests
	cd $(BACKEND_DIR) && TEST_DATABASE_URL=$(TEST_DATABASE_URL) \
		pytest -v --tb=short -m integration tests/

test-frontend: ## Run frontend Vitest suite
	cd $(FRONTEND_DIR) && npm run test:run

test-all: test test-frontend ## Run backend + frontend tests

test-cov: test-db-up ## Backend coverage report
	cd $(BACKEND_DIR) && TEST_DATABASE_URL=$(TEST_DATABASE_URL) \
		pytest --cov=quant_platform --cov-report=term-missing --cov-report=html tests/

test-watch: test-db-up ## Backend tests in watch mode (requires pytest-watch)
	cd $(BACKEND_DIR) && TEST_DATABASE_URL=$(TEST_DATABASE_URL) \
		ptw -- -v --tb=short tests/

# ---------------------------------------------------------------------------
# CI convenience
# ---------------------------------------------------------------------------
ci: lint typecheck test-all ## Full local CI gate (lint + typecheck + tests)

# ---------------------------------------------------------------------------
# Local install (without Docker)
# ---------------------------------------------------------------------------
install: ## Install backend + frontend deps locally
	cd $(BACKEND_DIR) && (uv pip install -e ".[dev]" || pip install -e ".[dev]")
	cd $(FRONTEND_DIR) && npm install