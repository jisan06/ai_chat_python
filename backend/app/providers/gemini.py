
from google import genai

from app.providers.base import AIProvider


class GeminiProvider(AIProvider):

    def __init__(self, api_key: str, model: str):
        self.client = genai.Client(api_key=api_key)
        self.model = model

    async def generate(self, message: str) -> str:
        response = await self.client.aio.models.generate_content(
            model=self.model,
            contents=message,
        )

        return response.text or ""
