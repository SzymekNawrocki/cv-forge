from __future__ import annotations
from abc import ABC, abstractmethod
import httpx
from selectolax.parser import HTMLParser


class BaseScraper(ABC):
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def fetch_html(self, url: str) -> HTMLParser:
        response = await self._client.get(url)
        response.raise_for_status()
        return HTMLParser(response.text)

    @abstractmethod
    async def scrape(self, url: str) -> list[dict]:
        """Return list of raw job dicts from the given URL."""
