FROM python:3.14-slim AS python-base

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN pip install --no-cache-dir uv \
    && groupadd --system savis \
    && useradd --system --gid savis --home-dir /app savis

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

ENV PATH="/app/.venv/bin:$PATH"

COPY . .
RUN uv sync --frozen --no-dev
RUN chown -R savis:savis /app

USER savis

FROM python-base AS api

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=4)"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

FROM python-base AS beat

CMD ["celery", "-A", "app.adapters.celery.celery_app", "beat", "--loglevel=info", "--pidfile=/tmp/savis-celerybeat.pid", "--schedule=/tmp/savis-celerybeat-schedule"]

FROM python-base AS worker

CMD ["celery", "-A", "app.adapters.celery.celery_app", "worker", "--loglevel=info", "--concurrency=1"]
