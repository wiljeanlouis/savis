"""Main entry point."""

from fastapi import FastAPI

from app.infrastructure.config.logging import setup_logging
from app.infrastructure.entrypoints.api.routes.scraping_routes import router

setup_logging()

app = FastAPI()
app.include_router(router)
