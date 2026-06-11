"""Load html page for test."""

from pathlib import Path


def load_product_details_page_html() -> str:
    """Load html content for test.

    Returns:
        str: _description_

    """
    test_dir = Path(__file__).parent
    html_file = test_dir / "product-details-page.html"

    with Path.open(html_file) as product_file:
        return product_file.read()
