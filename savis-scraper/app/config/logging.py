"""Configure logging for the application."""

import logging


def setup_logging() -> None:
    """Configure the root logger for the application."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )
