"""Environment params for the Savis scraper application."""

import os


class EnvParams:
    """Configuration settings for the Savis scraper application."""

    JAVA_API_URL = os.getenv("JAVA_API_URL", "http://host.docker.internal:8080/api")
    REDIS_URL = os.getenv("CELERY_RESULT_BACKEND", "redis://redis:6379/0")
    RABBIT_MQ_URL = os.getenv("CELERY_BROKER_URL", "amqp://guest:guest@rabbitmq:5672//")


env_params = EnvParams()
