FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_SYSTEM_PYTHON=1 \
    PATH="/app/.venv/bin:$PATH"

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd --gid 1000 app && \
    useradd --uid 1000 --gid app --shell /bin/bash --create-home app

COPY pyproject.toml README.md ./
COPY src ./src

RUN uv venv /app/.venv && \
    uv pip install -e ".[dev]" && \
    chown -R app:app /app

USER app

EXPOSE 8000

CMD ["uvicorn", "quant_platform.main:app", "--host", "0.0.0.0", "--port", "8000"]