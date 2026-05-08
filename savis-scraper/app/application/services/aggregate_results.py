"""Aggregate results from multiple scraping operations."""

import logging

logger = logging.getLogger(__name__)


def aggregate(results: list[list[dict]]) -> list[dict]:

    logger.info("[AGGREGATOR] Start aggregation with {%s} sources", len(results))

    offers = []

    for source_result in results:
        for offer in source_result:
            normalized = _normalize(offer)

            if normalized:
                offers.append(normalized)

    # tri par prix croissant
    # offers.sort(key=lambda x: x["price"])

    logger.info("[AGGREGATOR] Aggregated {%s} offers", len(results))

    return offers


def _normalize(offer: dict) -> dict:

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
