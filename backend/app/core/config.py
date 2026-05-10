from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "AI Smart Sales Hub"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@db:5432/sales_hub"

    # JWT
    JWT_SECRET: str = "change-this-secret-in-production-minimum-32-chars"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 hari

    # AI Gemini
    GEMINI_API_KEY: str = ""

    # Firebase FCM
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_CLIENT_EMAIL: str = ""
    FIREBASE_PRIVATE_KEY: str = ""

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    @property
    def gemini_available(self) -> bool:
        return bool(self.GEMINI_API_KEY)

    @property
    def firebase_available(self) -> bool:
        return bool(
            self.FIREBASE_PROJECT_ID
            and self.FIREBASE_CLIENT_EMAIL
            and self.FIREBASE_PRIVATE_KEY
        )

    model_config = {"env_file": ".env", "case_sensitive": True}


settings = Settings()
