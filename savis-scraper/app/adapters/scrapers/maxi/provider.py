"""Configuration Module for the Maxi provider."""


class MaxiProvider:
    """Maxi provider info."""

    name: str = "Maxi"
    identifier: str = "8772"
    website: str = "https://maxi.ca"
    address: str = "1870 Bd Saint-Joseph, Drummondville, QC"

    def build_search_url(self, search_term: str) -> str:
        """Build the maxi.ca search url for the search term.

        Args:
            search_term (str): The search term for the site

        Returns:
            str: The complete url for with the search term and the store

        """
        return (
            f"{self.website}/fr/search?search-bar={search_term}"
            f"&storeId={self.identifier}"
        )


provider = MaxiProvider()
