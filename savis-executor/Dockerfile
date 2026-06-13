FROM python:3.14-slim AS python-base

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN pip install --no-cache-dir uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

ENV PATH="/app/.venv/bin:$PATH"

COPY . .
RUN uv sync --frozen --no-dev

FROM python-base AS api

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

FROM python-base AS beat

CMD ["celery", "-A", "app.adapters.celery.celery_app", "beat", "--loglevel=info", "--pidfile=/tmp/savis-celerybeat.pid", "--schedule=/tmp/savis-celerybeat-schedule"]

FROM python-base AS worker

CMD ["celery", "-A", "app.adapters.celery.celery_app", "worker", "--loglevel=info", "--concurrency=1"]
