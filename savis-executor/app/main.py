"""Main entry point."""

from __future__ import annotations

from contextlib import asynccontextmanager
from threading import Thread
from typing import TYPE_CHECKING

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.adapters.api.routes import router
from app.adapters.cleanup import stale_savis_tasks_runner
from app.adapters.database.session import create_database_schema
from app.adapters.rabbitmq import subscriber

if TYPE_CHECKING:
    from collections.abc import AsyncIterator


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Start background consumers for the API process."""
    create_database_schema()
    Thread(target=subscriber.run_forever, daemon=True).start()
    Thread(target=stale_savis_tasks_runner.run_forever, daemon=True).start()
    yield


app = FastAPI(title="Savis Executor API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)
