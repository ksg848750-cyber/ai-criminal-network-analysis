import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    NEO4J_URI = os.getenv("NEO4J_URI", "neo4j://127.0.0.1:7687")
    NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
    NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "Karthik02@")
    # JWT
    JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-key-for-mvp")
    JWT_ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 1440
    
    # AI Config
    AI_PROVIDER = os.getenv("AI_PROVIDER", "gemini")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    AI_MODEL = os.getenv("AI_MODEL", "")

settings = Settings()
