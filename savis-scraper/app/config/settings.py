"""Configuration settings module for the Savis scraper application."""

import os


class Settings:
    """Configuration settings for the Savis scraper application."""

    JAVA_API_URL = os.getenv("JAVA_API_URL", "http://host.docker.internal:8080/api")
    REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")


settings = Settings()
