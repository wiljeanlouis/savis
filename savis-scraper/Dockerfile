 # same version as playwright in pyproject.toml
FROM mcr.microsoft.com/playwright/python:v1.59.0

WORKDIR /app

# install uv
RUN pip install uv

# copy dependency files
COPY pyproject.toml uv.lock ./

# install deps (FAST ⚡)
RUN uv sync --frozen --no-dev --no-install-project

# activate venv for all subsequent command
ENV PATH="/app/.venv/bin:$PATH"

RUN uv run playwright install chromium

# copy app
COPY . .

ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]