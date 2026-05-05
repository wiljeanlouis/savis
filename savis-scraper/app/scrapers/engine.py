from app.scrapers.maxi import scraper as maxi
from app.schemas.scraping_task import ScrapingTask
from app.schemas.offer import Offer
from app.webhook import java_client


async def run_scraper(task: ScrapingTask):
    print(f"Démarrage du scraping pour: {task.searchTerm}")

    # On peut paralléliser ici si on a plusieurs sites
    results: list[Offer] = await maxi.scrape(task.searchTerm)

    print(f"The results size {len(results)}")
    print(f"The results {results}")

    # On renvoie tout à Java
    await java_client.send_results(task.id, results)
