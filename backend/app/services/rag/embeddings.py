from abc import ABC, abstractmethod

from sklearn.feature_extraction.text import HashingVectorizer

from app.core.config import settings


class EmbeddingProvider(ABC):
    @abstractmethod
    def embed_documents(self, texts: list[str]) -> list[list[float]]: ...

    @abstractmethod
    def embed_query(self, text: str) -> list[float]: ...


class HashingEmbeddingProvider(EmbeddingProvider):
    """추가 모델 다운로드 없이 완전히 오프라인으로 동작하는 기본 임베딩 제공자.

    한국어는 조사(을/를/이/가 등)가 단어에 붙어 단어 단위 토큰화로는
    "이름"과 "이름을"이 서로 다른 토큰이 되어 매칭이 잘 안 됩니다. 별도
    형태소 분석기 없이도 이를 완화하기 위해 문자 n-gram(char_wb) 해싱을
    사용합니다. 의미적 정확도는 임베딩 모델보다 낮지만, 별도 설치나 네트워크
    접근 없이 바로 동작해 개발/시연 환경에 적합합니다. 운영 환경에서 더
    정교한 의미 검색이 필요하면 SentenceTransformerEmbeddingProvider로
    교체하세요(EMBEDDING_PROVIDER=sentence-transformer).
    """

    def __init__(self, n_features: int = 2048):
        self._vectorizer = HashingVectorizer(
            n_features=n_features,
            analyzer="char_wb",
            ngram_range=(2, 4),
            alternate_sign=False,
            norm="l2",
        )

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return self._vectorizer.transform(texts).toarray().tolist()

    def embed_query(self, text: str) -> list[float]:
        return self._vectorizer.transform([text]).toarray()[0].tolist()


class SentenceTransformerEmbeddingProvider(EmbeddingProvider):
    """운영 환경용 의미 기반 임베딩 제공자.

    사용하려면 requirements에 sentence-transformers(및 torch)를 추가로
    설치해야 합니다.
    """

    def __init__(self, model_name: str = "jhgan/ko-sroberta-multitask"):
        from sentence_transformers import SentenceTransformer  # 지연 임포트(선택적 의존성)

        self._model = SentenceTransformer(model_name)

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return self._model.encode(texts, normalize_embeddings=True).tolist()

    def embed_query(self, text: str) -> list[float]:
        return self._model.encode([text], normalize_embeddings=True)[0].tolist()


_provider_instance: EmbeddingProvider | None = None


def get_embedding_provider() -> EmbeddingProvider:
    global _provider_instance
    if _provider_instance is None:
        if settings.EMBEDDING_PROVIDER == "sentence-transformer":
            _provider_instance = SentenceTransformerEmbeddingProvider()
        else:
            _provider_instance = HashingEmbeddingProvider()
    return _provider_instance
