 # same version as playwright in pyproject.toml
FROM mcr.microsoft.com/playwright/python:v1.59.0

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# install uv
RUN pip install --no-cache-dir uv

# copy dependency files
COPY pyproject.toml uv.lock ./

# install deps (FAST ⚡)
RUN uv sync --frozen --no-dev --no-install-project

# activate venv for all subsequent command
ENV PATH="/app/.venv/bin:$PATH"

RUN playwright install chromium

# copy app
COPY . .

RUN uv sync --frozen --no-dev

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]