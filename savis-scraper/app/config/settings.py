import os


class Settings:
    JAVA_API_URL = os.getenv("JAVA_API_URL", "http://host.docker.internal:8080/api")
    REDIS_URL = os.getenv("REDIS_URL", "redis://savis_redis:6379/0")


settings = Settings()
