# syntax=docker/dockerfile:1

FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_SYSTEM_PYTHON=1 \
    PATH="/app/.venv/bin:$PATH"

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy project metadata first for better caching
COPY pyproject.toml README.md ./
COPY src ./src

# Create venv + install everything in one go
RUN uv venv /app/.venv && \
    uv pip install -e .

EXPOSE 8000

CMD ["uvicorn", "quant_platform.main:app", "--host", "0.0.0.0", "--port", "8000"]