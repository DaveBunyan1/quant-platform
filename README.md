# quant-platform

A quantitative finance platform for portfolio tracking, risk analytics, factor models, and graph-based strategy research.

**Current status:** core infrastructure, authentication, holdings / portfolio aggregation, and observability. Advanced analytics (Sharpe, Fama-French, MST/GNN, backtester) are on the roadmap.

---

## Stack

| Layer         | Technology                                                    |
| ------------- | ------------------------------------------------------------- |
| Backend       | Python 3.14, FastAPI, SQLAlchemy (async), Alembic, Redis      |
| Frontend      | React 19, TypeScript, Vite, TanStack Query, Zustand, Tailwind |
| Data          | PostgreSQL 16, Redis 7                                        |
| Observability | structlog, Prometheus, Grafana, web-vitals                    |
| Tooling       | ruff, mypy, pytest, vitest, Docker Compose, Make              |

---

## Quick start

### Prerequisites

- Docker + Docker Compose v2
- (Optional for local non-Docker work) Python 3.14+, Node 20+, [uv](https://github.com/astral-sh/uv)

### 1. Clone and configure

```bash
git clone https://github.com/DaveBunyan1/quant-platform.git
cd quant-platform
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET_KEY and CSRF_SECRET_TOKEN to long random values
```

### 2. Start the full stack

```bash
make up
```

| Service    | URL                                 |
| ---------- | ----------------------------------- |
| Frontend   | http://localhost:5173               |
| Backend    | http://localhost:8000               |
| API docs   | http://localhost:8000/docs          |
| Prometheus | http://localhost:9090               |
| Grafana    | http://localhost:3000 (admin/admin) |

### 3. Apply database migrations

```bash
make migrate
```

### 4. Useful commands

```bash
make help            # list all targets
make logs            # tail all logs (or SERVICE=backend)
make down            # stop
make clean           # stop + remove volumes
make test-all        # backend + frontend tests
make ci              # lint + typecheck + tests (local CI gate)
```

---

## Project layout

```
quant-platform/
├── backend/
│   ├── src/quant_platform/
│   │   ├── api/           # HTTP routes
│   │   ├── auth/          # JWT, password, CSRF
│   │   ├── core/          # DB, Redis, yfinance client, exceptions
│   │   ├── features/
│   │   │   ├── portfolio/ # holdings aggregation, PnL, weights, Prometheus metrics
│   │   │   └── transactions/
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   └── alembic/       # migrations
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   └── dashboard/
│   │   ├── pages/
│   │   ├── lib/           # logger, web-vitals, token helpers
│   │   └── test/
│   ├── Dockerfile
│   └── package.json
├── observability/
│   ├── prometheus/
│   └── grafana/provisioning/
├── .github/workflows/ci.yml
├── docker-compose.yml
├── docker-compose.test.yml
├── Makefile
└── .env.example
```

---

## Development

### Backend only (local)

```bash
cd backend
uv venv && source .venv/bin/activate
uv pip install -e ".[dev]"

# Start Postgres + Redis via Compose
docker compose up -d db redis

# Copy .env and point DATABASE_URL / REDIS_URL at localhost
export $(grep -v '^#' ../.env | xargs)
uvicorn quant_platform.main:app --reload --port 8000
```

### Frontend only (local)

```bash
cd frontend
npm install
npm run dev
```

### Tests

```bash
# Backend (spins up an isolated Postgres on :5433)
make test
make test-unit
make test-integration
make test-cov

# Frontend
make test-frontend

# Everything
make test-all
```

### Lint & format

```bash
make lint
make format
make typecheck
```

---

## Observability

- **Backend structured logging** via `structlog` (pretty console in development, JSON in production).
- **Prometheus metrics** exposed at `/metrics` (request latency, portfolio cache hits/misses, yfinance latency, DB query times).
- **Grafana** is pre-provisioned with the Prometheus datasource.
- **Frontend** collects Core Web Vitals (CLS, INP, LCP, FCP, TTFB) and logs them; a future endpoint will ship them to the backend.

---

## Authentication

- Register / login with email + password (Argon2).
- Short-lived JWT access tokens + rotating HTTP-only refresh-token cookies.
- CSRF protection on mutating routes (Starlette CSRF middleware).
- Protected routes use `get_current_user` dependency.

---

## Portfolio (current)

Authenticated users can:

- Record transactions (buy/sell).
- View aggregated holdings with current market prices (yfinance + Redis cache).
- See cost basis, unrealized PnL, and portfolio weights.

Prometheus counters and histograms instrument the portfolio summary path end-to-end.

---

## Roadmap

Ordered implementation plan:

1. **Infrastructure & README** ← _you are here_
2. **Complete observability** across backend + frontend
3. **Full automated test suite** for the current codebase
4. **Core metrics** — Sharpe, Sortino, max drawdown, Fama-French regressions, projection chart (return + vol with p95/p99 bands)
5. **Basic MST** as the first graph layer toward a GNN
6. **Backtester** with configurable rebalancing periods and transaction costs (bps)
7. **GNN** for portfolio evaluation using centrality, with optional high/low-centrality regime switching

See `TODO.md` for smaller outstanding items (frontend test coverage expansion, auth refresh UX, etc.).

---

## License

MIT
