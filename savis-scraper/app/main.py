"""Main entry point."""

from __future__ import annotations

from contextlib import asynccontextmanager
from threading import Thread
from typing import TYPE_CHECKING

from fastapi import FastAPI

from app.adapters.api.routes import router
from app.adapters.database.session import create_database_schema
from app.adapters.rabbitmq import subscriber

if TYPE_CHECKING:
    from collections.abc import AsyncIterator


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Start background consumers for the API process."""
    create_database_schema()
    Thread(target=subscriber.run_forever, daemon=True).start()
    yield


app = FastAPI(lifespan=lifespan)
app.include_router(router)
