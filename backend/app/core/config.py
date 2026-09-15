from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "학교 AI 활용 가이드라인 준수 플랫폼"
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str = "sqlite:///./app.db"

    @field_validator("DATABASE_URL")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        # 일부 호스팅 제공자(Render 등)는 "postgres://" 접두사로 접속 문자열을
        # 주는데, SQLAlchemy 2.x는 "postgresql://"만 인식하므로 보정합니다.
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v

    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # 벡터 검색용 조항 임베딩 저장 경로
    CHROMA_PERSIST_DIR: str = "./vector_store_data"
    # tfidf(기본, 오프라인) | sentence-transformer(운영, 추가 설치 필요)
    EMBEDDING_PROVIDER: str = "tfidf"

    # 설정 시 챗봇이 근거 조항을 바탕으로 자연어 답변을 생성합니다.
    # 없으면 조항을 그대로 인용하는 추출형 답변으로 자동 대체됩니다.
    ANTHROPIC_API_KEY: str | None = None
    ANTHROPIC_MODEL: str = "claude-sonnet-5"

    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    RETRIEVAL_TOP_K: int = 3
    # 최상위 유사도가 이 값보다 낮으면 "담당 교사 확인 필요"로 안내합니다.
    CONFIDENCE_THRESHOLD: float = 0.15

    # 관리자(교육청/학교) 계정 가입 시 요구되는 초대 코드. 운영 환경에서는
    # 반드시 .env에서 무작위 값으로 변경하세요.
    ADMIN_INVITE_CODE: str = "CHANGE_ME_ADMIN_CODE"


settings = Settings()
