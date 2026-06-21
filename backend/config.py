from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    groq_api_key: str
    hf_token: str = ""
    app_env: str = "development"
    max_file_size_mb: int = 10
    chroma_persist_dir: str = "./chroma_db"
    embedding_model: str = "BAAI/bge-small-en-v1.5"
    llm_model: str = "llama-3.3-70b-versatile"
    chunk_size: int = 800
    chunk_overlap: int = 100
    top_k: int = 6
    max_history_turns: int = 6
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    auth_username: str
    auth_password: str

    model_config = SettingsConfigDict(
        env_file=[".env", "../.env"],
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
