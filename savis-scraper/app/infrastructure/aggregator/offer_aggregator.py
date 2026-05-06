import logging

logger = logging.getLogger(__name__)


class OfferAggregator:

    def aggregate(self, results: list[list[dict]]) -> list[dict]:

        logger.info(f"[AGGREGATOR] Start aggregation with {len(results)} sources")

        offers = []

        for source_result in results:
            for offer in source_result:

                normalized = self._normalize(offer)

                if normalized:
                    offers.append(normalized)

        # tri par prix croissant
        # offers.sort(key=lambda x: x["price"])

        logger.info(f"[AGGREGATOR] Aggregated {len(offers)} offers")

        return offers

    def _normalize(self, offer: dict) -> dict:

        return offer

        # try:
        #     price = float(offer.get("price", 0))

        #     return {
        #         "title": offer.get("title"),
        #         "price": price,
        #         "size": offer.get("size"),
        #         "brand": offer.get("brand"),
        #         "source": offer.get("source"),
        #     }

        # except Exception as e:
        #     logger.error(f"[AGGREGATOR] Failed to normalize offer: {e}")
        #     return None
