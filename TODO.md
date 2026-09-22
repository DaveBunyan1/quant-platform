# TODO

## Done / in progress (infra)

- [x] Professional Makefile
- [x] Docker Compose with frontend service
- [x] Multi-stage frontend Dockerfile
- [x] Hardened backend Dockerfile (non-root)
- [x] .env.example
- [x] GitHub Actions CI (lint, typecheck, test, Docker build)
- [x] Project README

## Next

- [ ] Complete observability for entire system (frontend metrics endpoint, Grafana dashboards, more backend instrumentation)
- [ ] Replace useState with zustand for client-side state
- [ ] Full automated test suite for current codebase (expand coverage, fix gaps)
- [ ] Core metrics (Sharpe, Fama-French, projection chart)
- [ ] Basic MST implementation
- [ ] Backtester (rebalancing periods + costs in bps)
- [ ] GNN for portfolio evaluation / centrality strategies

## Small outstanding items

- [ ] Expand frontend tests beyond auth forms
- [ ] Loki / structured log shipping
