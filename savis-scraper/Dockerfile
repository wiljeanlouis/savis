FROM mcr.microsoft.com/playwright/python:v1.59.0-jammy

WORKDIR /app

# install uv
RUN pip install uv

# copy dependency files
COPY pyproject.toml uv.lock ./

# install deps (FAST ⚡)
RUN uv sync --frozen

RUN uv run playwright install --with-deps

# copy app
COPY . .

ENV PYTHONUNBUFFERED=1

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]