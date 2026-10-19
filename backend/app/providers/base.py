
from abc import ABC, abstractmethod


class AIProvider(ABC):

    @abstractmethod
    async def generate(self, message: str) -> str:
        """Generate a response from an AI provider."""
        pass
