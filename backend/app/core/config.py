import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "FINTRAC - AICTE Security Deposit & FDR Portal"
    APP_ENV: str = "development"
    DEBUG: bool = True
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./fdr_portal.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-aicte-portal-key-26265-prototype-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./storage/uploads")
    MAX_UPLOAD_MB: int = 15
    ALLOWED_MIME_TYPES: list[str] = ["application/pdf", "image/jpeg", "image/png"]
    REMINDER_WINDOWS_DAYS: list[int] = [30, 15, 7, 0]
    APP_TIMEZONE: str = "Asia/Kolkata"
    BANK_VERIFIER_MODE: str = "SFMS_GATEWAY"

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
