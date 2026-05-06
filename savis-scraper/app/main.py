from fastapi import FastAPI
from app.api.routes.scraping_routes import router
from app.config.logging import setup_logging

setup_logging()

app = FastAPI()
app.include_router(router)
