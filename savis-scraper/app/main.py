import logging
from fastapi import FastAPI
from app.api import routes

app = FastAPI(title="SAVIS Scraper Service")

app.include_router(routes.router)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=5000)
