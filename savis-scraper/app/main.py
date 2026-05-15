"""Main entry point."""

from fastapi import FastAPI

from app.adapters.api.routes import router

app = FastAPI()
app.include_router(router)
