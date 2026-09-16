.PHONY: test test-unit test-integration test-db-up test-db-down test-db-reset test-cov test-watch

# ---------- Test database ----------
test-db-up:
	docker compose -f docker-compose.test.yml up -d --wait

test-db-down:
	docker compose -f docker-compose.test.yml down

test-db-reset: test-db-down
	docker compose -f docker-compose.test.yml down -v
	docker compose -f docker-compose.test.yml up -d --wait

# ---------- Tests ----------
TEST_DATABASE_URL ?= postgresql+asyncpg://test:test@localhost:5433/quant_platform_test

test: test-db-up
	@echo "Running all tests..."
	TEST_DATABASE_URL=$(TEST_DATABASE_URL) pytest -v --tb=short backend/tests/

test-unit:
	@echo "Running unit tests..."
	pytest -v --tb=short backend/tests/unit/

test-integration: test-db-up
	@echo "Running integration tests..."
	TEST_DATABASE_URL=$(TEST_DATABASE_URL) pytest -v --tb=short backend/tests/integration/

test-cov: test-db-up
	TEST_DATABASE_URL=$(TEST_DATABASE_URL) pytest --cov=quant_platform --cov-report=term-missing --cov-report=html

test-watch: test-db-up
	TEST_DATABASE_URL=$(TEST_DATABASE_URL) ptw -- -v --tb=short