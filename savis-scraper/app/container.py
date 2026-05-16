from app.adapters.celery.celery_queue import CeleryQueue
from app.adapters.java_api_publisher import JavaApiPublisher
from app.adapters.scrapers import load_scrapers
from app.core.enqueue_scraping_use_case import EnqueueScrapingUseCase
from app.core.execute_scraping_use_case import ExecuteScrapingUseCase


class Container:
    celery_queue = CeleryQueue()
    java_api_publisher = JavaApiPublisher()

    @classmethod
    def enqueue_scraping_use_case(cls):
        return EnqueueScrapingUseCase(cls.celery_queue)

    @classmethod
    def execute_scraping_use_case(cls):
        scrapers = load_scrapers()
        return ExecuteScrapingUseCase(scrapers)
