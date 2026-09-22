from prometheus_client import Counter, Histogram

CACHE_REQUESTS = Counter(
    "redis_cache_requests_total",
    "Total ticker cache lookup attempts",
    ["result"],  # hit | miss
)

CACHE_LATENCY = Histogram(
    "redis_cache_latency_seconds",
    "Time spent interacting with Redis cache",
)

YFINANCE_REQUESTS = Counter(
    "yfinance_requests_total",
    "Number of requests made to yfinance",
    ["result"],  # success | empty | error
)


YFINANCE_LATENCY = Histogram(
    "yfinance_request_duration_seconds",
    "Time spent fetching data from yfinance",
    buckets=(0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, float("inf")),
)

DB_QUERY_LATENCY = Histogram(
    "portfolio_db_query_duration_seconds",
    "Time spent executing portfolio aggregation queries",
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, float("inf")),
)

DB_QUERY_REQUESTS = Counter(
    "portfolio_db_queries_total",
    "Number of portfolio aggregation queries",
    ["result"],  # success | error
)

PORTFOLIO_REQUESTS = Counter(
    "portfolio_summary_requests_total",
    "Number of portfolio summary requests",
    ["result"],  # success | empty | error
)

PORTFOLIO_LATENCY = Histogram(
    "portfolio_summary_duration_seconds",
    "Time spent generating a portfolio summary",
    buckets=(0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, float("inf")),
)
