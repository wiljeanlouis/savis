from app.workers.scraping_tasks import scrape_multi_site


class EnqueueScrapingUseCase:

    def execute(self, task_id: int, term: str):
        scrape_multi_site.delay(task_id, term)
